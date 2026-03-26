import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from './Models/Payment.js';
import Billing from './Models/Billing.js';
import Invoice from './Models/Invoice.js';

dotenv.config();

const checkInvoiceStatus = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hostel-management');
        console.log('✅ Connected to database');

        // Check current data
        const payments = await Payment.find({});
        const bills = await Billing.find({});
        const invoices = await Invoice.find({});

        console.log('\n=== Database Status ===');
        console.log(`Payments: ${payments.length}`);
        console.log(`Bills: ${bills.length}`);
        console.log(`Invoices: ${invoices.length}`);

        if (payments.length > 0) {
            console.log('\n=== Latest Payment ===');
            const latestPayment = payments[0];
            console.log('ID:', latestPayment._id);
            console.log('Stripe Payment ID:', latestPayment.stripePaymentId);
            console.log('Amount:', latestPayment.amount);
            console.log('Status:', latestPayment.status);
            console.log('Bill ID:', latestPayment.billId);
            console.log('Created:', latestPayment.createdAt);
        }

        if (invoices.length > 0) {
            console.log('\n=== Latest Invoice ===');
            const latestInvoice = invoices[0];
            console.log('ID:', latestInvoice._id);
            console.log('Invoice Number:', latestInvoice.invoiceNumber);
            console.log('Payment ID:', latestInvoice.paymentId);
            console.log('Amount:', latestInvoice.totalAmount);
            console.log('Status:', latestInvoice.status);
            console.log('Created:', latestInvoice.createdAt);
        } else {
            console.log('\n❌ No invoices found in database');
            console.log('This means the webhook is not being called or invoice creation is failing');
        }

        // Test manual invoice creation
        if (payments.length > 0 && bills.length > 0) {
            console.log('\n=== Testing Manual Invoice Creation ===');
            try {
                const payment = payments[0];
                const bill = await Billing.findById(payment.billId);
                
                console.log('Creating invoice for payment:', payment.stripePaymentId);
                
                // Import createInvoice function
                const { createInvoice } = await import('./Controllers/invoiceController.js');
                
                const invoice = await createInvoice({
                    paymentIntentId: payment.stripePaymentId,
                    billId: payment.billId,
                    amount: payment.amount
                });
                
                console.log('✅ Manual invoice created successfully!');
                console.log('Invoice Number:', invoice.invoiceNumber);
                
            } catch (error) {
                console.error('❌ Manual invoice creation failed:', error.message);
            }
        }

    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkInvoiceStatus();
