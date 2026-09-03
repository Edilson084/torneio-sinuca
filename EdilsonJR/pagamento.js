async function processarPagamento() {
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const formaPagamento = document.getElementById("forma-pagamento").value;

    if (!nome || !email) {
        alert("Por favor, preencha o nome e o e-mail/CPF.");
        return;
    }

    // Se a forma escolhida for Dinheiro
    if (formaPagamento === "dinheiro") {
        // Salva localmente como pendente
        salvarJogadorLocalmente(nome, email, "pendente");

        alert("Inscrição registrada com sucesso! Por favor, efetue o pagamento em dinheiro diretamente com a administração do evento para validar sua vaga.");
        window.location.href = "classificacao.html";
        return;
    }

    // Caso contrário, segue o fluxo normal do Pix
    const btnProcessar = document.getElementById("btn-processar");
    btnProcessar.disabled = true;
    btnProcessar.innerText = "Gerando Pix...";

    try {
        const resposta = await fetch("https://torneio-sinuca-api.onrender.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, email })
        });

        const dados = await resposta.json();

        if (dados.qr_code_base64) {
            document.getElementById("area-qrcode").innerHTML = `
                <h3>Escaneie o QR Code para pagar R$ 100,00</h3>
                <img src="data:image/jpeg;base64,${dados.qr_code_base64}" alt="QR Code Pix" style="width: 200px; height: 200px;">
                <p><strong>Copia e Cola:</strong></p>
                <textarea readonly style="width: 100%; height: 60px;">${dados.qr_code}</textarea>
            `;
            
            salvarJogadorLocalmente(nome, email, "pendente");
            checarStatusPagamento(dados.id, email);
        } else {
            alert("Erro ao gerar o Pix. Verifique o seu MP_ACCESS_TOKEN no arquivo .env.");
            btnProcessar.disabled = false;
            btnProcessar.innerText = "Gerar QR Code Pix";
        }

    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert("Não foi possível conectar com o servidor.");
        btnProcessar.disabled = false;
        btnProcessar.innerText = "Gerar QR Code Pix";
    }
}

// Função auxiliar para gerenciar os jogadores salvos no navegador (compatível com a chave 'jogadores' do painel admin)
function salvarJogadorLocalmente(nome, email, status) {
    // Importante: unificamos para usar a chave 'jogadores' que o gerenciar.js lê
    let jogadores = JSON.parse(localStorage.getItem('jogadores')) || [];
    
    const indexExistente = jogadores.findIndex(j => j.email === email);

    // Mapeando 'statusPagamento' para a propriedade 'pago' (true/false) usada no painel admin
    const estaPago = (status === "aprovado");

    if (indexExistente >= 0) {
        jogadores[indexExistente].nome = nome;
        // Mantém o status de pagamento se já estiver pago, ou atualiza se pendente
        if (estaPago) jogadores[indexExistente].pago = true;
    } else {
        jogadores.push({
            nome: nome,
            email: email,
            pago: estaPago
        });
    }

    localStorage.setItem('jogadores', JSON.stringify(jogadores));
}

// Função que consulta o status do Pix a cada 5 segundos
function checarStatusPagamento(paymentId, emailDoJogador) {
    const intervalo = setInterval(async () => {
        try {
            const resposta = await fetch(`https://torneio-sinuca-api.onrender.com/status-pagamento/${paymentId}`);
            const dados = await resposta.json();

            if (dados.status === "approved") {
                clearInterval(intervalo);
                
                let jogadores = JSON.parse(localStorage.getItem('jogadores')) || [];
                const jogador = jogadores.find(j => j.email === emailDoJogador);
                if (jogador) {
                    jogador.pago = true;
                    localStorage.setItem('jogadores', JSON.stringify(jogadores));
                }

                alert("🎉 Pagamento Aprovado com sucesso! Inscrição confirmada.");
                window.location.href = "classificacao.html";
            }
        } catch (erro) {
            console.error("Erro ao checar status:", erro);
        }
    }, 5000);
}