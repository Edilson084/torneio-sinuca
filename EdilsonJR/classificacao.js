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

// Estado dos eliminados da 1ª fase e Repescagem Simplificada
let perdedores16Avos = [];
let dadosRepescagem = JSON.parse(localStorage.getItem("torneio_repescagem")) || {
    solicitacoes: {}, 
    aprovados: [] 
};

// ===============================
// ELEMENTOS DO HTML
// ===============================
const bracketContainer = document.querySelector(".bracket");
const totalJogadores = document.getElementById("total-jogadores");
const btnSortear = document.getElementById("btn-sortear");

// ===============================
// CONTROLE DE ACESSO DO ADMIN
// ===============================
function verificarAcessoNivel() {
    const perfil = localStorage.getItem("usuario_perfil");

    if (perfil !== "admin") {
        if (btnSortear) {
            btnSortear.style.display = "none";
        }
    }
}

// ===============================
// INICIALIZAÇÃO DA PÁGINA
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    verificarAcessoNivel();
    renderizarPainelRepescagem();

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
// EMBARALHAR (COM CONTROLE RIGOROSO ANTI-REPETIÇÃO DE CHAPÉU)
// ===============================
function embaralharComChapeu(array, nomeFaseAtual, apenasVencedoresOriginais = false) {
    let copia = [...array];

    let candidatosChapeu = [...copia];
    if (apenasVencedoresOriginais) {
        let faseAnteriorObj = dadosQuadroPrincipal.fases["Primeira Fase"];
        let vencedoresPuros = [];
        if (faseAnteriorObj && faseAnteriorObj.mapaVencedores) {
            vencedoresPuros = Object.values(faseAnteriorObj.mapaVencedores);
            if (faseAnteriorObj.chapeuDestaFase) vencedoresPuros.push(faseAnteriorObj.chapeuDestaFase);
        }
        candidatosChapeu = copia.filter(j => vencedoresPuros.includes(j));
        if (candidatosChapeu.length === 0) candidatosChapeu = copia;
    }

    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    let chapeu = null;

    if (copia.length % 2 !== 0) {
        let historicoChapeus = JSON.parse(localStorage.getItem("historico_chapeus_fases")) || {};
        
        let fasesOrdem = ["Primeira Fase", "Segunda Fase", "Terceira Fase", "Quarta Fase", "Quinta Fase"];
        let idxAtual = fasesOrdem.indexOf(nomeFaseAtual);
        let chapeuFaseAnterior = null;
        if (idxAtual > 0) {
            chapeuFaseAnterior = historicoChapeus[fasesOrdem[idxAtual - 1]];
        }

        let candidatosViaveis = candidatosChapeu.filter(j => {
            let objOriginal = todosJogadores.find(item => (item.apelido || item.nome) === j);
            let identificador = objOriginal ? (objOriginal.cpf || objOriginal.nome) : j;
            
            let jaTirouAntes = Object.values(historicoChapeus).includes(identificador);
            let tirouNaAnterior = (identificador === chapeuFaseAnterior);

            return !jaTirouAntes && !tirouNaAnterior;
        });

        if (candidatosViaveis.length === 0) {
            candidatosViaveis = candidatosChapeu.filter(j => {
                let objOriginal = todosJogadores.find(item => (item.apelido || item.nome) === j);
                let identificador = objOriginal ? (objOriginal.cpf || objOriginal.nome) : j;
                return identificador !== chapeuFaseAnterior;
            });
        }

        if (candidatosViaveis.length === 0) {
            candidatosViaveis = candidatosChapeu;
        }

        let escolhidoParaChapeu = candidatosViaveis[Math.floor(Math.random() * candidatosViaveis.length)];
        let indiceCandidato = copia.indexOf(escolhidoParaChapeu);

        chapeu = copia.splice(indiceCandidato, 1)[0];

        let objChapeuOriginal = todosJogadores.find(item => (item.apelido || item.nome) === chapeu);
        let identificadorChapeu = objChapeuOriginal ? (objChapeuOriginal.cpf || objChapeuOriginal.nome) : chapeu;
        
        historicoChapeus[nomeFaseAtual] = identificadorChapeu;
        localStorage.setItem("historico_chapeus_fases", JSON.stringify(historicoChapeus));
        
        alert(`🎩 O jogador ${chapeu} tirou o Chapéu nesta fase (${nomeFaseAtual}) e avançou direto!`);
    }

    return { lista: copia, chapeu: chapeu };
}

