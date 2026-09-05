// ===============================
// ESTADO DO TORNEIO
// ===============================
let todosJogadores = JSON.parse(localStorage.getItem("jogadores")) || [];
let jogadores = todosJogadores.filter(j => j.pago === true);

let perdedoresSemifinal = [];
let viceCampeao = "";
let terceiroLugar = "";

// Estado do Quadro Principal
let dadosQuadroPrincipal = JSON.parse(localStorage.getItem("torneio_quadro_principal")) || {
    fases: {} 
};

// Estado dos eliminados da 1ª fase e Repescagem 1
let perdedores16Avos = [];
let dadosRepescagem = JSON.parse(localStorage.getItem("torneio_repescagem")) || {
    solicitacoes: {}, 
    fase1: [],
    mapaVencedoresF1: {},
    fase2: [],
    mapaVencedoresF2: {}
};

// Estado da NOVA 2ª Seção de Repescagem (Perdedores da 2ª Fase)
let perdedoresSegundaFasePrincipal = JSON.parse(localStorage.getItem("torneio_perdedores_segunda_fase")) || [];
let dadosRepescagem2 = JSON.parse(localStorage.getItem("torneio_repescagem_2")) || {
    solicitacoes: {},
    vagasAprovadas: [] // Máximo de 4 vagas que sobem para a Terceira Fase
};

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
    verificarAcessoNivel();
    renderizarPainelRepescagem();
    renderizarQuadroRepescagem();
    renderizarPainelRepescagem2();

    if (dadosQuadroPrincipal.faseInicialNome && bracketContainer && bracketContainer.innerHTML.trim() === "") {
        carregarQuadroPrincipalSalvo();
    }

    if (btnSortear) {
        btnSortear.addEventListener("click", () => {
            iniciarTorneio();
        });
    }
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

    if (bracketContainer) bracketContainer.innerHTML = "";
    perdedoresSemifinal = [];
    perdedores16Avos = [];
    perdedoresSegundaFasePrincipal = [];
    viceCampeao = "";
    terceiroLugar = "";
    dadosQuadroPrincipal = { fases: {} };
    dadosRepescagem2 = { solicitacoes: {}, vagasAprovadas: [] };
    
    localStorage.removeItem("torneio_quadro_principal");
    localStorage.removeItem("torneio_perdedores_segunda_fase");
    localStorage.removeItem("torneio_repescagem_2");
    localStorage.removeItem("podioTorneio");

    const sorteados = embaralhar(jogadores);
    
    let nomeInicial = "Primeira Fase";
    dadosQuadroPrincipal.faseInicialNome = nomeInicial;
    dadosQuadroPrincipal.jogadoresIniciais = sorteados;
    localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));

    criarColunaFase(nomeInicial, sorteados);
}

// ===============================
// CRIAR COLUNA DA FASE NA ÁRVORE PRINCIPAL
// ===============================
function criarColunaFase(nomeFase, listaJogadores) {
    if (!dadosQuadroPrincipal.fases[nomeFase]) {
        dadosQuadroPrincipal.fases[nomeFase] = {
            mapaVencedores: {},
            vencedoresDestaFase: []
        };
    }

    const faseDiv = document.createElement("div");
    faseDiv.classList.add("fase");
    faseDiv.dataset.nomeFase = nomeFase;

    const titulo = document.createElement("h2");
    titulo.textContent = nomeFase;
    faseDiv.appendChild(titulo);

    const confrontosDiv = document.createElement("div");
    confrontosDiv.classList.add("confrontos");

    let faseAtualObj = dadosQuadroPrincipal.fases[nomeFase];
    let listaEfetiva = [...listaJogadores];

    if (nomeFase === "Segunda Fase") {
        let vencedoresRepescagemF2 = [];
        if (dadosRepescagem.mapaVencedoresF2) {
            Object.values(dadosRepescagem.mapaVencedoresF2).forEach(v => {
                if (v && !vencedoresRepescagemF2.includes(v)) vencedoresRepescagemF2.push(v);
            });
        }
        let combinados = [...listaJogadores];
        vencedoresRepescagemF2.forEach(v => {
            if (!combinados.includes(v)) combinados.push(v);
        });
        listaEfetiva = combinados;
    }

    if (nomeFase === "Terceira Fase") {
        let aprovadosRep2 = dadosRepescagem2.vagasAprovadas || [];
        let combinados = [...listaJogadores];
        aprovadosRep2.forEach(v => {
            if (!combinados.includes(v)) combinados.push(v);
        });
        listaEfetiva = combinados;
    }

    for (let i = 0; i < listaEfetiva.length; i += 2) {
        const j1 = listaEfetiva[i];
        const j2 = listaEfetiva[i + 1] || "BYE (Avança automaticamente)";
        const indiceConfronto = Math.floor(i / 2);

        const confronto = document.createElement("div");
        confronto.classList.add("confronto");
        confronto.dataset.fase = nomeFase;
        confronto.dataset.indice = indiceConfronto;

        let vencedorAtual = faseAtualObj.mapaVencedores[indiceConfronto] || null;

        if (j2 === "BYE (Avança automaticamente)" && vencedorAtual === null) {
            vencedorAtual = j1;
            faseAtualObj.mapaVencedores[indiceConfronto] = j1;
            if (!faseAtualObj.vencedoresDestaFase.includes(j1)) {
                faseAtualObj.vencedoresDestaFase.push(j1);
            }
        }

        const elJ1 = criarElementoJogadorQuartoPrincipal(j1, vencedorAtual, confronto, indiceConfronto, nomeFase, listaEfetiva);
        const elJ2 = criarElementoJogadorQuartoPrincipal(j2, vencedorAtual, confronto, indiceConfronto, nomeFase, listaEfetiva);

        confronto.appendChild(elJ1);
        confronto.appendChild(elJ2);
        confrontosDiv.appendChild(confronto);
    }

    faseDiv.appendChild(confrontosDiv);
    if (bracketContainer) bracketContainer.appendChild(faseDiv);

    localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
}

