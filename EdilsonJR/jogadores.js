document.addEventListener("DOMContentLoaded", carregarJogadores);

// ===============================
// CARREGAR E EXIBIR JOGADORES
// ===============================
function carregarJogadores() {
    const dados = JSON.parse(localStorage.getItem("jogadores")) || [];
    const tbody = document.getElementById("tabela-jogadores");
    const totalContagem = document.getElementById("total-contagem");

    tbody.innerHTML = "";
    if (totalContagem) totalContagem.textContent = dados.length;

    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum jogador cadastrado.</td></tr>`;
        return;
    }

    dados.forEach((jogador, index) => {
        const nome = typeof jogador === "object" ? jogador.nome : jogador;
        const apelido = typeof jogador === "object" ? (jogador.apelido || "-") : "-";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${nome}</strong></td>
            <td>${apelido}</td>
            <td>
                <button class="btn-acao btn-editar" onclick="editarJogador(${index})">✏️ Editar</button>
                <button class="btn-acao btn-excluir" onclick="excluirJogador(${index})">🗑️ Excluir</button>
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

    const novoNome = prompt("Editar Nome do Jogador:", nomeAtual);
    if (novoNome === null || novoNome.trim() === "") return;

    const novoApelido = prompt("Editar Apelido do Jogador:", apelidoAtual);

    if (typeof jogadorAtual === "object") {
        dados[index].nome = novoNome.trim();
        dados[index].apelido = novoApelido ? novoApelido.trim() : "";
    } else {
        dados[index] = novoApelido ? { nome: novoNome.trim(), apelido: novoApelido.trim() } : novoNome.trim();
    }

    localStorage.setItem("jogadores", JSON.stringify(dados));
    carregarJogadores();
}

// ===============================
// EXCLUIR JOGADOR
// ===============================
function excluirJogador(index) {
    let dados = JSON.parse(localStorage.getItem("jogadores")) || [];
    
    const nomeJogador = typeof dados[index] === "object" ? dados[index].nome : dados[index];

    if (confirm(`Tem certeza que deseja remover ${nomeJogador} do torneio?`)) {
        dados.splice(index, 1);
        localStorage.setItem("jogadores", JSON.stringify(dados));
        carregarJogadores();
    }
}