// ===============================
// INICIAR TORNEIO (SORTEIO)
// ===============================
function iniciarTorneio() {
    if (jogadores.length < 2) {
        alert("É necessário ter pelo menos 2 jogadores com pagamento APROVADO pela administração para gerar o chaveamento!");
        return;
    }

    if (bracketContainer) bracketContainer.innerHTML = "";
    perdedoresSemifinal = [];
    perdedores16Avos = [];
    viceCampeao = "";
    terceiroLugar = "";
    dadosQuadroPrincipal = { fases: {} };
    dadosRepescagem = { solicitacoes: {}, aprovados: [] };
    
    localStorage.removeItem("torneio_quadro_principal");
    localStorage.removeItem("torneio_repescagem");
    localStorage.removeItem("torneio_perdedores_16avos");
    localStorage.removeItem("podioTorneio");
    localStorage.removeItem("historico_chapeus_fases");

    let nomeInicial = "Primeira Fase";
    const resultadoSorteio = embaralharComChapeu(jogadores, nomeInicial, false);
    
    dadosQuadroPrincipal.faseInicialNome = nomeInicial;
    dadosQuadroPrincipal.jogadoresIniciais = resultadoSorteio.lista;
    dadosQuadroPrincipal.chapeuPrimeiraFase = resultadoSorteio.chapeu;

    dadosQuadroPrincipal.fases[nomeInicial] = {
        mapaVencedores: {},
        vencedoresDestaFase: resultadoSorteio.chapeu ? [resultadoSorteio.chapeu] : [],
        chapeuDestaFase: resultadoSorteio.chapeu
    };
    
    localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
    localStorage.setItem("torneio_repescagem", JSON.stringify(dadosRepescagem));

    rederizarNovamenteQuadroPrincipal();
    renderizarPainelRepescagem();
}