function criarElementoJogadorQuartoPrincipal(nomeJogador, vencedorDoConfronto, confrontoEl, indiceConfronto, nomeFase, listaJogadores) {
    const el = document.createElement("div");
    el.classList.add("jogador");

    const isBye = nomeJogador === "BYE (Avança automaticamente)";
    let jaVenceu = (vencedorDoConfronto === nomeJogador);
    let temOutroVencedor = (vencedorDoConfronto !== null && vencedorDoConfronto !== nomeJogador && !isBye);

    let estiloFundo = "background: transparent;";
    let estiloTexto = "color: #fff;";
    let estiloOpacidade = "opacity: 1; text-decoration: none;";

    if (jaVenceu || isBye) {
        estiloFundo = "background: rgba(25, 135, 84, 0.3);";
        estiloTexto = "color: #27ae60; font-weight: bold;";
    } else if (temOutroVencedor) {
        estiloOpacidade = "opacity: 0.4; text-decoration: line-through;";
    }

    el.style = estiloFundo;

    let htmlInterno = `<span class="nome-jogador" style="${estiloTexto} ${estiloOpacidade}">${nomeJogador}</span>`;

    const perfil = localStorage.getItem("usuario_perfil");
    if (perfil === "admin" && !isBye) {
        if (!vencedorDoConfronto) {
            htmlInterno += `<button type="button" class="btn-vencedor" style="margin-left: 8px; background: #27ae60; color: #fff; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: 11px;">Venceu</button>`;
        } else if (jaVenceu) {
            htmlInterno += `<button type="button" class="btn-desfazer" style="margin-left: 8px; background: #c0392b; color: #fff; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: 11px;">Desfazer</button>`;
        }
    }

    el.innerHTML = htmlInterno;

    const btnVenceu = el.querySelector(".btn-vencedor");
    if (btnVenceu) {
        btnVenceu.addEventListener("click", () => {
            registrarVitoriaQuadroPrincipal(nomeFase, indiceConfronto, nomeJogador, listaJogadores);
        });
    }

    const btnDesfazer = el.querySelector(".btn-desfazer");
    if (btnDesfazer) {
        btnDesfazer.addEventListener("click", () => {
            desfazerVitoriaQuadroPrincipal(nomeFase, indiceConfronto, listaJogadores);
        });
    }

    return el;
}

