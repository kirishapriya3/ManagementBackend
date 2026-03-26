// Test Stripe integration
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testStripeIntegration() {
    try {
        console.log('Testing Stripe integration...');
        
        // Test 1: Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 9500, // ₹95.00 in cents
            currency: 'inr',
            payment_method_types: ['card'],
            metadata: {
                test: 'true',
                billId: 'test-bill-id'
            }
        });
        
        console.log('✅ Payment Intent Created:', paymentIntent.id);
        console.log('✅ Client Secret:', paymentIntent.client_secret);
        console.log('✅ Amount:', paymentIntent.amount / 100, 'INR');
        
        // Test 2: Create a checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: 'Test Hostel Bill',
                        description: 'March 2026 - Room 301',
                    },
                    unit_amount: 9500, // ₹95.00
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: 'http://localhost:5173/payment/success',
            cancel_url: 'http://localhost:5173/payment/cancel',
        });
        
        console.log('✅ Checkout Session Created:', session.id);
        console.log('✅ Checkout URL:', session.url);
        
        console.log('\n🎉 Stripe integration is working correctly!');
        console.log('📝 Use these test details:');
        console.log('   Card Number: 4242 4242 4242 4242');
        console.log('   Expiry: 12/34');
        console.log('   CVC: 123');
        
    } catch (error) {
        console.error('❌ Stripe Test Failed:', error.message);
    }
}

testStripeIntegration();
