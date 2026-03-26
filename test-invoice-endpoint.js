import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from './Models/Payment.js';
import Billing from './Models/Billing.js';
import Invoice from './Models/Invoice.js';
import User from './Models/User.js';
import Room from './Models/Room.js';

dotenv.config();

const app = express();
app.use(express.json());

// Test endpoint to create a test payment
app.post('/test-create-payment', async (req, res) => {
    try {
        console.log('Creating test payment...');
        
        // Get the latest bill
        const bill = await Billing.findOne({}).sort({ createdAt: -1 });
        if (!bill) {
            return res.status(404).json({ message: 'No bills found' });
        }
        
        console.log('Found bill:', bill._id);
        
        // Create a test payment
        const payment = new Payment({
            residentId: bill.residentId,
            billId: bill._id,
            amount: bill.totalAmount,
            stripePaymentId: 'pi_test_' + Date.now(),
            status: "success",
            paymentMethod: "card"
        });
        
        await payment.save();
        console.log('Test payment created successfully:', payment.stripePaymentId);
        
        res.json({ 
            message: 'Test payment created successfully', 
            payment: {
                id: payment._id,
                stripePaymentId: payment.stripePaymentId,
                amount: payment.amount,
                status: payment.status,
                billId: payment.billId
            }
        });
        
    } catch (error) {
        console.error('Error creating test payment:', error);
        res.status(500).json({ 
            message: 'Error creating payment', 
            error: error.message 
        });
    }
});

// Test endpoint to create invoice manually
app.post('/test-create-invoice', async (req, res) => {
    try {
        console.log('Testing manual invoice creation...');
        
        // Get the latest payment
        const payment = await Payment.findOne({}).sort({ createdAt: -1 });
        if (!payment) {
            return res.status(404).json({ message: 'No payments found' });
        }
        
        console.log('Found payment:', payment.stripePaymentId);
        
        // Get the bill for this payment
        const bill = await Billing.findById(payment.billId).populate('residentId roomId');
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        
        console.log('Found bill:', bill._id);
        console.log('Bill residentId:', bill.residentId);
        
        // Check if invoice already exists
        const existingInvoice = await Invoice.findOne({ paymentId: payment._id });
        if (existingInvoice) {
            return res.json({ message: 'Invoice already exists', invoice: existingInvoice });
        }
        
        // Generate invoice number
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const invoiceNumber = `INV-${year}${month}-${random}`;
        
        // Create invoice
        const invoice = new Invoice({
            invoiceNumber: invoiceNumber,
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
        console.log('Invoice created successfully:', invoice.invoiceNumber);
        
        res.json({ 
            message: 'Invoice created successfully', 
            invoice: {
                id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                residentId: invoice.residentId,
                billId: invoice.billId,
                paymentId: invoice.paymentId,
                totalAmount: invoice.totalAmount
            }
        });
        
    } catch (error) {
        console.error('Error creating test invoice:', error);
        res.status(500).json({ 
            message: 'Error creating invoice', 
            error: error.message 
        });
    }
});

// Test endpoint to list all data
app.get('/test-data', async (req, res) => {
    try {
        const payments = await Payment.find({});
        const bills = await Billing.find({});
        const invoices = await Invoice.find({});
        
        res.json({
            payments: payments.map(p => ({
                id: p._id,
                stripePaymentId: p.stripePaymentId,
                amount: p.amount,
                status: p.status,
                billId: p.billId
            })),
            bills: bills.map(b => ({
                id: b._id,
                residentId: b.residentId,
                totalAmount: b.totalAmount,
                status: b.status
            })),
            invoices: invoices.map(i => ({
                id: i._id,
                invoiceNumber: i.invoiceNumber,
                residentId: i.residentId,
                billId: i.billId,
                paymentId: i.paymentId,
                totalAmount: i.totalAmount
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5001;
app.listen(PORT, async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hostel-management');
        console.log(`Test server running on port ${PORT}`);
        console.log('Database URL:', process.env.MONGO_URI || 'mongodb://localhost:27017/hostel-management');
        console.log('Test endpoints:');
        console.log('- GET  http://localhost:5001/test-data');
        console.log('- POST http://localhost:5001/test-create-payment');
        console.log('- POST http://localhost:5001/test-create-invoice');
    } catch (error) {
        console.error('Database connection error:', error);
    }
});
