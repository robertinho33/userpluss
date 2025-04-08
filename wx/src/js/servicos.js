export class ServicoManager {
    static SERVICOS_DISPONIVEIS = [
        { tipo: "Corte", profissionais: ["Ana", "Carlos"] },
        { tipo: "Coloração", profissionais: ["Fernanda", "Marcos"] },
        { tipo: "Manicure", profissionais: ["Beatriz", "Juliana"] },
        { tipo: "Massagem", profissionais: ["Ricardo", "Tatiane"] }
    ];

    static adicionarServico(container) {
        const id = `servico-${Date.now()}`;
        const div = document.createElement("div");
        div.classList.add("d-flex", "gap-2", "mb-2");
        div.innerHTML = `
            <select class="form-control servico-select" data-id="${id}">
                <option value="">Selecione um serviço</option>
                ${this.SERVICOS_DISPONIVEIS.map(s => `<option value="${s.tipo}">${s.tipo}</option>`).join("")}
            </select>
            <select class="form-control profissional-select" id="profissional-${id}">
                <option value="">Selecione um profissional</option>
            </select>
            <input type="number" class="form-control valor" placeholder="Valor (R$)" step="0.01">
            <button type="button" class="btn btn-danger remove-btn">X</button>
        `;
        container.appendChild(div);

        div.querySelector('.servico-select').addEventListener('change', (e) => this.atualizarProfissionais(e.target, id));
        div.querySelector('.valor').addEventListener('input', this.calcularTotal);
        div.querySelector('.remove-btn').addEventListener('click', (e) => this.removerServico(e.target));
    }

    static atualizarProfissionais(select, id) {
        const tipo = select.value;
        const profissionalSelect = document.getElementById(`profissional-${id}`);
        const servico = this.SERVICOS_DISPONIVEIS.find(s => s.tipo === tipo);
        profissionalSelect.innerHTML = "<option value=''>Selecione um profissional</option>";
        if (servico) {
            servico.profissionais.forEach(p => {
                profissionalSelect.innerHTML += `<option value="${p}">${p}</option>`;
            });
        }
        this.calcularTotal();
    }

    static calcularTotal() {
        const total = Array.from(document.querySelectorAll(".valor"))
            .reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);
        document.getElementById("total").value = total.toFixed(2);
    }

    static removerServico(button) {
        button.parentElement.remove();
        this.calcularTotal();
    }

    static getServicos() {
        const servicos = [];
        document.querySelectorAll("#servicos-container div").forEach(div => {
            const servico = div.children[0].value;
            const profissional = div.children[1].value;
            const valor = parseFloat(div.children[2].value);
            if (servico && profissional && valor) {
                servicos.push({ servico, profissional, valor });
            }
        });
        return servicos;
    }
}