// --- BLOQUEIO DE SEGURANÇA PARA NÃO-ADMINS ---
const perfilLogado = localStorage.getItem("usuario_perfil");
if (perfilLogado !== "admin") {
    alert("Acesso negado! Esta área é restrita apenas para administradores.");
    window.location.href = "classificacao.html"; // Expulsa o usuário de volta para a tela principal
}

document.addEventListener("DOMContentLoaded", () => {
    carregarJogadores();
});

function carregarJogadores() {
    const tbody = document.getElementById("tabela-jogadores");
    if (!tbody) return;
    tbody.innerHTML = "";

    let jogadores = [];
    try {
        jogadores = JSON.parse(localStorage.getItem("jogadores")) || [];
    } catch (e) {
        console.error("Erro ao ler o localStorage:", e);
        jogadores = [];
    }

    if (jogadores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888;">Nenhum jogador inscrito no momento.</td></tr>`;
        return;
    }

    jogadores.forEach((jogador, index) => {
        if (!jogador) return;
        
        const nomeExibicao = jogador.apelido || jogador.nome || "Sem nome";
        const identificador = jogador.cpf || jogador.email || "Não informado";
        
        // Identifica a forma de pagamento escolhida
        let tipoPagamento = jogador.formaPagamento ? jogador.formaPagamento.toUpperCase() : "NÃO INFORMADO";
        let estiloPagamento = tipoPagamento === "PIX" ? "color: #00bf63;" : "color: #ffc107;";

        // Define se está pago ou pendente
        const statusPagamento = jogador.pago === true ? 
            `<span class="badge-pago"><i class="fa-solid fa-check"></i> Pago</span>` : 
            `<span class="badge-pendente"><i class="fa-solid fa-clock"></i> Pendente (${tipoPagamento})</span>`;

        const textoBotaoPagamento = jogador.pago === true ? "Marcar Pendente" : "Marcar Pago";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${nomeExibicao}</td>
            <td>
                ${identificador}<br>
                <small style="${estiloPagamento} font-weight: bold;">Forma: ${tipoPagamento}</small>
            </td>
            <td>${statusPagamento}</td>
            <td>
                <button class="btn-acao btn-pagamento" onclick="alternarPagamento(${index})">${textoBotaoPagamento}</button>
                <button class="btn-acao btn-editar" onclick="editarJogador(${index})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-acao btn-excluir" onclick="excluirJogador(${index})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function alternarPagamento(index) {
    let jogadores = JSON.parse(localStorage.getItem("jogadores")) || [];
    jogadores[index].pago = !jogadores[index].pago;
    localStorage.setItem("jogadores", JSON.stringify(jogadores));
    carregarJogadores();
}

function editarJogador(index) {
    let jogadores = JSON.parse(localStorage.getItem("jogadores")) || [];
    let jogador = jogadores[index];

    let novoNome = prompt("Edite o nome ou apelido do jogador:", jogador.apelido || jogador.nome);
    
    if (novoNome !== null && novoNome.trim() !== "") {
        if (jogador.apelido !== undefined) {
            jogador.apelido = novoNome.trim();
        } else {
            jogador.nome = novoNome.trim();
        }

        localStorage.setItem("jogadores", JSON.stringify(jogadores));
        alert("Nome atualizado com sucesso!");
        carregarJogadores();
    }
}

function excluirJogador(index) {
    let jogadores = JSON.parse(localStorage.getItem("jogadores")) || [];
    
    if (confirm("Tem certeza que deseja remover este jogador do torneio?")) {
        jogadores.splice(index, 1);
        localStorage.setItem("jogadores", JSON.stringify(jogadores));
        carregarJogadores();
    }
}