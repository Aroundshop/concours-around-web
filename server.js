const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

app.post('/create-payment', async (req, res) => {
    try {
        const response = await axios.post('https://api.nowpayments.io/v1/payment', req.body, {
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/status/:paymentId', async (req, res) => {
    try {
        const response = await axios.get(`https://api.nowpayments.io/v1/payment/${req.params.paymentId}`, {
            headers: { 'x-api-key': NOWPAYMENTS_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
