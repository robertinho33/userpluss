import { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    doc, 
    query, 
    where 
} from './firebase.js';
import { ModalPagamento } from './modal.js';

export class ComandaManager {
    static async carregarComandas() {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            console.log("Data atual:", today);
            console.log("Intervalo de busca:", startOfDay, "até", endOfDay);

            const q = query(
                collection(db, "comandas"), 
                where("criadoEm", ">=", startOfDay), 
                where("criadoEm", "<=", endOfDay)
            );
            console.log("Executando consulta ao Firestore...");
            const querySnapshot = await getDocs(q);
            console.log("Número de comandas encontradas:", querySnapshot.size);

            const tabela = document.getElementById("tabelaComandas");
            if (!tabela) {
                console.error("Elemento 'tabelaComandas' não encontrado no DOM");
                return null;
            }
            tabela.innerHTML = "";

            if (querySnapshot.empty) {
                console.log("Nenhuma comanda encontrada para o dia de hoje.");
                tabela.innerHTML = "<tr><td colspan='6'>Nenhuma comanda registrada hoje.</td></tr>";
            } else {
                querySnapshot.forEach(docSnap => {
                    const comanda = docSnap.data();
                    console.log("Comanda encontrada:", comanda);
                    const row = this.criarLinhaComanda(docSnap.id, comanda);
                    tabela.appendChild(row);
                });
            }

            this.carregarListaClientes(querySnapshot);
            return querySnapshot;
        } catch (error) {
            console.error("Erro ao carregar comandas:", error);
            return null;
        }
    }

    static criarLinhaComanda(id, comanda) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${comanda.cliente || 'N/A'}</td>
            <td>${comanda.data || 'N/A'}</td>
            <td>${this.formatarServicos(comanda.servicos)}</td>
            <td>R$${comanda.total?.toFixed(2) || '0.00'}</td>
            <td>${comanda.status || 'Pendente'}</td>
            <td><button class="btn btn-success fecharComanda" data-id="${id}" data-status="${comanda.status || 'Pendente'}">Fechar</button></td>
        `;
        return row;
    }

    static formatarServicos(servicos) {
        return servicos?.map(s => `${s.profissional || 'N/A'} - ${s.servico || 'N/A'} (R$${s.valor?.toFixed(2) || '0.00'})`).join('<br>') || 'N/A';
    }

    static async registrarComanda(formData) {
        try {
            const docRef = await addDoc(collection(db, "comandas"), {
                ...formData,
                status: "aberta",
                criadoEm: new Date()
            });
            console.log("Comanda registrada com ID:", docRef.id);
            return true;
        } catch (error) {
            console.error("Erro ao salvar no Firestore:", error);
            return false;
        }
    }

    static carregarListaClientes(querySnapshot) {
        const listaAbertas = document.getElementById("listaClientesAbertas");
        const listaFechadas = document.getElementById("listaClientesFechadas");

        if (!listaAbertas || !listaFechadas) {
            console.error("Elementos 'listaClientesAbertas' ou 'listaClientesFechadas' não encontrados no DOM");
            return;
        }

        listaAbertas.innerHTML = "";
        listaFechadas.innerHTML = "";

        const clientesMapAbertas = new Map();
        const clientesMapFechadas = new Map();

        console.log("Processando comandas para lista de clientes...");
        querySnapshot.forEach(docSnap => {
            const comanda = docSnap.data();
            const clienteData = { id: docSnap.id, ...comanda };
            if (comanda.status === "aberta") {
                if (!clientesMapAbertas.has(comanda.cliente)) {
                    clientesMapAbertas.set(comanda.cliente, []);
                }
                clientesMapAbertas.get(comanda.cliente).push(clienteData);
            } else if (comanda.status === "fechada") {
                if (!clientesMapFechadas.has(comanda.cliente)) {
                    clientesMapFechadas.set(comanda.cliente, []);
                }
                clientesMapFechadas.get(comanda.cliente).push(clienteData);
            }
        });

        const clientesAbertas = [...clientesMapAbertas.keys()].sort((a, b) => a.localeCompare(b));
        console.log("Clientes com comandas abertas:", clientesAbertas);
        if (clientesAbertas.length === 0) {
            listaAbertas.innerHTML = "<li>Nenhuma comanda aberta hoje.</li>";
        } else {
            clientesAbertas.forEach(cliente => {
                const li = document.createElement("li");
                li.textContent = cliente;
                li.classList.add("aberta");
                li.dataset.cliente = cliente;
                li.addEventListener('click', () => this.mostrarDetalhesComanda(clientesMapAbertas.get(cliente)));
                listaAbertas.appendChild(li);
            });
        }

        const clientesFechadas = [...clientesMapFechadas.keys()].sort((a, b) => a.localeCompare(b));
        console.log("Clientes com comandas fechadas:", clientesFechadas);
        if (clientesFechadas.length === 0) {
            listaFechadas.innerHTML = "<li>Nenhuma comanda fechada hoje.</li>";
        } else {
            clientesFechadas.forEach(cliente => {
                const li = document.createElement("li");
                li.textContent = cliente;
                li.classList.add("fechada");
                listaFechadas.appendChild(li);
            });
        }
    }

    static async corrigirComandasAbertasPassadas() {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));

            const q = query(
                collection(db, "comandas"),
                where("criadoEm", "<", startOfDay),
                where("status", "==", "aberta")
            );

            console.log("Buscando comandas abertas em dias passados...");
            const querySnapshot = await getDocs(q);
            console.log("Comandas abertas em dias passados:", querySnapshot.size);

            if (querySnapshot.size > 0) {
                const comandasAbertas = querySnapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                }));
                this.mostrarComandasAbertasPassadas(comandasAbertas);
            } else {
                alert("Nenhuma comanda aberta encontrada em dias passados.");
            }
        } catch (error) {
            console.error("Erro ao corrigir comandas abertas passadas:", error);
            if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
                alert("A consulta requer um índice que está sendo criado. Aguarde alguns minutos e tente novamente. Veja o status no Firebase Console.");
            } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
                alert("Erro de conexão com o Firestore. Verifique sua internet e tente novamente.");
            } else {
                alert("Erro ao listar comandas abertas. Verifique o console para mais detalhes.");
            }
        }
    }

    static mostrarComandasAbertasPassadas(comandas) {
        const modal = document.getElementById("modalDetalhesComanda");
        const title = document.getElementById("modalDetalhesTitle");
        const content = document.getElementById("detalhesComandaContent");
        if (!modal || !content || !title) {
            console.error("Elementos do modal de detalhes não encontrados no DOM");
            return;
        }
    
        title.textContent = "Comandas Abertas do Mês";
        content.innerHTML = ""; // Limpa o conteúdo anterior
    
        comandas.forEach(comanda => {
            const criadoEmDate = comanda.criadoEm && comanda.criadoEm.toDate ? comanda.criadoEm.toDate() : new Date(comanda.criadoEm || Date.now());
            const div = document.createElement("div");
            div.classList.add("mb-3");
            div.innerHTML = `
                <p><strong>Cliente:</strong> ${comanda.cliente || 'N/A'}</p>
                <p><strong>Data de Criação:</strong> ${criadoEmDate.toLocaleDateString() || 'N/A'}</p>
                <p><strong>Serviços:</strong> ${this.formatarServicos(comanda.servicos)}</p>
                <p><strong>Total:</strong> R$${comanda.total?.toFixed(2) || '0.00'}</p>
                <p><strong>Status:</strong> ${comanda.status || 'Pendente'}</p>
                <button class="btn btn-success fecharComandaManual" data-id="${comanda.id}">Fechar Comanda</button>
                <hr>
            `;
            content.appendChild(div);
        });
    
        modal.style.display = 'block'; // Exibe o modal
    
        // Adiciona evento aos botões de fechar
        content.querySelectorAll('.fecharComandaManual').forEach(btn => {
            btn.addEventListener('click', () => {
                const docRef = doc(db, "comandas", btn.dataset.id);
                ModalPagamento.abrir(docRef);
            });
        });
    
        document.getElementById("fecharModalDetalhesBtn").onclick = () => {
            modal.style.display = 'none';
        };
    }

    static mostrarDetalhesComanda(comandas) {
        const modal = document.getElementById("modalDetalhesComanda");
        const title = document.getElementById("modalDetalhesTitle");
        const content = document.getElementById("detalhesComandaContent");
        if (!modal || !content || !title) {
            console.error("Elementos do modal de detalhes não encontrados no DOM");
            return;
        }
        title.textContent = "Detalhes da Comanda";
        content.innerHTML = "";

        comandas.forEach(comanda => {
            const div = document.createElement("div");
            div.classList.add("mb-3");
            div.innerHTML = `
                <p><strong>Data:</strong> ${comanda.data || 'N/A'}</p>
                <p><strong>Serviços:</strong> ${this.formatarServicos(comanda.servicos)}</p>
                <p><strong>Total:</strong> R$${comanda.total?.toFixed(2) || '0.00'}</p>
                <p><strong>Status:</strong> ${comanda.status || 'Pendente'}</p>
                <p><strong>Observações:</strong> ${comanda.observacoes || 'Nenhuma'}</p>
            `;
            content.appendChild(div);
        });

        modal.style.display = 'block';

        const fecharBtn = document.getElementById("fecharComandaBtn");
        if (fecharBtn) {
            fecharBtn.onclick = () => {
                const comandaAberta = comandas.find(c => c.status === "aberta");
                if (comandaAberta) {
                    const docRef = doc(db, "comandas", comandaAberta.id);
                    ModalPagamento.abrir(docRef);
                    modal.style.display = 'none';
                } else {
                    alert("Nenhuma comanda aberta para fechar.");
                }
            };
        }

        document.getElementById("fecharModalDetalhesBtn").onclick = () => {
            modal.style.display = 'none';
        };
    }

    static async fecharCaixaDia() {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            const q = query(
                collection(db, "comandas"),
                where("criadoEm", ">=", startOfDay),
                where("criadoEm", "<=", endOfDay),
                where("status", "==", "aberta")
            );

            const querySnapshot = await getDocs(q);
            console.log("Comandas abertas hoje:", querySnapshot.size);

            if (querySnapshot.size > 0) {
                alert(`Existem ${querySnapshot.size} comanda(s) aberta(s) hoje. Feche-as manualmente antes de fechar o caixa.`);
                return;
            }

            const updatedSnapshot = await this.carregarComandas();
            if (updatedSnapshot) {
                this.mostrarFechamentoCaixa(updatedSnapshot);
            }
        } catch (error) {
            console.error("Erro ao fechar caixa do dia:", error);
            alert("Erro ao fechar o caixa. Verifique o console para mais detalhes.");
        }
    }

    static async consultarFaturamentoMensal(mesAno) {
        try {
            const [ano, mes] = mesAno.split('-');
            const inicioMes = new Date(ano, mes - 1, 1);
            const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);
    
            console.log("Consultando comandas de", inicioMes, "até", fimMes);
    
            // Consulta para todas as comandas do mês (abertas e fechadas)
            const q = query(
                collection(db, "comandas"),
                where("criadoEm", ">=", inicioMes),
                where("criadoEm", "<=", fimMes)
            );
    
            console.log("Executando consulta de comandas do mês...");
            const querySnapshot = await getDocs(q);
            console.log("Total de comandas no mês:", querySnapshot.size);
    
            if (querySnapshot.empty) {
                console.log("Nenhuma comanda encontrada para o período selecionado.");
            }
    
            const modal = document.getElementById("modalFechamentoCaixa");
            const content = document.getElementById("fechamentoCaixaContent");
            if (!modal || !content) {
                console.error("Elementos do modal de fechamento não encontrados no DOM");
                return;
            }
            content.innerHTML = "";
    
            // Contadores e dados
            let comandasAbertas = 0;
            let comandasFechadas = 0;
            const formasPagamento = {
                "Dinheiro": 0,
                "Cartão de Crédito": {},
                "Cartão de Débito": {},
                "Pix": 0
            };
            let totalGeral = 0;
            const comandasAbertasLista = []; // Para armazenar comandas abertas
    
            querySnapshot.forEach(docSnap => {
                const comanda = docSnap.data();
                console.log("Comanda processada:", comanda);
    
                if (comanda.status === "aberta") {
                    comandasAbertas++;
                    comandasAbertasLista.push({ id: docSnap.id, ...comanda });
                } else if (comanda.status === "fechada") {
                    comandasFechadas++;
                    const valor = comanda.total || 0;
                    totalGeral += valor;
                    if (comanda.formaPagamento === "Cartão de Crédito" || comanda.formaPagamento === "Cartão de Débito") {
                        const bandeira = comanda.bandeira || "Desconhecida";
                        formasPagamento[comanda.formaPagamento][bandeira] = 
                            (formasPagamento[comanda.formaPagamento][bandeira] || 0) + valor;
                    } else {
                        formasPagamento[comanda.formaPagamento] += valor;
                    }
                }
            });
    
            // Construir o conteúdo do modal
            const div = document.createElement("div");
            div.innerHTML = `
                <h5>Faturamento Mensal - ${mes}/${ano}</h5>
                <p><strong>Total de Comandas Abertas:</strong> ${comandasAbertas}</p>
                <p><strong>Total de Comandas Fechadas:</strong> ${comandasFechadas}</p>
                <p><strong>Dinheiro:</strong> R$${formasPagamento["Dinheiro"].toFixed(2)}</p>
                <p><strong>Cartão de Crédito:</strong></p>
                ${Object.entries(formasPagamento["Cartão de Crédito"]).map(([bandeira, valor]) => 
                    `<p style="margin-left: 20px;">- ${bandeira}: R$${valor.toFixed(2)}</p>`).join('')}
                <p><strong>Cartão de Débito:</strong></p>
                ${Object.entries(formasPagamento["Cartão de Débito"]).map(([bandeira, valor]) => 
                    `<p style="margin-left: 20px;">- ${bandeira}: R$${valor.toFixed(2)}</p>`).join('')}
                <p><strong>Pix:</strong> R$${formasPagamento["Pix"].toFixed(2)}</p>
                <hr>
                <p><strong>Total Geral (Fechadas):</strong> R$${totalGeral.toFixed(2)}</p>
            `;
    
            // Adicionar botão para consultar comandas abertas, se houver
            if (comandasAbertas > 0) {
                const btnConsultarAbertas = document.createElement("button");
                btnConsultarAbertas.className = "btn btn-info mt-3";
                btnConsultarAbertas.textContent = "Ver Comandas Abertas";
                btnConsultarAbertas.onclick = () => {
                    document.getElementById("modalFechamentoCaixa").style.display = 'none'; // Fecha o modal de faturamento
                    this.mostrarComandasAbertasPassadas(comandasAbertasLista);
                };
                div.appendChild(btnConsultarAbertas);
            }
    
            content.appendChild(div);
    
            modal.style.display = 'block';
            document.getElementById("fecharModalCaixaBtn").onclick = () => {
                modal.style.display = 'none';
            };
        } catch (error) {
            console.error("Erro ao consultar faturamento mensal:", error);
            alert("Erro ao consultar o mês. Verifique o console para mais detalhes.");
        }
    }

    static mostrarFechamentoCaixa(querySnapshot) {
        const modal = document.getElementById("modalFechamentoCaixa");
        const content = document.getElementById("fechamentoCaixaContent");
        if (!modal || !content) {
            console.error("Elementos do modal de fechamento não encontrados no DOM");
            return;
        }
        content.innerHTML = "";

        const formasPagamento = {
            "Dinheiro": 0,
            "Cartão de Crédito": {},
            "Cartão de Débito": {},
            "Pix": 0
        };
        let totalGeral = 0;

        querySnapshot.forEach(docSnap => {
            const comanda = docSnap.data();
            if (comanda.status === "fechada") {
                const valor = comanda.total || 0;
                totalGeral += valor;
                if (comanda.formaPagamento === "Cartão de Crédito" || comanda.formaPagamento === "Cartão de Débito") {
                    const bandeira = comanda.bandeira || "Desconhecida";
                    formasPagamento[comanda.formaPagamento][bandeira] = 
                        (formasPagamento[comanda.formaPagamento][bandeira] || 0) + valor;
                } else {
                    formasPagamento[comanda.formaPagamento] += valor;
                }
            }
        });

        const div = document.createElement("div");
        div.innerHTML = `
            <h5>Fechamento de Caixa - Hoje</h5>
            <p><strong>Dinheiro:</strong> R$${formasPagamento["Dinheiro"].toFixed(2)}</p>
            <p><strong>Cartão de Crédito:</strong></p>
            ${Object.entries(formasPagamento["Cartão de Crédito"]).map(([bandeira, valor]) => 
                `<p style="margin-left: 20px;">- ${bandeira}: R$${valor.toFixed(2)}</p>`).join('')}
            <p><strong>Cartão de Débito:</strong></p>
            ${Object.entries(formasPagamento["Cartão de Débito"]).map(([bandeira, valor]) => 
                `<p style="margin-left: 20px;">- ${bandeira}: R$${valor.toFixed(2)}</p>`).join('')}
            <p><strong>Pix:</strong> R$${formasPagamento["Pix"].toFixed(2)}</p>
            <hr>
            <p><strong>Total Geral:</strong> R$${totalGeral.toFixed(2)}</p>
        `;
        content.appendChild(div);

        modal.style.display = 'block';
        document.getElementById("fecharModalCaixaBtn").onclick = () => {
            modal.style.display = 'none';
        };
    }
    static criarLinhaComanda(id, comanda) {
        const row = document.createElement('tr');
        const status = comanda.status || 'Pendente';
        const buttonHtml = status === "fechada" 
            ? `<button class="btn btn-warning" disabled>Fechada</button>`
            : `<button class="btn btn-success fecharComanda" data-id="${id}" data-status="${status}">Fechar</button>`;
    
        row.innerHTML = `
            <td>${comanda.cliente || 'N/A'}</td>
            <td>${comanda.data || 'N/A'}</td>
            <td>${this.formatarServicos(comanda.servicos)}</td>
            <td>R$${comanda.total?.toFixed(2) || '0.00'}</td>
            <td>${status}</td>
            <td>${buttonHtml}</td>
        `;
        return row;
    }
}