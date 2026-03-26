import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== Webhook Debug Test ===\n');

// Check environment variables
console.log('Environment Check:');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING ❌');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'MISSING ❌');

// Test webhook endpoint
const testWebhookEndpoint = async () => {
    try {
        console.log('\n=== Testing Webhook Endpoint ===');
        
        // Create a test webhook payload (simulating Stripe)
        const testPayload = {
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_test_' + Date.now(),
                    payment_status: 'paid',
                    payment_intent: 'pi_test_' + Date.now(),
                    amount_total: 17500,
                    metadata: {
                        billId: '69b93c7940fc9368b8c38b01',
                        residentId: '69b842448e94be7bce781914'
                    }
                }
            }
        };

        // Create signature (simulating Stripe)
        const payloadString = JSON.stringify(testPayload);
        const signature = crypto
            .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
            .update(payloadString, 'utf8')
            .digest('hex');
        
        const stripeSignature = `t=${Date.now()},v1=${signature}`;

        console.log('Sending test webhook...');
        
        const response = await axios.post(
            'http://localhost:5000/api/payment/webhook',
            testPayload,
            {
                headers: {
                    'stripe-signature': stripeSignature,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Webhook test successful!');
        console.log('Response:', response.data);
        
    } catch (error) {
        console.error('❌ Webhook test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

// Test if backend is running
const testBackendConnection = async () => {
    try {
        console.log('=== Testing Backend Connection ===');
        const response = await axios.get('http://localhost:5000/');
        console.log('✅ Backend is running');
        return true;
    } catch (error) {
        console.error('❌ Backend is not running on port 5000');
        console.error('Please start your backend with: npm run dev');
        return false;
    }
};

// Run tests
const runTests = async () => {
    const backendRunning = await testBackendConnection();
    if (backendRunning) {
        await testWebhookEndpoint();
    }
};

runTests();
