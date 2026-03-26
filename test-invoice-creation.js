import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from './Models/Payment.js';
import Billing from './Models/Billing.js';
import Invoice from './Models/Invoice.js';

dotenv.config();

const testInvoiceCreation = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hostel-management');
        console.log('Connected to database');
        console.log('Database URL:', process.env.MONGO_URI || 'mongodb://localhost:27017/hostel-management');

        // Check if there are any payments
        const payments = await Payment.find({});
        console.log('Total payments found:', payments.length);
        
        if (payments.length > 0) {
            console.log('Latest payment:', {
                id: payments[0]._id,
                stripePaymentId: payments[0].stripePaymentId,
                amount: payments[0].amount,
                status: payments[0].status,
                billId: payments[0].billId
            });
        }

        // Check if there are any bills
        const bills = await Billing.find({});
        console.log('Total bills found:', bills.length);
        
        if (bills.length > 0) {
            console.log('Latest bill:', {
                id: bills[0]._id,
                residentId: bills[0].residentId,
                totalAmount: bills[0].totalAmount,
                status: bills[0].status
            });
        }

        // Check if there are any invoices
        const invoices = await Invoice.find({});
        console.log('Total invoices found:', invoices.length);
        
        if (invoices.length > 0) {
            console.log('Latest invoice:', {
                id: invoices[0]._id,
                invoiceNumber: invoices[0].invoiceNumber,
                residentId: invoices[0].residentId,
                billId: invoices[0].billId,
                paymentId: invoices[0].paymentId,
                totalAmount: invoices[0].totalAmount
            });
        }

        // Test manual invoice creation
        if (payments.length > 0 && bills.length > 0) {
            console.log('\nTesting manual invoice creation...');
            
            const payment = payments[0];
            const bill = await Billing.findById(bills[0]._id).populate('residentId roomId');
            
            console.log('Bill residentId:', bill.residentId);
            
            const invoice = new Invoice({
                residentId: bill.residentId._id || bill.residentId,
                billId: bill._id,
                paymentId: payment._id,
                billingPeriod: bill.billingPeriod,
                charges: bill.charges,
                totalAmount: bill.totalAmount,
                paidAmount: payment.amount,
                paymentDate: new Date(),
                paymentMethod: 'card',
                transactionId: payment.stripePaymentId,
                status: 'paid',
                dueDate: bill.dueDate
            });
            
            await invoice.save();
            console.log('Manual invoice created successfully:', invoice.invoiceNumber);
        }

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

testInvoiceCreation();
