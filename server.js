const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY;
const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || "AroundShop";
const WEBHOOK_SECRET = process.env.MONEROO_WEBHOOK_SECRET;

app.post('/webhook-moneroo', async (req, res) => {
    // VERIFICATION DU HASH SECRET
    const incomingHash = req.headers['x-moneroo-hash']; 
    
    if (WEBHOOK_SECRET && incomingHash !== WEBHOOK_SECRET) {
        console.log("Tentative de fraude détectée !");
        return res.sendStatus(401);
    }

    const event = req.body;
    if (event.event === 'payment.succeeded') {
        const payment = event.data;
        const deviceId = payment.metadata.device_id;
        const customerPhone = payment.customer.phone;
        const activationCode = "G-" + deviceId.substring(0, 8).toUpperCase();

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

// Gardez le reste du fichier (create-moneroo-payment etc.) identique
app.post('/create-moneroo-payment', async (req, res) => {
    // ... (votre code précédent pour créer le paiement)
});

app.listen(process.env.PORT || 3000);