// ===============================
// CRIAR COLUNA DA FASE NA ÁRVORE PRINCIPAL
// ===============================
function criarColunaFaseSimples(nomeFase, listaJogadores) {
    const faseDiv = document.createElement("div");
    faseDiv.classList.add("fase");
    faseDiv.dataset.nomeFase = nomeFase;

    const titulo = document.createElement("h2");
    titulo.textContent = nomeFase;
    faseDiv.appendChild(titulo);

    const confrontosDiv = document.createElement("div");
    confrontosDiv.classList.add("confrontos");

    if (nomeFase === "Primeira Fase" && dadosQuadroPrincipal.chapeuPrimeiraFase) {
        const infoChapeu = document.createElement("div");
        infoChapeu.style = "background:rgba(243,156,18,0.2); border:1px solid #f39c12; padding:8px; border-radius:6px; margin-bottom:10px; font-size:12px; color:#fff;";
        infoChapeu.innerHTML = `<strong>🎩 Chapéu:</strong> ${dadosQuadroPrincipal.chapeuPrimeiraFase} avançou direto.`;
        faseDiv.appendChild(infoChapeu);
    }

    let faseAtualObj = dadosQuadroPrincipal.fases[nomeFase] || { mapaVencedores: {}, vencedoresDestaFase: [], chapeuDestaFase: null };

    let listaEfetiva = [...listaJogadores];

    if (nomeFase === "Segunda Fase") {
        let vencedoresFaseAnterior = [];
        let faseAnteriorObj = dadosQuadroPrincipal.fases["Primeira Fase"];
        if (faseAnteriorObj && faseAnteriorObj.mapaVencedores) {
            Object.values(faseAnteriorObj.mapaVencedores).forEach(v => {
                if (v && !vencedoresFaseAnterior.includes(v)) vencedoresFaseAnterior.push(v);
            });
            if (faseAnteriorObj.chapeuDestaFase && !vencedoresFaseAnterior.includes(faseAnteriorObj.chapeuDestaFase)) {
                vencedoresFaseAnterior.push(faseAnteriorObj.chapeuDestaFase);
            }
        }

        let aprovadosRepescagem = dadosRepescagem.aprovados || [];
        let combinados = [...vencedoresFaseAnterior];
        aprovadosRepescagem.forEach(v => {
            if (!combinados.includes(v)) combinados.push(v);
        });

        if (!faseAtualObj.listaEmbaralhadaSegundaFase) {
            let resultadoSorteioSegunda = embaralharComChapeu(combinados, nomeFase, true);
            faseAtualObj.listaEmbaralhadaSegundaFase = resultadoSorteioSegunda.lista;
            faseAtualObj.chapeuDestaFase = resultadoSorteioSegunda.chapeu;
            localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
        }

        listaEfetiva = [...faseAtualObj.listaEmbaralhadaSegundaFase];

        if (faseAtualObj.chapeuDestaFase) {
            const infoChapeuSegunda = document.createElement("div");
            infoChapeuSegunda.style = "background:rgba(243,156,18,0.2); border:1px solid #f39c12; padding:8px; border-radius:6px; margin-bottom:10px; font-size:12px; color:#fff;";
            infoChapeuSegunda.innerHTML = `<strong>🎩 Chapéu (Segunda Fase):</strong> ${faseAtualObj.chapeuDestaFase} (Veio da 1ª Fase) avançou direto.`;
            faseDiv.appendChild(infoChapeuSegunda);
        }

    } else if (nomeFase === "Terceira Fase" || nomeFase === "Quarta Fase" || nomeFase === "Quinta Fase") {
        if (!faseAtualObj.listaEmbaralhadaFase) {
            let resultadoEmbaralhado = embaralharComChapeu(listaEfetiva, nomeFase, false);
            faseAtualObj.listaEmbaralhadaFase = resultadoEmbaralhado.lista;
            faseAtualObj.chapeuDestaFase = resultadoEmbaralhado.chapeu;
            localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
        }

        listaEfetiva = [...faseAtualObj.listaEmbaralhadaFase];

        if (faseAtualObj.chapeuDestaFase) {
            const infoChapeuProx = document.createElement("div");
            infoChapeuProx.style = "background:rgba(243,156,18,0.2); border:1px solid #f39c12; padding:8px; border-radius:6px; margin-bottom:10px; font-size:12px; color:#fff;";
            infoChapeuProx.innerHTML = `<strong>🎩 Chapéu (${nomeFase}):</strong> ${faseAtualObj.chapeuDestaFase} avançou direto.`;
            faseDiv.appendChild(infoChapeuProx);
        }
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
        }

        const elJ1 = criarElementoJogadorQuartoPrincipal(j1, vencedorAtual, confronto, indiceConfronto, nomeFase, listaEfetiva);
        const elJ2 = criarElementoJogadorQuartoPrincipal(j2, vencedorAtual, confronto, indiceConfronto, nomeFase, listaEfetiva);

        confronto.appendChild(elJ1);
        confronto.appendChild(elJ2);
        confrontosDiv.appendChild(confronto);
    }

    faseDiv.appendChild(confrontosDiv);
    if (bracketContainer) bracketContainer.appendChild(faseDiv);
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
    if (!dadosQuadroPrincipal.fases[nomeFase]) {
        dadosQuadroPrincipal.fases[nomeFase] = { mapaVencedores: {}, vencedoresDestaFase: [], chapeuDestaFase: null };
    }
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

    if (nomeFase === "Quinta Fase") {
        let j1 = listaJogadores[indiceConfronto * 2];
        let j2 = listaJogadores[indiceConfronto * 2 + 1];
        let perdedor = (nomeVencedor === j1) ? j2 : j1;
        if (perdedor && perdedor !== "BYE (Avança automaticamente)" && !perdedoresSemifinal.includes(perdedor)) {
            perdedoresSemifinal.push(perdedor);
        }
    }

    if (nomeFase === "Grande Final") {
        let j1 = listaJogadores[0];
        let j2 = listaJogadores[1];
        viceCampeao = (nomeVencedor === j1) ? j2 : j1;
    }

    if (nomeFase === "Disputa de 3º Lugar") {
        terceiroLugar = nomeVencedor;
    }

    localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
    rederizarNovamenteQuadroPrincipal();
    verificarFaseConcluidaQuadroPrincipal(nomeFase, listaJogadores);
}