function registrarVitoriaQuadroPrincipal(nomeFase, indiceConfronto, nomeVencedor, listaJogadores) {
    let faseObj = dadosQuadroPrincipal.fases[nomeFase];
    faseObj.mapaVencedores[indiceConfronto] = nomeVencedor;

    if (!faseObj.vencedoresDestaFase.includes(nomeVencedor)) {
        faseObj.vencedoresDestaFase.push(nomeVencedor);
    }

    if (nomeFase === "Primeira Fase") {
        let j1 = listaJogadores[indiceConfronto * 2];
        let j2 = listaJogadores[indiceConfronto * 2 + 1];
        let perdedor = (nomeVencedor === j1) ? j2 : j1;
        if (perdedor && perdedor !== "BYE (Avança automaticamente)" && !perdedores16Avos.includes(perdedor)) {
            perdedores16Avos.push(perdedor);
            localStorage.setItem("torneio_perdedores_16avos", JSON.stringify(perdedores16Avos));
            renderizarPainelRepescagem();
        }
    }

    if (nomeFase === "Segunda Fase") {
        let j1 = listaJogadores[indiceConfronto * 2];
        let j2 = listaJogadores[indiceConfronto * 2 + 1];
        let perdedor = (nomeVencedor === j1) ? j2 : j1;
        if (perdedor && perdedor !== "BYE (Avança automaticamente)" && !perdedoresSegundaFasePrincipal.includes(perdedor)) {
            perdedoresSegundaFasePrincipal.push(perdedor);
            localStorage.setItem("torneio_perdedores_segunda_fase", JSON.stringify(perdedoresSegundaFasePrincipal));
            renderizarPainelRepescagem2();
        }
    }

    // Capturar perdedores da Quinta Fase (Semifinal) para a Disputa de 3º Lugar
    if (nomeFase === "Quinta Fase") {
        let j1 = listaJogadores[indiceConfronto * 2];
        let j2 = listaJogadores[indiceConfronto * 2 + 1];
        let perdedor = (nomeVencedor === j1) ? j2 : j1;
        if (perdedor && perdedor !== "BYE (Avança automaticamente)" && !perdedoresSemifinal.includes(perdedor)) {
            perdedoresSemifinal.push(perdedor);
        }
    }

    // Capturar vice-campeão na Grande Final
    if (nomeFase === "Grande Final") {
        let j1 = listaJogadores[0];
        let j2 = listaJogadores[1];
        viceCampeao = (nomeVencedor === j1) ? j2 : j1;
    }

    // Capturar terceiro lugar na Disputa de 3º Lugar
    if (nomeFase === "Disputa de 3º Lugar") {
        let j1 = listaJogadores[0];
        let j2 = listaJogadores[1];
        terceiroLugar = nomeVencedor;
    }

    localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
    rederizarNovamenteQuadroPrincipal();
    verificarFaseConcluidaQuadroPrincipal(nomeFase, listaJogadores);
}

function desfazerVitoriaQuadroPrincipal(nomeFase, indiceConfronto, listaJogadores) {
    let faseObj = dadosQuadroPrincipal.fases[nomeFase];
    let vencedorAntigo = faseObj.mapaVencedores[indiceConfronto];

    delete faseObj.mapaVencedores[indiceConfronto];
    faseObj.vencedoresDestaFase = faseObj.vencedoresDestaFase.filter(v => v !== vencedorAntigo);

    if (nomeFase === "Quinta Fase") {
        perdedoresSemifinal = [];
    }
    if (nomeFase === "Grande Final") {
        viceCampeao = "";
    }
    if (nomeFase === "Disputa de 3º Lugar") {
        terceiroLugar = "";
    }

    limparFasesSubsequentes(nomeFase);

    localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
    rederizarNovamenteQuadroPrincipal();
}

function limparFasesSubsequentes(faseAtual) {
    const ordemFases = ["Primeira Fase", "Segunda Fase", "Terceira Fase", "Quarta Fase", "Quinta Fase", "Grande Final", "Disputa de 3º Lugar"];
    let idx = ordemFases.indexOf(faseAtual);
    if (idx !== -1) {
        for (let i = idx + 1; i < ordemFases.length; i++) {
            delete dadosQuadroPrincipal.fases[ordemFases[i]];
        }
    }
}

