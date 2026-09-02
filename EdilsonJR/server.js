const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Payment } = require("mercadopago");

const app = express();
app.use(express.json());
app.use(cors());

// Configuração do SDK com a chave privada do Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});
const payment = new Payment(client);

// Rota para gerar a cobrança Pix
app.post("/criar-pix", async (req, res) => {
    try {
        const { nome, email } = req.body;

        const response = await payment.create({
            body: {
                transaction_amount: 100.00,
                description: "Inscrição Torneio de Sinuca dos Amigos",
                payment_method_id: "pix",
                payer: {
                    email: email,
                    first_name: nome
                }
            }
        });

        res.json({
            id: response.id,
            qr_code: response.point_of_interaction.transaction_data.qr_code,
            qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64
        });
    } catch (error) {
        console.error("Erro ao gerar Pix:", error);
        res.status(500).json({ error: "Falha ao gerar cobrança no Mercado Pago." });
    }
});

// Rota para consultar status do pagamento
app.get("/status-pagamento/:id", async (req, res) => {
    try {
        const paymentInfo = await payment.get({ id: req.params.id });
        res.json({ status: paymentInfo.status });
    } catch (error) {
        res.status(500).json({ error: "Erro ao consultar status." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});