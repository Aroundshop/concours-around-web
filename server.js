const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Clés secrètes (à configurer sur Render)
const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY;
const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || "AroundShop";

// 1. Route pour lancer le paiement
app.post('/create-moneroo-payment', async (req, res) => {
    try {
        const response = await axios.post('https://api.moneroo.io/v1/payments/initialize', {
            amount: 5050,
            currency: "XOF",
            description: "Activation Premium Concours Around",
            customer: { name: "Utilisateur Android" },
            notify_url: "https://votre-url-render.onrender.com/webhook-moneroo",
            metadata: { device_id: req.body.device_id }
        }, {
            headers: { 'Authorization': `Bearer ${MONEROO_SECRET_KEY}` }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Webhook : Reçoit la confirmation de paiement et envoie le SMS
app.post('/webhook-moneroo', async (req, res) => {
    const event = req.body;
    if (event.event === 'payment.succeeded') {
        const payment = event.data;
        const deviceId = payment.metadata.device_id;
        const customerPhone = payment.customer.phone; // Numéro du client

        // Génération du code (ex: G-7F8A1B2C)
        const activationCode = "G-" + deviceId.substring(0, 8).toUpperCase();

        // Envoi du SMS via Termii
        try {
            await axios.post('https://api.ng.termii.com/api/sms/send', {
                to: customerPhone,
                from: TERMII_SENDER_ID,
                sms: `Votre code d'activation Concours Around est : ${activationCode}`,
                type: "plain",
                channel: "generic",
                api_key: TERMII_API_KEY
            });
        } catch (e) { console.error("Erreur SMS", e.message); }
    }
    res.sendStatus(200);
});

app.listen(process.env.PORT || 3000);