function desfazerVitoriaQuadroPrincipal(nomeFase, indiceConfronto, listaJogadores) {
    let faseObj = dadosQuadroPrincipal.fases[nomeFase];
    if (!faseObj) return;
    
    delete faseObj.mapaVencedores[indiceConfronto];
    
    faseObj.vencedoresDestaFase = Object.values(faseObj.mapaVencedores);
    if (faseObj.chapeuDestaFase) {
        faseObj.vencedoresDestaFase.push(faseObj.chapeuDestaFase);
    }

    if (nomeFase === "Quinta Fase") perdedoresSemifinal = [];
    if (nomeFase === "Grande Final") viceCampeao = "";
    if (nomeFase === "Disputa de 3º Lugar") terceiroLugar = "";

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
    bracketContainer.innerHTML = "";

    let faseAtualNome = dadosQuadroPrincipal.faseInicialNome || "Primeira Fase";
    let listaAtual = dadosQuadroPrincipal.jogadoresIniciais || jogadores;

    while (faseAtualNome) {
        criarColunaFaseSimples(faseAtualNome, listaAtual);
        
        let faseObj = dadosQuadroPrincipal.fases[faseAtualNome];
        if (!faseObj) break;

        let listaEfetivaFase = [...listaAtual];
        if (faseAtualNome === "Segunda Fase" && faseObj.listaEmbaralhadaSegundaFase) {
            listaEfetivaFase = [...faseObj.listaEmbaralhadaSegundaFase];
        } else if ((faseAtualNome === "Terceira Fase" || faseAtualNome === "Quarta Fase" || faseAtualNome === "Quinta Fase") && faseObj.listaEmbaralhadaFase) {
            listaEfetivaFase = [...faseObj.listaEmbaralhadaFase];
        }

        let totalConfs = Math.ceil(listaEfetivaFase.length / 2);
        let confrontosPreenchidos = Object.keys(faseObj.mapaVencedores || {}).length;
        
        if (confrontosPreenchidos >= totalConfs && totalConfs > 0) {
            let proximaLista = [];
            for (let c = 0; c < totalConfs; c++) {
                if (faseObj.mapaVencedores[c]) {
                    proximaLista.push(faseObj.mapaVencedores[c]);
                }
            }
            if (faseObj.chapeuDestaFase) {
                proximaLista.push(faseObj.chapeuDestaFase);
            }

            listaAtual = proximaLista;
            faseAtualNome = obterProximaFaseNome(faseAtualNome);
        } else {
            break;
        }
    }

    if (dadosQuadroPrincipal.fases["Disputa de 3º Lugar"]) {
        criarColunaFaseSimples("Disputa de 3º Lugar", perdedoresSemifinal.length === 2 ? perdedoresSemifinal : ["A definir", "A definir"]);
    }
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
    let listaEfetivaValidacao = [...listaJogadores];

    if (faseAtual === "Segunda Fase" && faseObj.listaEmbaralhadaSegundaFase) {
        listaEfetivaValidacao = [...faseObj.listaEmbaralhadaSegundaFase];
    } else if ((faseAtual === "Terceira Fase" || faseAtual === "Quarta Fase" || faseAtual === "Quinta Fase") && faseObj.listaEmbaralhadaFase) {
        listaEfetivaValidacao = [...faseObj.listaEmbaralhadaFase];
    }

    let totalConfrontos = Math.ceil(listaEfetivaValidacao.length / 2);
    let confrontosPreenchidos = Object.keys(faseObj.mapaVencedores || {}).length;

    if (confrontosPreenchidos >= totalConfrontos) {
        let proximaFase = obterProximaFaseNome(faseAtual);
        if (proximaFase) {
            if (!dadosQuadroPrincipal.fases[proximaFase]) {
                dadosQuadroPrincipal.fases[proximaFase] = {
                    mapaVencedores: {},
                    vencedoresDestaFase: [],
                    chapeuDestaFase: null
                };
                localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
            }
        } 
        
        if (faseAtual === "Quinta Fase" && perdedoresSemifinal.length === 2) {
            if (!dadosQuadroPrincipal.fases["Disputa de 3º Lugar"]) {
                dadosQuadroPrincipal.fases["Disputa de 3º Lugar"] = { mapaVencedores: {}, vencedoresDestaFase: [] };
                localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
            }
        }

        if (faseAtual === "Grande Final") {
            let vencedorFinal = Object.values(faseObj.mapaVencedores)[0];
            let objFinal = dadosQuadroPrincipal.fases["Grande Final"];
            let listaFinalVal = objFinal && objFinal.listaEmbaralhadaFase ? objFinal.listaEmbaralhadaFase : listaJogadores;
            if (vencedorFinal) {
                exibirCampeao(vencedorFinal);
            }
        }

        rederizarNovamenteQuadroPrincipal();
    }
}

