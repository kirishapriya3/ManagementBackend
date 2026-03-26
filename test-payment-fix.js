import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from './Models/Payment.js';
import Billing from './Models/Billing.js';
import Invoice from './Models/Invoice.js';
import User from './Models/User.js';

dotenv.config();

const testPaymentFix = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hostel-management');
        console.log('✅ Connected to database');

        // Test the fixed createInvoice function directly
        console.log('\n=== Testing Fixed Invoice Creation ===');
        
        // Get a test bill with residentId
        let bill = await Billing.findOne({}).populate('residentId');
        let attempts = 0;
        
        while ((!bill || !bill.residentId) && attempts < 10) {
            bill = await Billing.findOne({}).populate('residentId').skip(attempts);
            attempts++;
        }
        
        if (!bill || !bill.residentId) {
            console.log('❌ No bills with residentId found');
            console.log('Available bills:', await Billing.find({}));
            return;
        }
        
        console.log('Found bill:', bill._id);
        console.log('Resident ID:', bill.residentId);
        
        // Handle case where residentId might not be populated
        let residentName = 'Unknown';
        let residentId = bill.residentId;
        
        if (typeof bill.residentId === 'object' && bill.residentId !== null) {
            residentName = bill.residentId.name || 'Unknown';
            residentId = bill.residentId._id;
        }
        
        console.log('Resident:', residentName);
        console.log('Resident ID:', residentId);

        // Create a test payment with proper residentId
        const payment = new Payment({
            residentId: residentId,
            billId: bill._id,
            amount: bill.totalAmount,
            stripePaymentId: 'pi_test_fixed_' + Date.now(),
            status: "success",
            paymentMethod: "card"
        });

        await payment.save();
        console.log('✅ Payment created successfully');

        // Test invoice creation
        const { createInvoice } = await import('./Controllers/invoiceController.js');
        
        const invoice = await createInvoice({
            paymentIntentId: payment.stripePaymentId,
            billId: bill._id,
            amount: payment.amount
        });
        
        console.log('✅ Invoice created successfully!');
        console.log('Invoice Number:', invoice.invoiceNumber);
        console.log('Invoice ID:', invoice._id);

        // Check final database state
        const finalPayments = await Payment.find({});
        const finalInvoices = await Invoice.find({});
        
        console.log('\n=== Final Database State ===');
        console.log('Payments:', finalPayments.length);
        console.log('Invoices:', finalInvoices.length);
        
        console.log('\n=== Test Results ===');
        console.log('✅ Payment creation: WORKING');
        console.log('✅ Invoice creation: WORKING');
        console.log('✅ Database operations: WORKING');
        
        console.log('\n🎯 The fix is working! Now test through the frontend:');
        console.log('1. Make a payment through the frontend');
        console.log('2. Check the Invoices tab');
        console.log('3. Should see your invoice with download option');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

testPaymentFix();
