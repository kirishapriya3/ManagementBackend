// Test webhook endpoint
import express from 'express';
import { handleWebhook } from './Controllers/paymentController.js';

const app = express();

// Raw body parser for webhooks
app.use('/api/payment/webhook', express.raw({type: 'application/json'}));

// Webhook endpoint
app.post('/api/payment/webhook', handleWebhook);

// Test endpoint
app.get('/test-webhook', (req, res) => {
    res.json({ message: 'Webhook test endpoint is working' });
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Webhook test server running on port ${PORT}`);
    console.log(`Test webhook at: http://localhost:${PORT}/test-webhook`);
});
