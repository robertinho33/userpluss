import { db, doc } from './firebase.js';
import { ComandaManager } from './comandas.js';
import { ModalPagamento } from './modal.js';
import { ServicoManager } from './servicos.js';

async function inicializar() {
    console.log("Inicializando aplicação...");
    const querySnapshot = await ComandaManager.carregarComandas();
    if (!querySnapshot) {
        console.error("Nenhum dado retornado de carregarComandas");
    }

    document.getElementById('addServiceBtn').addEventListener('click', () => {
        ServicoManager.adicionarServico(document.getElementById("servicos-container"));
    });

    document.getElementById('registroForm').addEventListener('submit', async (event) => {
        event.preventDefault();
    
        const clienteInput = document.getElementById("cliente");
        const dataInput = document.getElementById("data");
        const observacoesInput = document.getElementById("observacoes"); // Pode ser null
        const totalInput = document.getElementById("total");
    
        if (!clienteInput || !dataInput || !totalInput) {
            console.error("Elementos obrigatórios do formulário não foram encontrados:", {
                cliente: clienteInput,
                data: dataInput,
                observacoes: observacoesInput,
                total: totalInput
            });
            alert("Erro: Formulário incompleto. Verifique o console para mais detalhes.");
            return;
        }
    
        const formData = {
            cliente: clienteInput.value,
            data: dataInput.value,
            observacoes: observacoesInput ? observacoesInput.value : "", // Usa "" se não existir
            total: parseFloat(totalInput.value),
            servicos: ServicoManager.getServicos()
        };
    
        const sucesso = await ComandaManager.registrarComanda(formData);
        if (sucesso) {
            alert("Comanda registrada com sucesso!");
            document.getElementById("registroForm").reset();
            document.getElementById("servicos-container").innerHTML = "";
            await ComandaManager.carregarComandas();
        } else {
            alert("Erro ao registrar comanda.");
        }
    });

    document.getElementById('cancelPaymentBtn').addEventListener('click', () => ModalPagamento.fechar());

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('fecharComanda')) {
            const btn = e.target;
            if (btn.dataset.status === "aberta") {
                ModalPagamento.abrir(doc(db, "comandas", btn.dataset.id));
            }
        }
    });

    document.getElementById('fecharCaixaBtn').addEventListener('click', () => {
        if (querySnapshot) {
            ComandaManager.mostrarFechamentoCaixa(querySnapshot);
        } else {
            alert("Erro ao carregar dados para o fechamento de caixa.");
        }
    });

    document.getElementById('fecharCaixaDiaBtn').addEventListener('click', async () => {
        await ComandaManager.fecharCaixaDia();
    });

    document.getElementById('consultarMesBtn').addEventListener('click', () => {
        const mesAno = document.getElementById("mesConsultaForm").value;
        if (mesAno) {
            ComandaManager.consultarFaturamentoMensal(mesAno);
        } else {
            alert("Por favor, selecione um mês para consultar.");
        }
    });
    document.getElementById('corrigirCaixasBtn').addEventListener('click', async () => {
        await ComandaManager.corrigirComandasAbertasPassadas();
    });
    // ... resto do código
    document.getElementById('cancelPaymentBtn').addEventListener('click', () => ModalPagamento.fechar());

}


window.onload = inicializar;