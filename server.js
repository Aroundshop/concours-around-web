const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Récupération des clés configurées dans Render
const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY;
const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || "AroundShop";
const MONEROO_WEBHOOK_SECRET = process.env.MONEROO_WEBHOOK_SECRET;

// Détection automatique de l'URL de votre serveur Render
const SERVER_URL = process.env.RENDER_EXTERNAL_URL || "https://concours-around-server.onrender.com";

// 1. Initialisation du paiement Orange/Moov
app.post('/create-moneroo-payment', async (req, res) => {
    try {
        const response = await axios.post('https://api.moneroo.io/v1/payments/initialize', {
            amount: 5050,
            currency: "XOF",
            description: "Activation Premium Concours Around",
            customer: {
                name: "Utilisateur Android"
            },
            notify_url: `${SERVER_URL}/webhook-moneroo`,
            metadata: {
                device_id: req.body.device_id
            }
        }, {
            headers: {
                'Authorization': `Bearer ${MONEROO_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erreur Moneroo Init:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.message });
    }
});

// 2. Webhook : Confirmation de paiement -> Envoi automatique du SMS
app.post('/webhook-moneroo', async (req, res) => {
    // Vérification de sécurité avec le Hash Secret
    const incomingHash = req.headers['x-moneroo-hash'];
    if (MONEROO_WEBHOOK_SECRET && incomingHash !== MONEROO_WEBHOOK_SECRET) {
        console.warn("Webhook reçu avec un hash incorrect.");
        return res.sendStatus(401);
    }

    const event = req.body;
    console.log("Webhook reçu:", JSON.stringify(event));

    if (event.event === 'payment.succeeded') {
        const payment = event.data;
        const deviceId = payment.metadata.device_id;
        const customerPhone = payment.customer.phone;

        // Génération du code (doit correspondre à Android : G-XXXXXXXX)
        const activationCode = "G-" + deviceId.substring(0, 8).toUpperCase();

        console.log(`Paiement réussi pour : ${customerPhone}. Envoi du code : ${activationCode}`);

        // ENVOI DU SMS VIA TERMII
        try {
            await axios.post('https://api.ng.termii.com/api/sms/send', {
                to: customerPhone,
                from: TERMII_SENDER_ID,
                sms: `Félicitations ! Votre code d'activation Concours Around est : ${activationCode}. Entrez-le dans l'application pour débloquer les 200 activités.`,
                type: "plain",
                channel: "generic",
                api_key: TERMII_API_KEY
            });
            console.log(`SMS envoyé avec succès à ${customerPhone}`);
        } catch (smsError) {
            console.error("Erreur d'envoi SMS :", smsError.response ? smsError.response.data : smsError.message);
        }
    }

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur Moneroo + SMS Termii lancé sur le port ${PORT}`));
