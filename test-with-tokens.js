// Test with Stripe's test tokens (doesn't require charges enabled)
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testWithTokens() {
    try {
        console.log('🔍 Testing with Stripe test tokens...\n');
        
        // Test 1: Create payment intent with test token
        console.log('Test 1: Creating payment intent with test card token...');
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: 9500, // ₹95.00
                currency: 'inr',
                payment_method_types: ['card'],
                // Use Stripe's built-in test card
                payment_method: 'pm_card_visa',
                confirm: true,
            });
            
            console.log('✅ Payment Intent Created Successfully!');
            console.log('   ID:', paymentIntent.id);
            console.log('   Status:', paymentIntent.status);
            console.log('   Amount:', paymentIntent.amount / 100, 'INR');
            
        } catch (error) {
            console.log('❌ Payment Intent Failed:');
            console.log('   Error:', error.message);
            console.log('   Type:', error.type);
            console.log('   Code:', error.code);
        }
        
        // Test 2: Create checkout session (should work)
        console.log('\nTest 2: Creating checkout session...');
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'Test Hostel Bill',
                            description: 'March 2026 - Room 301',
                        },
                        unit_amount: 9500,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: 'http://localhost:5173/payment/success',
                cancel_url: 'http://localhost:5173/payment/cancel',
            });
            
            console.log('✅ Checkout Session Created Successfully!');
            console.log('   ID:', session.id);
            console.log('   URL:', session.url);
            console.log('   Status:', session.status);
            
        } catch (error) {
            console.log('❌ Checkout Session Failed:');
            console.log('   Error:', error.message);
            console.log('   Type:', error.type);
            console.log('   Code:', error.code);
        }
        
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testWithTokens();
