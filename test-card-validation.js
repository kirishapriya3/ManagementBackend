// Test card validation directly with Stripe API
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testCardValidation() {
    try {
        console.log('🔍 Testing card validation with Stripe API...\n');
        
        // Test 1: Create a payment method with test card
        console.log('Test 1: Creating payment method with test card...');
        try {
            const paymentMethod = await stripe.paymentMethods.create({
                type: 'card',
                card: {
                    number: '4242424242424242',
                    exp_month: 12,
                    exp_year: 34,
                    cvc: '123',
                },
                billing_details: {
                    name: 'Test User',
                    email: 'test@example.com',
                },
            });
            
            console.log('✅ Payment Method Created Successfully!');
            console.log('   ID:', paymentMethod.id);
            console.log('   Card:', paymentMethod.card.brand, '****', paymentMethod.card.last4);
            console.log('   Status:', paymentMethod.card.funding);
            
        } catch (error) {
            console.log('❌ Payment Method Creation Failed:');
            console.log('   Error:', error.message);
            console.log('   Type:', error.type);
            console.log('   Code:', error.code);
        }
        
        // Test 2: Create a payment intent
        console.log('\nTest 2: Creating payment intent...');
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: 9500, // ₹95.00
                currency: 'inr',
                payment_method_types: ['card'],
                payment_method: 'pm_card_visa', // Use Stripe's test card
                confirm: true,
            });
            
            console.log('✅ Payment Intent Created Successfully!');
            console.log('   ID:', paymentIntent.id);
            console.log('   Status:', paymentIntent.status);
            console.log('   Amount:', paymentIntent.amount / 100, 'INR');
            
        } catch (error) {
            console.log('❌ Payment Intent Creation Failed:');
            console.log('   Error:', error.message);
            console.log('   Type:', error.type);
            console.log('   Code:', error.code);
        }
        
        // Test 3: Check account status
        console.log('\nTest 3: Checking Stripe account status...');
        try {
            const account = await stripe.accounts.retrieve();
            console.log('✅ Account Retrieved Successfully!');
            console.log('   ID:', account.id);
            console.log('   Type:', account.type);
            console.log('   Country:', account.country);
            console.log('   Charges Enabled:', account.charges_enabled);
            console.log('   Payouts Enabled:', account.payouts_enabled);
            
        } catch (error) {
            console.log('❌ Account Retrieval Failed:');
            console.log('   Error:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testCardValidation();