function carregarQuadroPrincipalSalvo() {
    perdedores16Avos = JSON.parse(localStorage.getItem("torneio_perdedores_16avos")) || [];
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
// LÓGICA DA REPESCAGEM SIMPLIFICADA
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
        let isAprovado = (dadosRepescagem.aprovados || []).includes(jogador);

        let badgeStyle = "background:#333; color:#fff; cursor:pointer;";
        let textoBotao = jogador;

        if (status === "pendente" && !isAprovado) {
            badgeStyle = "background:#d35400; color:#fff; cursor:default;";
            textoBotao = `${jogador} (Aguardando Aprovação)`;
        } else if (isAprovado) {
            badgeStyle = "background:#27ae60; color:#fff; cursor:default;";
            textoBotao = `${jogador} (Aprovado ✓)`;
        }

        let tag = document.createElement("div");
        tag.className = "tag-eliminado";
        tag.style = `padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; ${badgeStyle}`;
        tag.innerText = textoBotao;

        if (status === "nao_solicitado" && !isAprovado) {
            tag.onclick = () => abrirModalRepescagem(jogador);
        }

        const perfilUsuario = localStorage.getItem("usuario_perfil");
        if (perfilUsuario === "admin") {
            if (status === "pendente" && !isAprovado) {
                let btnAprovar = document.createElement("button");
                btnAprovar.innerText = "Aprovar R$50";
                btnAprovar.style = "background:#27ae60; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;";
                btnAprovar.onclick = (e) => {
                    e.stopPropagation();
                    aprovarRepescagemAdmin(jogador);
                };
                tag.appendChild(btnAprovar);
            } else if (isAprovado) {
                let btnRemover = document.createElement("button");
                btnRemover.innerText = "Remover";
                btnRemover.style = "background:#c0392b; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;";
                btnRemover.onclick = (e) => {
                    e.stopPropagation();
                    removerRepescagemAdmin(jogador);
                };
                tag.appendChild(btnRemover);
            }
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
    if (!dadosRepescagem.aprovados) dadosRepescagem.aprovados = [];
    if (!dadosRepescagem.aprovados.includes(nomeJogador)) {
        dadosRepescagem.aprovados.push(nomeJogador);
    }
    localStorage.setItem("torneio_repescagem", JSON.stringify(dadosRepescagem));
    
    if (dadosQuadroPrincipal.fases["Segunda Fase"]) {
        delete dadosQuadroPrincipal.fases["Segunda Fase"].listaEmbaralhadaSegundaFase;
        delete dadosQuadroPrincipal.fases["Segunda Fase"].chapeuDestaFase;
        localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
    }

    alert(`Pagamento de ${nomeJogador} aprovado! O jogador foi inserido no sorteio da Segunda Fase do Quadro Principal.`);
    
    renderizarPainelRepescagem();
    rederizarNovamenteQuadroPrincipal();
}

function removerRepescagemAdmin(nomeJogador) {
    dadosRepescagem.solicitacoes[nomeJogador] = "nao_solicitado";
    dadosRepescagem.aprovados = (dadosRepescagem.aprovados || []).filter(j => j !== nomeJogador);
    localStorage.setItem("torneio_repescagem", JSON.stringify(dadosRepescagem));

    if (dadosQuadroPrincipal.fases["Segunda Fase"]) {
        delete dadosQuadroPrincipal.fases["Segunda Fase"].listaEmbaralhadaSegundaFase;
        delete dadosQuadroPrincipal.fases["Segunda Fase"].chapeuDestaFase;
        localStorage.setItem("torneio_quadro_principal", JSON.stringify(dadosQuadroPrincipal));
    }

    alert(`Aprovação de ${nomeJogador} removida.`);
    renderizarPainelRepescagem();
    rederizarNovamenteQuadroPrincipal();
}