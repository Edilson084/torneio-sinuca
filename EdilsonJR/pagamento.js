async function gerarPix() {
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;

    if (!nome || !email) {
        alert("Por favor, preencha o nome e o e-mail.");
        return;
    }

    try {
        // Envia os dados para o backend Node.js que está rodando na porta 3000
        const resposta = await fetch("http://localhost:3000/criar-pix", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, email })
        });

        const dados = await resposta.json();

        if (dados.qr_code_base64) {
            // Renderiza o QR Code na tela
            document.getElementById("area-qrcode").innerHTML = `
                <h3>Escaneie o QR Code para pagar R$ 100,00</h3>
                <img src="data:image/jpeg;base64,${dados.qr_code_base64}" alt="QR Code Pix" style="width: 200px; height: 200px;">
                <p><strong>Copia e Cola:</strong></p>
                <textarea readonly style="width: 100%; height: 60px;">${dados.qr_code}</textarea>
            `;
            
            // Inicia a verificação automática se o Pix foi pago
            checarStatusPagamento(dados.id);
        } else {
            alert("Erro ao gerar o Pix. Verifique o seu MP_ACCESS_TOKEN no arquivo .env.");
        }

    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert("Não foi possível conectar com o servidor.");
    }
}

// Função que consulta o status do Pix a cada 5 segundos
function checarStatusPagamento(paymentId) {
    const intervalo = setInterval(async () => {
        try {
            const resposta = await fetch(`http://localhost:3000/status-pagamento/${paymentId}`);
            const dados = await resposta.json();

            if (dados.status === "approved") {
                clearInterval(intervalo);
                alert("🎉 Pagamento Aprovado com sucesso! Inscrição confirmada.");
                window.location.href = "jogadores.html"; // Redireciona o jogador
            }
        } catch (erro) {
            console.error("Erro ao checar status:", erro);
        }
    }, 5000); // 5000ms = 5 segundos
}