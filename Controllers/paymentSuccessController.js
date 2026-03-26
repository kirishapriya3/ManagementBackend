import Stripe from "stripe";
import Payment from "../Models/Payment.js";
import Billing from "../Models/Billing.js";
import { createInvoice } from "./invoiceController.js";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handlePaymentSuccess = async (req, res) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({ message: "Session ID is required" });
        }

        console.log('Handling payment success for session:', session_id);

        // Retrieve the checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({ message: "Payment not completed" });
        }

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
                    }
                } else {
                    // Try regular JSON parsing
                    const parsedResident = JSON.parse(residentId);
                    residentId = parsedResident._id;
                }
            } catch (error) {
                console.error('Error parsing residentId:', error);
                return res.status(400).json({ message: "Invalid residentId format" });
            }
        }

        console.log('Parsed residentId:', residentId);

        if (!billId || !residentId) {
            return res.status(400).json({ message: "Invalid session metadata" });
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({ 
            stripePaymentId: session.payment_intent 
        });

        if (existingPayment) {
            console.log('Payment already processed, returning existing invoice');
            
            // Get existing invoice
            const Invoice = (await import("../Models/Invoice.js")).default;
            const existingInvoice = await Invoice.findOne({ paymentId: existingPayment._id });
            
            return res.status(200).json({
                message: "Payment already processed",
                payment: existingPayment,
                invoice: existingInvoice ? {
                    id: existingInvoice._id,
                    invoiceNumber: existingInvoice.invoiceNumber,
                    downloadUrl: `/api/invoices/${existingInvoice._id}/download`
                } : null
            });
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

        // Update bill status
        const bill = await Billing.findById(billId);
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

        // Create invoice after successful payment
        let invoice = null;
        try {
            console.log('Attempting to create invoice...');
            invoice = await createInvoice({
                paymentIntentId: session.payment_intent,
                billId: billId,
                amount: session.amount_total / 100
            });
            
            console.log('Invoice created successfully:', invoice.invoiceNumber);
            
        } catch (invoiceError) {
            console.error('Error creating invoice:', invoiceError);
            console.error('Invoice error details:', invoiceError.message);
            // Don't throw here, just continue without invoice
        }

        res.status(200).json({
            message: "Payment successful",
            payment,
            bill,
            invoice: invoice ? {
                id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                downloadUrl: `/api/invoices/${invoice._id}/download`
            } : null
        });

    } catch (error) {
        console.error("Payment Success Error:", error);
        res.status(500).json({
            message: "Error processing payment success",
            error: error.message
        });
    }
};