function rederizarNovamenteQuadroPrincipal() {
    if (!bracketContainer) return;
    const campeaoDiv = bracketContainer.querySelector(".campeao");
    const disputa3Div = bracketContainer.querySelector(".disputa-terceiro");
    bracketContainer.innerHTML = "";

    let faseAtualNome = dadosQuadroPrincipal.faseInicialNome;
    let listaAtual = dadosQuadroPrincipal.jogadoresIniciais;

    while (faseAtualNome) {
        if (dadosQuadroPrincipal.fases[faseAtualNome]) {
            criarColunaFaseSimples(faseAtualNome, listaAtual);
            
            let totalConfs = Math.ceil(listaAtual.length / 2);
            if (faseAtualNome === "Segunda Fase") {
                let vencedoresRepF2 = [];
                if (dadosRepescagem.mapaVencedoresF2) {
                    Object.values(dadosRepescagem.mapaVencedoresF2).forEach(v => {
                        if (v && !vencedoresRepF2.includes(v)) vencedoresRepF2.push(v);
                    });
                }
                let tempC = [...listaAtual];
                vencedoresRepF2.forEach(v => {
                    if (!tempC.includes(v)) tempC.push(v);
                });
                totalConfs = Math.ceil(tempC.length / 2);
            } else if (faseAtualNome === "Terceira Fase") {
                let aprovadosRep2 = dadosRepescagem2.vagasAprovadas || [];
                let tempC = [...listaAtual];
                aprovadosRep2.forEach(v => {
                    if (!tempC.includes(v)) tempC.push(v);
                });
                totalConfs = Math.ceil(tempC.length / 2);
            }

            let faseObj = dadosQuadroPrincipal.fases[faseAtualNome];
            let vencedores = [];
            
            for (let c = 0; c < totalConfs; c++) {
                if (faseObj.mapaVencedores[c]) {
                    vencedores.push(faseObj.mapaVencedores[c]);
                }
            }

            if (vencedores.length === totalConfs && totalConfs > 1) {
                listaAtual = vencedores;
                faseAtualNome = obterProximaFaseNome(faseAtualNome);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    // Renderiza também a Disputa de 3º Lugar se ela já existir nas fases salvas
    if (dadosQuadroPrincipal.fases["Disputa de 3º Lugar"]) {
        criarColunaFaseSimples("Disputa de 3º Lugar", perdedoresSemifinal.length === 2 ? perdedoresSemifinal : ["A definir", "A definir"]);
    }

    if (campeaoDiv) bracketContainer.appendChild(campeaoDiv);
    if (disputa3Div) bracketContainer.appendChild(disputa3Div);
}

function criarColunaFaseSimples(nomeFase, listaJogadores) {
    const faseDiv = document.createElement("div");
    faseDiv.classList.add("fase");
    faseDiv.dataset.nomeFase = nomeFase;

    const titulo = document.createElement("h2");
    titulo.textContent = nomeFase;
    faseDiv.appendChild(titulo);

    const confrontosDiv = document.createElement("div");
    confrontosDiv.classList.add("confrontos");

    let faseAtualObj = dadosQuadroPrincipal.fases[nomeFase] || { mapaVencedores: {}, vencedoresDestaFase: [] };

    let listaEfetiva = [...listaJogadores];
    if (nomeFase === "Segunda Fase") {
        let vencedoresRepF2 = [];
        if (dadosRepescagem.mapaVencedoresF2) {
            Object.values(dadosRepescagem.mapaVencedoresF2).forEach(v => {
                if (v && !vencedoresRepF2.includes(v)) vencedoresRepF2.push(v);
            });
        }
        let combinados = [...listaJogadores];
        vencedoresRepF2.forEach(v => {
            if (!combinados.includes(v)) combinados.push(v);
        });
        listaEfetiva = combinados;
    } else if (nomeFase === "Terceira Fase") {
        let aprovadosRep2 = dadosRepescagem2.vagasAprovadas || [];
        let combinados = [...listaJogadores];
        aprovadosRep2.forEach(v => {
            if (!combinados.includes(v)) combinados.push(v);
        });
        listaEfetiva = combinados;
    }

    for (let i = 0; i < listaEfetiva.length; i += 2) {
        const j1 = listaEfetiva[i];
        const j2 = listaEfetiva[i + 1] || "BYE (Avança automaticamente)";
        const indiceConfronto = Math.floor(i / 2);

        const confronto = document.createElement("div");
        confronto.classList.add("confronto");
        confronto.dataset.fase = nomeFase;
        confronto.dataset.indice = indiceConfronto;

        let vencedorAtual = faseAtualObj.mapaVencedores[indiceConfronto] || null;

        const elJ1 = criarElementoJogadorQuartoPrincipal(j1, vencedorAtual, confronto, indiceConfronto, nomeFase, listaEfetiva);
        const elJ2 = criarElementoJogadorQuartoPrincipal(j2, vencedorAtual, confronto, indiceConfronto, nomeFase, listaEfetiva);

        confronto.appendChild(elJ1);
        confronto.appendChild(elJ2);
        confrontosDiv.appendChild(confronto);
    }

    faseDiv.appendChild(confrontosDiv);
    if (bracketContainer) bracketContainer.appendChild(faseDiv);
}

function obterProximaFaseNome(faseAtual) {
    if (faseAtual === "Primeira Fase") return "Segunda Fase";
    if (faseAtual === "Segunda Fase") return "Terceira Fase";
    if (faseAtual === "Terceira Fase") return "Quarta Fase";
    if (faseAtual === "Quarta Fase") return "Quinta Fase";
    if (faseAtual === "Quinta Fase") return "Grande Final";
    return null;
}

function verificarFaseConcluidaQuadroPrincipal(faseAtual, listaJogadores) {
    let faseObj = dadosQuadroPrincipal.fases[faseAtual];
    let totalConfrontos = Math.ceil(listaJogadores.length / 2);
    
    if (faseAtual === "Segunda Fase") {
        let vencedoresRepF2 = [];
        if (dadosRepescagem.mapaVencedoresF2) {
            Object.values(dadosRepescagem.mapaVencedoresF2).forEach(v => {
                if (v && !vencedoresRepF2.includes(v)) vencedoresRepF2.push(v);
            });
        }
        let tempC = [...listaJogadores];
        vencedoresRepF2.forEach(v => {
            if (!tempC.includes(v)) tempC.push(v);
        });
        totalConfrontos = Math.ceil(tempC.length / 2);
    } else if (faseAtual === "Terceira Fase") {
        let aprovadosRep2 = dadosRepescagem2.vagasAprovadas || [];
        let tempC = [...listaJogadores];
        aprovadosRep2.forEach(v => {
            if (!tempC.includes(v)) tempC.push(v);
        });
        totalConfrontos = Math.ceil(tempC.length / 2);
    }

    let vencedoresNomes = [];
    for (let c = 0; c < totalConfrontos; c++) {
        if (faseObj.mapaVencedores[c]) {
            vencedoresNomes.push(faseObj.mapaVencedores[c]);
        }
    }

    if (vencedoresNomes.length === totalConfrontos) {
        let proximaFase = obterProximaFaseNome(faseAtual);
        if (proximaFase) {
            if (!dadosQuadroPrincipal.fases[proximaFase]) {
                criarColunaFase(proximaFase, vencedoresNomes);
            }
        } 
        
        // Se a Quinta Fase (Semifinal) for concluída, cria automaticamente a Disputa de 3º Lugar
        if (faseAtual === "Quinta Fase" && perdedoresSemifinal.length === 2) {
            if (!dadosQuadroPrincipal.fases["Disputa de 3º Lugar"]) {
                criarColunaFase("Disputa de 3º Lugar", perdedoresSemifinal);
            }
        }

        if (faseAtual === "Grande Final" && vencedoresNomes.length === 1) {
            exibirCampeao(vencedoresNomes[0]);
        }
    }
}

function carregarQuadroPrincipalSalvo() {
    rederizarNovamenteQuadroPrincipal();
}

function exibirCampeao(nomeCampeao) {
    if (document.querySelector(".campeao")) return;

    const campeaoDiv = document.createElement("div");
    campeaoDiv.classList.add("campeao");
    campeaoDiv.innerHTML = `
        <h2>🏆 Grande Campeão</h2>
        <div id="campeao">${nomeCampeao}</div>
    `;
    if (bracketContainer) bracketContainer.appendChild(campeaoDiv);

    const podioAtual = JSON.parse(localStorage.getItem("podioTorneio")) || {};
    const podio = {
        primeiro: nomeCampeao,
        segundo: viceCampeao || "A definir",
        terceiro: terceiroLugar || podioAtual.terceiro || "A definir"
    };

    localStorage.setItem("podioTorneio", JSON.stringify(podio));
}

// ===============================
// LÓGICA DA 1ª SEÇÃO DE REPESCAGEM
// ===============================
function renderizarPainelRepescagem() {
    const containerEl = document.getElementById("lista-elegiveis-repescagem");
    if (!containerEl) return;
    containerEl.innerHTML = "";

    perdedores16Avos = JSON.parse(localStorage.getItem("torneio_perdedores_16avos")) || [];

    if (perdedores16Avos.length === 0) {
        containerEl.innerHTML = "<span style='color:#777; font-size:13px;'>Nenhum eliminado na 1ª fase registrado ainda.</span>";
        return;
    }

    perdedores16Avos.forEach(jogador => {
        let status = dadosRepescagem.solicitacoes[jogador] || "nao_solicitado";
        let badgeStyle = "background:#333; color:#fff; cursor:pointer;";
        let textoBotao = jogador;

        if (status === "pendente") {
            badgeStyle = "background:#d35400; color:#fff; cursor:default;";
            textoBotao = `${jogador} (Aguardando Aprovação)`;
        } else if (status === "aprovado") {
            badgeStyle = "background:#27ae60; color:#fff; cursor:default;";
            textoBotao = `${jogador} (Aprovado ✓)`;
        }

        let tag = document.createElement("div");
        tag.className = "tag-eliminado";
        tag.style = `padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; ${badgeStyle}`;
        tag.innerText = textoBotao;

        if (status === "nao_solicitado") {
            tag.onclick = () => abrirModalRepescagem(jogador);
        }

        const perfilUsuario = localStorage.getItem("usuario_perfil");
        if (perfilUsuario === "admin" && status === "pendente") {
            let btnAprovar = document.createElement("button");
            btnAprovar.innerText = "Aprovar R$50";
            btnAprovar.style = "background:#27ae60; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;";
            btnAprovar.onclick = (e) => {
                e.stopPropagation();
                aprovarRepescagemAdmin(jogador);
            };
            tag.appendChild(btnAprovar);
        }

        containerEl.appendChild(tag);
    });
}

let jogadorAtualSelecionado = null;

function abrirModalRepescagem(nomeJogador) {
    jogadorAtualSelecionado = nomeJogador;
    const modal = document.getElementById("modal-repescagem");
    if (modal) modal.style.display = "flex";
}

function fecharModalRepescagem() {
    const modal = document.getElementById("modal-repescagem");
    if (modal) modal.style.display = "none";
    jogadorAtualSelecionado = null;
}

function copiarPix() {
    const chavePix = document.getElementById("chave-pix-texto")?.innerText || "";
    navigator.clipboard.writeText(chavePix).then(() => {
        alert("Chave Pix copiada com sucesso!");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const btnEnviar = document.getElementById("btn-enviar-pedido");
    if (btnEnviar) {
        btnEnviar.onclick = () => {
            if (jogadorAtualSelecionado) {
                dadosRepescagem.solicitacoes[jogadorAtualSelecionado] = "pendente";
                localStorage.setItem("torneio_repescagem", JSON.stringify(dadosRepescagem));
                alert("Solicitação enviada! Efetue o pagamento via Pix ou com o organizador para o Admin aprovar.");
                fecharModalRepescagem();
                renderizarPainelRepescagem();
            }
        };
    }
});

function aprovarRepescagemAdmin(nomeJogador) {
    dadosRepescagem.solicitacoes[nomeJogador] = "aprovado";
    if (!dadosRepescagem.fase1.includes(nomeJogador)) {
        dadosRepescagem.fase1.push(nomeJogador);
    }
    localStorage.setItem("torneio_repescagem", JSON.stringify(dadosRepescagem));
    alert(`Jogador ${nomeJogador} adicionado à 1ª Rodada da Repescagem!`);
    renderizarPainelRepescagem();
    renderizarQuadroRepescagem();
}

// ===============================
// RENDERIZAR QUADRO DE REPESCAGEM (2 FASES)
// ===============================
function renderizarQuadroRepescagem() {
    const col1 = document.getElementById("rep-fase1");
    const col2 = document.getElementById("rep-fase2");

    if (col2) col2.style.display = "block";

    if (col1) {
        col1.innerHTML = "";
        let cadastradosF1 = dadosRepescagem.fase1 || [];

        if (cadastradosF1.length === 0) {
            col1.innerHTML = "<span style='color:#777; font-size:12px;'>Aguardando aprovações...</span>";
        } else {
            if (!dadosRepescagem.mapaVencedoresF1) dadosRepescagem.mapaVencedoresF1 = {};

            for (let i = 0; i < cadastradosF1.length; i += 2) {
                const j1 = cadastradosF1[i];
                const j2 = cadastradosF1[i + 1] || "BYE";
                const indiceConfronto = Math.floor(i / 2);

                const confrontoDiv = document.createElement("div");
                confrontoDiv.style = "background:#111; padding:10px; border-radius:6px; margin-bottom:10px; border:1px solid #333;";

                if (j2 === "BYE" && dadosRepescagem.mapaVencedoresF1[indiceConfronto] === undefined) {
                    dadosRepescagem.mapaVencedoresF1[indiceConfronto] = j1;
                }

                let vencedorAtual = dadosRepescagem.mapaVencedoresF1[indiceConfronto] !== undefined ? dadosRepescagem.mapaVencedoresF1[indiceConfronto] : null;

                let elJ1 = criarElementoConfrontoRepescagem(j1, vencedorAtual, indiceConfronto, dadosRepescagem.mapaVencedoresF1, cadastradosF1, 1);
                let elJ2 = j2 !== "BYE" ? criarElementoConfrontoRepescagem(j2, vencedorAtual, indiceConfronto, dadosRepescagem.mapaVencedoresF1, cadastradosF1, 1) : document.createElement("div");
                
                if (j2 === "BYE") {
                    elJ2.innerHTML = `<span style="color:#777; font-size:12px;">${j2} (Avança)</span>`;
                }

                confrontoDiv.appendChild(elJ1);
                if (j2 !== "BYE") confrontoDiv.appendChild(elJ2);
                col1.appendChild(confrontoDiv);
            }
        }
    }

    let vencedoresF1 = [];
    if (dadosRepescagem.mapaVencedoresF1) {
        Object.values(dadosRepescagem.mapaVencedoresF1).forEach(v => {
            if (v && !vencedoresF1.includes(v)) vencedoresF1.push(v);
        });
    }
    dadosRepescagem.fase2 = vencedoresF1;
    localStorage.setItem("torneio_repescagem", JSON.stringify(dadosRepescagem));

    if (col2) {
        col2.innerHTML = "";
        let cadastradosF2 = dadosRepescagem.fase2 || [];

        if (cadastradosF2.length === 0) {
            col2.innerHTML = "<span style='color:#777; font-size:12px;'>Aguardando Fase 1...</span>";
        } else {
            if (!dadosRepescagem.mapaVencedoresF2) dadosRepescagem.mapaVencedoresF2 = {};

            for (let i = 0; i < cadastradosF2.length; i += 2) {
                const j1 = cadastradosF2[i];
                const j2 = cadastradosF2[i + 1] || "BYE";
                const indiceConfronto = Math.floor(i / 2);

                const confrontoDiv = document.createElement("div");
                confrontoDiv.style = "background:#111; padding:10px; border-radius:6px; margin-bottom:10px; border:1px solid #333;";

                if (j2 === "BYE" && dadosRepescagem.mapaVencedoresF2[indiceConfronto] === undefined) {
                    dadosRepescagem.mapaVencedoresF2[indiceConfronto] = j1;
                }

                let vencedorAtual = dadosRepescagem.mapaVencedoresF2[indiceConfronto] !== undefined ? dadosRepescagem.mapaVencedoresF2[indiceConfronto] : null;

                let elJ1 = criarElementoConfrontoRepescagem(j1, vencedorAtual, indiceConfronto, dadosRepescagem.mapaVencedoresF2, cadastradosF2, 2);
                let elJ2 = j2 !== "BYE" ? criarElementoConfrontoRepescagem(j2, vencedorAtual, indiceConfronto, dadosRepescagem.mapaVencedoresF2, cadastradosF2, 2) : document.createElement("div");
                
                if (j2 === "BYE") {
                    elJ2.innerHTML = `<span style="color:#777; font-size:12px;">${j2} (Avança)</span>`;
                }

                confrontoDiv.appendChild(elJ1);
                if (j2 !== "BYE") confrontoDiv.appendChild(elJ2);
                col2.appendChild(confrontoDiv);
            }
        }
    }

    localStorage.setItem("torneio_repescagem", JSON.stringify(dadosRepescagem));
}

function criarElementoConfrontoRepescagem(nomeJogador, vencedorDoConfronto, indiceConfronto, mapaVencedores, arrayOrigem, faseNum) {
    const el = document.createElement("div");
    el.style = "display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 13px;";

    let jaVenceu = (vencedorDoConfronto === nomeJogador);
    let temOutroVencedor = (vencedorDoConfronto !== null && vencedorDoConfronto !== nomeJogador);

    let estiloTexto = "color: #fff;";
    if (jaVenceu) estiloTexto = "color: #27ae60; font-weight: bold;";
    if (temOutroVencedor) estiloTexto = "color: #777; opacity: 0.5; text-decoration: line-through;";

    el.innerHTML = `<span style="${estiloTexto}">${nomeJogador} ${jaVenceu ? '✓' : ''}</span>`;

    const perfil = localStorage.getItem("usuario_perfil");
    if (perfil === "admin") {
        if (!vencedorDoConfronto) {
            let btnVenceu = document.createElement("button");
            btnVenceu.innerText = "Venceu";
            btnVenceu.style = "background: #27ae60; color: #fff; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: 11px;";
            
            btnVenceu.onclick = () => {
                mapaVencedores[indiceConfronto] = nomeJogador;
                if (faseNum === 1) {
                    dadosRepescagem.mapaVencedoresF2 = {};
                }
                localStorage.setItem("torneio_repescagem", JSON.stringify(dadosRepescagem));
                renderizarQuadroRepescagem();
                rederizarNovamenteQuadroPrincipal(); 
            };
            el.appendChild(btnVenceu);
        } else if (jaVenceu) {
            let btnDesfazer = document.createElement("button");
            btnDesfazer.innerText = "Desfazer";
            btnDesfazer.style = "background: #c0392b; color: #fff; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: 11px;";
            
            btnDesfazer.onclick = () => {
                delete mapaVencedores[indiceConfronto];
                if (faseNum === 1) {
                    dadosRepescagem.mapaVencedoresF2 = {};
                }
                localStorage.setItem("torneio_repescagem", JSON.stringify(dadosRepescagem));
                renderizarQuadroRepescagem();
                rederizarNovamenteQuadroPrincipal();
            };
            el.appendChild(btnDesfazer);
        }
    }

    return el;
}

// ===============================
// LÓGICA DA 2ª SEÇÃO DE REPESCAGEM (MÁXIMO 4 VAGAS)
// ===============================
function renderizarPainelRepescagem2() {
    const containerEl = document.getElementById("lista-elegiveis-repescagem-2");
    if (!containerEl) return;
    containerEl.innerHTML = "";

    perdedoresSegundaFasePrincipal = JSON.parse(localStorage.getItem("torneio_perdedores_segunda_fase")) || [];

    if (perdedoresSegundaFasePrincipal.length === 0) {
        containerEl.innerHTML = "<span style='color:#777; font-size:13px;'>Nenhum eliminado na 2ª fase registrado ainda.</span>";
        return;
    }

    perdedoresSegundaFasePrincipal.forEach(jogador => {
        let status = dadosRepescagem2.solicitacoes[jogador] || "nao_solicitado";
        let badgeStyle = "background:#333; color:#fff; cursor:pointer;";
        let textoBotao = jogador;

        if (status === "pendente") {
            badgeStyle = "background:#d35400; color:#fff; cursor:default;";
            textoBotao = `${jogador} (Aguardando Aprovação)`;
        } else if (status === "aprovado") {
            badgeStyle = "background:#27ae60; color:#fff; cursor:default;";
            textoBotao = `${jogador} (Aprovado ✓)`;
        }

        let tag = document.createElement("div");
        tag.className = "tag-eliminado-2";
        tag.style = `padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; ${badgeStyle}`;
        tag.innerText = textoBotao;

        if (status === "nao_solicitado") {
            tag.onclick = () => {
                if ((dadosRepescagem2.vagasAprovadas || []).length >= 4) {
                    alert("O limite máximo de 4 vagas para esta seção já foi atingido.");
                    return;
                }
                dadosRepescagem2.solicitacoes[jogador] = "pendente";
                localStorage.setItem("torneio_repescagem_2", JSON.stringify(dadosRepescagem2));
                alert("Solicitação enviada! Efetue o pagamento da segunda chance para o Admin aprovar.");
                renderizarPainelRepescagem2();
            };
        }

        const perfilUsuario = localStorage.getItem("usuario_perfil");
        if (perfilUsuario === "admin" && status === "pendente") {
            let btnAprovar = document.createElement("button");
            btnAprovar.innerText = "Aprovar Vaga";
            btnAprovar.style = "background:#27ae60; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;";
            btnAprovar.onclick = (e) => {
                e.stopPropagation();
                if ((dadosRepescagem2.vagasAprovadas || []).length >= 4) {
                    alert("Limite de 4 vagas atingido!");
                    return;
                }
                dadosRepescagem2.solicitacoes[jogador] = "aprovado";
                if (!dadosRepescagem2.vagasAprovadas.includes(jogador)) {
                    dadosRepescagem2.vagasAprovadas.push(jogador);
                }
                localStorage.setItem("torneio_repescagem_2", JSON.stringify(dadosRepescagem2));
                alert(`Jogador ${jogador} aprovado na 2ª Seção e enviado para a Terceira Fase!`);
                renderizarPainelRepescagem2();
                rederizarNovamenteQuadroPrincipal();
            };
            tag.appendChild(btnAprovar);
        }

        containerEl.appendChild(tag);
    });
}

// ===============================
// CONTROLE DE ACESSO (ADMIN)
// ===============================
function verificarAcessoNivel() {
    const perfil = localStorage.getItem("usuario_perfil") || "jogador";
    const badgeAdmin = document.getElementById("admin-badge");
    const btnGerenciar = document.getElementById("btn-gerenciar");
    const btnSortearEl = document.getElementById("btn-sortear");

    if (badgeAdmin) {
        badgeAdmin.style.display = (perfil === "admin") ? "block" : "none";
    }

    if (btnGerenciar) {
        btnGerenciar.style.display = (perfil === "admin") ? "block" : "none";
    }

    if (btnSortearEl) {
        btnSortearEl.style.display = (perfil === "admin") ? "block" : "none";
    }
}