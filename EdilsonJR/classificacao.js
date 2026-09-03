// ===============================
// ESTADO DO TORNEIO
// ===============================
// DEPOIS (filtra apenas quem está com o pagamento aprovado/pago):
let todosJogadores = JSON.parse(localStorage.getItem("jogadores")) || [];
let jogadores = todosJogadores.filter(j => j.pago === true);

let perdedoresSemifinal = [];
let viceCampeao = "";
let terceiroLugar = "";

// ===============================
// ELEMENTOS DO HTML
// ===============================
const bracketContainer = document.querySelector(".bracket");
const totalJogadores = document.getElementById("total-jogadores");
const btnSortear = document.getElementById("btn-sortear");

// ===============================
// INICIALIZAÇÃO DA PÁGINA
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    // Aplica o controle de permissão do Admin e esconde/mostra o botão de gerenciar
    verificarAcessoNivel();
});

// ===============================
// TRATAR NOME DOS JOGADORES
// ===============================
jogadores = jogadores.map(jogador => {
    if (typeof jogador === "object" && jogador !== null) {
        return jogador.apelido || jogador.nome;
    }
    return jogador;
});

if (totalJogadores) {
    totalJogadores.textContent = jogadores.length;
}

// ===============================
// EMBARALHAR
// ===============================
function embaralhar(array) {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

// ===============================
// INICIAR TORNEIO (SORTEIO)
// ===============================
function iniciarTorneio() {
    if (jogadores.length < 2) {
        alert("É necessário ter pelo menos 2 jogadores cadastrados.");
        return;
    }

    bracketContainer.innerHTML = "";
    perdedoresSemifinal = [];
    viceCampeao = "";
    terceiroLugar = "";

    const sorteados = embaralhar(jogadores);
    
    let nomeInicial = "Fase Inicial";
    if (sorteados.length > 16) nomeInicial = "Primeira Fase (1/16)";
    else if (sorteados.length > 8) nomeInicial = "Oitavas de Final";
    else if (sorteados.length > 4) nomeInicial = "Quartas de Final";
    else if (sorteados.length > 2) nomeInicial = "Semifinal";
    else if (sorteados.length === 2) nomeInicial = "Grande Final";

    criarColunaFase(nomeInicial, sorteados);
}

// ===============================
// CRIAR COLUNA DA FASE NA ÁRVORE
// ===============================
function criarColunaFase(nomeFase, listaJogadores) {
    const faseDiv = document.createElement("div");
    faseDiv.classList.add("fase");

    const titulo = document.createElement("h2");
    titulo.textContent = nomeFase;
    faseDiv.appendChild(titulo);

    const confrontosDiv = document.createElement("div");
    confrontosDiv.classList.add("confrontos");

    const totalConfrontos = Math.ceil(listaJogadores.length / 2);
    let confrontosConcluidos = 0;
    const vencedoresDestaFase = [];

    for (let i = 0; i < listaJogadores.length; i += 2) {
        const j1 = listaJogadores[i];
        const j2 = listaJogadores[i + 1] || "BYE (Avança automaticamente)";

        const confronto = document.createElement("div");
        confronto.classList.add("confronto");
        confronto.dataset.fase = nomeFase;

        // Elemento Jogador 1
        const elJ1 = document.createElement("div");
        elJ1.classList.add("jogador");
        elJ1.innerHTML = `<span class="nome-jogador">${j1}</span><button type="button" class="btn-vencedor">Venceu</button>`;

        // Elemento Jogador 2
        const elJ2 = document.createElement("div");
        elJ2.classList.add("jogador");
        elJ2.innerHTML = `<span class="nome-jogador">${j2}</span>${j2 !== "BYE (Avança automaticamente)" ? `<button type="button" class="btn-vencedor">Venceu</button>` : ""}`;

        confronto.appendChild(elJ1);
        confronto.appendChild(elJ2);
        confrontosDiv.appendChild(confronto);

        if (j2 === "BYE (Avança automaticamente)") {
            vencedoresDestaFase.push(j1);
            confrontosConcluidos++;
            elJ1.style.background = "rgba(25, 135, 84, 0.3)";
        } else {
            const btn1 = elJ1.querySelector("button");
            const btn2 = elJ2.querySelector("button");

            btn1.addEventListener("click", () => {
                registrarVitoria(confronto, elJ1, elJ2, j2, j1);
                vencedoresDestaFase.push(j1);
                confrontosConcluidos++;
                verificarAvancoFase(confrontosConcluidos, totalConfrontos, vencedoresDestaFase, nomeFase);
            });

            btn2.addEventListener("click", () => {
                registrarVitoria(confronto, elJ2, elJ1, j1, j2);
                vencedoresDestaFase.push(j2);
                confrontosConcluidos++;
                verificarAvancoFase(confrontosConcluidos, totalConfrontos, vencedoresDestaFase, nomeFase);
            });
        }
    }

    faseDiv.appendChild(confrontosDiv);
    bracketContainer.appendChild(faseDiv);

    if (confrontosConcluidos === totalConfrontos) {
        verificarAvancoFase(confrontosConcluidos, totalConfrontos, vencedoresDestaFase, nomeFase);
    }
}

// ===============================
// REGISTRAR VITÓRIA E IDENTIFICAR PÓDIO
// ===============================
function registrarVitoria(confronto, elementoVencedor, elementoPerdedor, nomePerdedor, nomeVencedor) {
    const botoes = confronto.querySelectorAll("button");
    botoes.forEach(btn => {
        btn.disabled = true;
        btn.style.background = "#555";
        btn.style.cursor = "not-allowed";
    });

    elementoVencedor.style.background = "rgba(25, 135, 84, 0.3)";
    elementoPerdedor.style.opacity = "0.4";
    elementoPerdedor.style.textDecoration = "line-through";

    const faseNome = confronto.dataset.fase;

    if (faseNome === "Grande Final") {
        viceCampeao = nomePerdedor;
    } else if (faseNome === "Semifinal") {
        perdedoresSemifinal.push(nomePerdedor);
    } else if (faseNome === "Disputa de 3º Lugar") {
        terceiroLugar = nomeVencedor;
        
        // Atualiza dinamicamente o podio no localStorage assim que define o 3º lugar
        const podioAtual = JSON.parse(localStorage.getItem("podioTorneio")) || {};
        podioAtual.terceiro = terceiroLugar;
        localStorage.setItem("podioTorneio", JSON.stringify(podioAtual));
    }
}

// ===============================
// VERIFICAR E AVANÇAR DE FASE
// ===============================
function verificarAvancoFase(concluidos, total, vencedores, faseAtual) {
    if (concluidos < total) return;

    if (faseAtual === "Disputa de 3º Lugar") {
        return; // Apenas registra o 3º lugar sem gerar novas fases
    }

    if (vencedores.length === 1 && faseAtual === "Grande Final") {
        exibirCampeao(vencedores[0]);
    } else if (vencedores.length > 1) {
        let proximoNome = "Próxima Fase";
        if (vencedores.length === 16) proximoNome = "Oitavas de Final";
        else if (vencedores.length === 8) proximoNome = "Quartas de Final";
        else if (vencedores.length === 4) proximoNome = "Semifinal";
        else if (vencedores.length === 2) proximoNome = "Grande Final";

        criarColunaFase(proximoNome, vencedores);

        // Se a próxima fase for a Final, gera em paralelo o jogo de 3º Lugar
        if (proximoNome === "Grande Final" && perdedoresSemifinal.length === 2) {
            criarColunaFase("Disputa de 3º Lugar", perdedoresSemifinal);
        }
    }
}

// ===============================
// EXIBIR E SALVAR CAMPEÃO E PÓDIO
// ===============================
function exibirCampeao(nomeCampeao) {
    if (document.querySelector(".campeao")) return;

    const campeaoDiv = document.createElement("div");
    campeaoDiv.classList.add("campeao");
    campeaoDiv.innerHTML = `
        <h2>🏆 Grande Campeão</h2>
        <div id="campeao">${nomeCampeao}</div>
    `;
    bracketContainer.appendChild(campeaoDiv);

    const podioAtual = JSON.parse(localStorage.getItem("podioTorneio")) || {};

    const podio = {
        primeiro: nomeCampeao,
        segundo: viceCampeao || "A definir",
        terceiro: terceiroLugar || podioAtual.terceiro || "A definir"
    };

    localStorage.setItem("podioTorneio", JSON.stringify(podio));
}

// ===============================
// EVENTO DO BOTÃO SORTEAR
// ===============================
if (btnSortear) {
    btnSortear.addEventListener("click", iniciarTorneio);
}

// ===============================
// CONTROLE DE ACESSO (ADMIN)
// ===============================
function verificarAcessoNivel() {
    const perfil = localStorage.getItem("usuario_perfil") || "jogador";
    const badgeAdmin = document.getElementById("admin-badge");
    const btnGerenciar = document.getElementById("btn-gerenciar");
    const btnSortear = document.getElementById("btn-sortear"); // <-- Adicionado o elemento do botão sortear

    // Mostra ou oculta o selo/badge de admin
    if (badgeAdmin) {
        badgeAdmin.style.display = (perfil === "admin") ? "block" : "none";
    }

    // Mostra o botão de gerenciar APENAS se for admin
    if (btnGerenciar) {
        btnGerenciar.style.display = (perfil === "admin") ? "block" : "none";
    }

    // Mostra o botão de Gerar/Resetar Chaveamento APENAS se for admin
    if (btnSortear) {
        btnSortear.style.display = (perfil === "admin") ? "block" : "none";
    }
}