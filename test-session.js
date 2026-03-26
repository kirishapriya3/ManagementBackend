import Stripe from "stripe";
import dotenv from "dotenv";
import { handlePaymentSuccess } from "./Controllers/paymentSuccessController.js";
import Payment from "./Models/Payment.js";
import Billing from "./Models/Billing.js";
import Invoice from "./Models/Invoice.js";
import mongoose from "mongoose";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const testSession = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hostel-management');
        console.log('✅ Connected to database');

        const sessionId = 'cs_test_a1itEImD7A97v227igbum0PQVIHdfTEiQ2netedJmO6sRHzNtNmesYYRWA';
        
        console.log('\n=== Testing Session:', sessionId, '===');

        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        console.log('Session found:');
        console.log('- Payment Status:', session.payment_status);
        console.log('- Payment Intent:', session.payment_intent);
        console.log('- Amount:', session.amount_total / 100);
        console.log('- Metadata:', session.metadata);

        if (session.payment_status !== 'paid') {
            console.log('❌ Payment not completed');
            return;
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({ 
            stripePaymentId: session.payment_intent 
        });

        if (existingPayment) {
            console.log('✅ Payment already exists');
            const existingInvoice = await Invoice.findOne({ paymentId: existingPayment._id });
            if (existingInvoice) {
                console.log('✅ Invoice already exists:', existingInvoice.invoiceNumber);
            } else {
                console.log('❌ Payment exists but no invoice found');
            }
            return;
        }

        // Simulate the payment success process
        console.log('\n=== Simulating Payment Success ===');
        
        const billId = session.metadata.billId;
        let residentId = session.metadata.residentId;

        // Parse residentId if it's a string representation of an object
        if (typeof residentId === 'string' && residentId.includes('_id')) {
            try {
                // Handle the special case where residentId contains new ObjectId()
                if (residentId.includes('new ObjectId(')) {
                    // Extract the ObjectId from the string
                    const objectIdMatch = residentId.match(/new ObjectId\('([^']+)'\)/);
                    if (objectIdMatch) {
                        residentId = objectIdMatch[1];
                        console.log('✅ Extracted residentId from ObjectId:', residentId);
                    }
                } else {
                    // Try regular JSON parsing
                    const parsedResident = JSON.parse(residentId);
                    residentId = parsedResident._id;
                    console.log('✅ Parsed residentId:', residentId);
                }
            } catch (error) {
                console.error('❌ Error parsing residentId:', error);
                return;
            }
        }

        // Create payment record
        const payment = new Payment({
            residentId,
            billId,
            amount: session.amount_total / 100,
            stripePaymentId: session.payment_intent,
            status: "success",
            paymentMethod: "card"
        });

        await payment.save();
        console.log('✅ Payment created successfully');

        // Update bill status
        const bill = await Billing.findById(billId);
        if (bill) {
            bill.paymentHistory.push({
                paymentDate: new Date(),
                amount: session.amount_total / 100,
                paymentMethod: 'card',
                transactionId: session.payment_intent,
                status: 'success'
            });
            
            bill.paidAmount += session.amount_total / 100;
            
            if (bill.paidAmount >= bill.totalAmount) {
                bill.status = 'paid';
            } else if (bill.paidAmount > 0) {
                bill.status = 'partial';
            }

            await bill.save();
            console.log('✅ Bill updated successfully');
        }

        // Create invoice
        try {
            const { createInvoice } = await import('./Controllers/invoiceController.js');
            
            const invoice = await createInvoice({
                paymentIntentId: session.payment_intent,
                billId: billId,
                amount: session.amount_total / 100
            });
            
            console.log('✅ Invoice created successfully:', invoice.invoiceNumber);
            
        } catch (invoiceError) {
            console.error('❌ Error creating invoice:', invoiceError.message);
        }

        console.log('\n=== Final Check ===');
        const finalPayments = await Payment.find({ stripePaymentId: session.payment_intent });
        const finalInvoices = await Invoice.find({ paymentId: finalPayments[0]?._id });
        
        console.log('Payments found:', finalPayments.length);
        console.log('Invoices found:', finalInvoices.length);
        
        if (finalInvoices.length > 0) {
            console.log('🎉 SUCCESS! Invoice should now be available in frontend');
            console.log('Invoice Number:', finalInvoices[0].invoiceNumber);
            console.log('Check frontend Invoices tab to see the invoice');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

testSession();
