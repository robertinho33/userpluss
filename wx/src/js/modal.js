import { doc, updateDoc } from './firebase.js';

export class ModalPagamento {
    static abrir(docRef) {
        const modal = document.getElementById("modalPagamento");
        if (modal) {
            modal.style.display = "block";

            const form = document.getElementById("formPagamento");
            form.onsubmit = async (e) => {
                e.preventDefault();
                const formaPagamento = document.getElementById("formaPagamento").value;
                const bandeira = (formaPagamento === "Cartão de Crédito" || formaPagamento === "Cartão de Débito") 
                    ? document.getElementById("bandeiraPagamento").value 
                    : null;

                try {
                    await updateDoc(docRef, {
                        status: "fechada",
                        formaPagamento: formaPagamento,
                        bandeira: bandeira || null,
                        fechadoEm: new Date()
                    });
                    alert("Comanda fechada com sucesso!");
                    this.fechar();
                    // Recarregar as comandas após fechar
                    await ComandaManager.carregarComandas();
                } catch (error) {
                    console.error("Erro ao fechar comanda:", error);
                    alert("Erro ao fechar comanda.");
                }
            };
            
        }// ... resto do código
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('fecharComanda')) {
        const btn = e.target;
        if (btn.dataset.status === "aberta") {
            ModalPagamento.abrir(doc(db, "comandas", btn.dataset.id));
        }
    }
});
    }

    static fechar() {
        const modal = document.getElementById("modalPagamento");
        if (modal) {
            modal.style.display = "none";
        }
    }
}

// Importar ComandaManager para usar carregarComandas
import { ComandaManager } from './comandas.js';