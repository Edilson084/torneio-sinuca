document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal-gerenciar");
    const btnAbrir = document.getElementById("btn-gerenciar");
    const btnFechar = document.querySelector(".fechar-modal");

    if (btnAbrir) {
        btnAbrir.addEventListener("click", () => {
            carregarJogadoresModal();
            modal.style.display = "block";
        });
    }

    if (btnFechar) {
        btnFechar.addEventListener("click", () => modal.style.display = "none");
    }

    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    // Carrega a lista ao iniciar
    carregarJogadoresModal();
});

// ===============================
// CARREGAR JOGADORES NO MODAL
// ===============================
function carregarJogadoresModal() {
    const dados = JSON.parse(localStorage.getItem("jogadores")) || [];
    const tbody = document.getElementById("tabela-jogadores") || document.getElementById("tabela-teste");
    const totalContagem = document.getElementById("total-contagem");

    if (!tbody) return;
    tbody.innerHTML = "";

    if (totalContagem) totalContagem.textContent = dados.length;

    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:12px;">Nenhum jogador cadastrado.</td></tr>`;
        return;
    }

    dados.forEach((jogador, index) => {
        const nome = typeof jogador === "object" ? jogador.nome : jogador;
        const apelido = typeof jogador === "object" ? (jogador.apelido || "-") : "-";

        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid rgba(255, 255, 255, 0.08)";
        tr.innerHTML = `
            <td style="padding: 10px;">${index + 1}</td>
            <td style="padding: 10px;"><strong>${nome}</strong></td>
            <td style="padding: 10px;">${apelido}</td>
            <td style="padding: 10px;">
                <button class="btn-acao btn-editar" onclick="editarJogador(${index})" style="background:#ffc107; color:#000; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold; margin-right:4px;">✏️ Editar</button>
                <button class="btn-acao btn-excluir" onclick="excluirJogador(${index})" style="background:#dc3545; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">🗑️ Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ===============================
// EDITAR JOGADOR
// ===============================
function editarJogador(index) {
    let dados = JSON.parse(localStorage.getItem("jogadores")) || [];
    const jogadorAtual = dados[index];

    let nomeAtual = typeof jogadorAtual === "object" ? jogadorAtual.nome : jogadorAtual;
    let apelidoAtual = typeof jogadorAtual === "object" ? (jogadorAtual.apelido || "") : "";

    const novoNome = prompt("Novo Nome do jogador:", nomeAtual);
    if (!novoNome || novoNome.trim() === "") return;

    const novoApelido = prompt("Novo Apelido (opcional):", apelidoAtual);

    if (typeof jogadorAtual === "object") {
        dados[index].nome = novoNome.trim();
        dados[index].apelido = novoApelido ? novoApelido.trim() : "";
    } else {
        dados[index] = novoApelido && novoApelido.trim() !== "" 
            ? { nome: novoNome.trim(), apelido: novoApelido.trim() } 
            : novoNome.trim();
    }

    localStorage.setItem("jogadores", JSON.stringify(dados));
    carregarJogadoresModal();

    const totalTela = document.getElementById("total-jogadores");
    if (totalTela) totalTela.textContent = dados.length;
}

// ===============================
// EXCLUIR JOGADOR
// ===============================
function excluirJogador(index) {
    let dados = JSON.parse(localStorage.getItem("jogadores")) || [];
    const nome = typeof dados[index] === "object" ? dados[index].nome : dados[index];

    if (confirm(`Remover "${nome}" do torneio?`)) {
        dados.splice(index, 1);
        localStorage.setItem("jogadores", JSON.stringify(dados));
        carregarJogadoresModal();

        const totalTela = document.getElementById("total-jogadores");
        if (totalTela) totalTela.textContent = dados.length;
    }
}