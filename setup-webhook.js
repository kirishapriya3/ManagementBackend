import crypto from 'crypto';
import dotenv from 'dotenv';

console.log('=== Stripe Webhook Setup ===\n');

// Check current environment variables
console.log('Current .env variables:');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING ❌');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'MISSING ❌');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'MISSING ❌');

// Generate a secure webhook secret
const webhookSecret = crypto.randomBytes(32).toString('hex');

console.log('\n=== SOLUTION ===');
console.log('Add this to your .env file:');
console.log('\n# Stripe Webhook Secret');
console.log(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
console.log('\n# Also make sure you have:');
console.log('STRIPE_SECRET_KEY=sk_test_...');
console.log('FRONTEND_URL=http://localhost:5173');

console.log('\n=== Next Steps ===');
console.log('1. Add STRIPE_WEBHOOK_SECRET to your .env file');
console.log('2. Restart your backend server (npm run dev)');
console.log('3. Test payment again');
console.log('4. Check webhook logs for invoice creation');

console.log('\n=== Webhook Endpoint ===');
console.log('Your webhook should be available at:');
console.log('POST http://localhost:5000/api/payment/webhook');
console.log('\nConfigure this in your Stripe Dashboard:');
console.log('1. Go to Stripe Dashboard → Webhooks');
console.log(`2. Add endpoint: http://localhost:5000/api/payment/webhook`);
console.log(`3. Use secret: ${webhookSecret}`);
console.log('4. Select events: checkout.session.completed');
