import Stripe from "stripe";
import Payment from "../Models/Payment.js";
import Billing from "../Models/Billing.js";
import { createInvoice } from "./invoiceController.js";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async(req,res) => {
    try {
        const {billId} = req.body;

        const bill = await Billing.findById(billId);

        if(!bill){
            return res.status(404).json({
                message:"Bill not found"
            });
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: bill.totalAmount * 100, // Convert to cents
            currency: "inr",
            payment_method_types: ['card'],
            metadata: {
                billId: bill._id.toString(),
                residentId: bill.residentId.toString()
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error("Stripe Payment Intent Error:", error);
        res.status(500).json({
            message:"Payment creation failed",
            error: error.message
        });
    }
};

export const confirmPayment = async(req,res) => {
    try {
        const {paymentIntentId, billId} = req.body;

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if(paymentIntent.status !== "succeeded"){
            return res.status(400).json({
                message:"Payment not successful"
            });
        }

        // Create payment record
        const payment = new Payment({
            residentId: paymentIntent.metadata.residentId,
            billId,
            amount: paymentIntent.amount / 100,
            stripePaymentId: paymentIntent.id,
            status:"success",
            paymentMethod: "card"
        });

        await payment.save();

        // Update bill status
        const bill = await Billing.findById(billId);
        bill.paymentHistory.push({
            paymentDate: new Date(),
            amount: paymentIntent.amount / 100,
            paymentMethod: 'card',
            transactionId: paymentIntent.id,
            status: 'success'
        });
        
        bill.paidAmount += paymentIntent.amount / 100;
        
        if (bill.paidAmount >= bill.totalAmount) {
            bill.status = 'paid';
        } else if (bill.paidAmount > 0) {
            bill.status = 'partial';
        }

        await bill.save();

        // Create invoice after successful payment
        try {
            const invoice = await createInvoice({
                paymentIntentId: paymentIntent.id,
                billId: billId,
                amount: paymentIntent.amount / 100
            });
            
            console.log('Invoice created successfully:', invoice.invoiceNumber);
            
            res.status(200).json({
                message:"Payment successful",
                payment,
                bill,
                invoice: {
                    id: invoice._id,
                    invoiceNumber: invoice.invoiceNumber,
                    downloadUrl: `/api/invoices/${invoice._id}/download`
                }
            });
            
        } catch (invoiceError) {
            console.error('Error creating invoice:', invoiceError);
            // Still return payment success even if invoice creation fails
            res.status(200).json({
                message:"Payment successful (invoice generation failed)",
                payment,
                bill,
                invoiceError: invoiceError.message
            });
        }

    } catch (error) {
        console.error("Payment Confirmation Error:", error);
        res.status(500).json({
            message:"Payment verification failed",
            error: error.message
        });
    }
};

export const createTestCheckoutSession = async(req,res) => {
    try {
        // Create a test checkout session without requiring a real bill
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: 'Test Hostel Bill',
                        description: 'March 2026 - Room 301 - Test Payment',
                    },
                    unit_amount: 9500, // ₹95.00 test amount
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
            metadata: {
                test: 'true',
                billId: 'test-bill-id',
                residentId: 'test-resident-id'
            },
            customer_email: 'test@example.com'
        });

        res.status(200).json({
            sessionId: session.id,
            url: session.url,
            test: true
        });

    } catch (error) {
        console.error("Test Checkout Session Error:", error);
        res.status(500).json({
            message:"Test checkout session creation failed",
            error: error.message
        });
    }
};

export const createCheckoutSession = async(req,res) => {
    try {
        const {billId} = req.body;

        const bill = await Billing.findById(billId).populate('residentId');

        if(!bill){
            return res.status(404).json({
                message:"Bill not found"
            });
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: `Hostel Bill - ${bill.billingPeriod.month} ${bill.billingPeriod.year}`,
                        description: `Room: ${bill.roomId?.roomNumber || 'N/A'} | Resident: ${bill.residentId?.name || 'N/A'}`,
                    },
                    unit_amount: bill.totalAmount * 100, // Convert to cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`,
            metadata: {
                billId: bill._id.toString(),
                residentId: bill.residentId.toString()
            },
            customer_email: bill.residentId?.email
        });

        res.status(200).json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error("Checkout Session Error:", error);
        res.status(500).json({
            message:"Checkout session creation failed",
            error: error.message
        });
    }
};

export const handleWebhook = async(req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleSuccessfulPayment(session);
            break;
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            await handleSuccessfulPaymentIntent(paymentIntent);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
};

const handleSuccessfulPayment = async(session) => {
    try {
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
                console.error('Error parsing residentId in webhook:', error);
                return;
            }
        }

        console.log(`Processing successful payment for bill ${billId}, resident: ${residentId}`);

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
        try {
            const invoice = await createInvoice({
                paymentIntentId: session.payment_intent,
                billId: billId,
                amount: session.amount_total / 100
            });
            
            console.log('Invoice created successfully:', invoice.invoiceNumber);
            
        } catch (invoiceError) {
            console.error('Error creating invoice in webhook:', invoiceError);
        }

        console.log(`Payment and invoice processed for bill ${billId}`);
    } catch (error) {
        console.error("Error handling successful payment:", error);
    }
};

const handleSuccessfulPaymentIntent = async(paymentIntent) => {
    try {
        const billId = paymentIntent.metadata.billId;
        const residentId = paymentIntent.metadata.residentId;

        console.log(`Processing successful payment intent for bill ${billId}`);

        // Create payment record
        const payment = new Payment({
            residentId,
            billId,
            amount: paymentIntent.amount / 100,
            stripePaymentId: paymentIntent.id,
            status: "success",
            paymentMethod: "card"
        });

        await payment.save();

        // Update bill status
        const bill = await Billing.findById(billId);
        bill.paymentHistory.push({
            paymentDate: new Date(),
            amount: paymentIntent.amount / 100,
            paymentMethod: 'card',
            transactionId: paymentIntent.id,
            status: 'success'
        });
        
        bill.paidAmount += paymentIntent.amount / 100;
        
        if (bill.paidAmount >= bill.totalAmount) {
            bill.status = 'paid';
        } else if (bill.paidAmount > 0) {
            bill.status = 'partial';
        }

        await bill.save();

        // Create invoice after successful payment
        try {
            const invoice = await createInvoice({
                paymentIntentId: paymentIntent.id,
                billId: billId,
                amount: paymentIntent.amount / 100
            });
            
            console.log('Invoice created successfully:', invoice.invoiceNumber);
            
        } catch (invoiceError) {
            console.error('Error creating invoice in webhook:', invoiceError);
        }

        console.log(`Payment intent and invoice processed for bill ${billId}`);
    } catch (error) {
        console.error("Error handling successful payment intent:", error);
    }
};

export const getPaymentHistory = async(req,res) => {
    try {
        const payments = await Payment.find({
            residentId:req.user.userId
        }).populate("billId");

        res.status(200).json(payments);

    } catch (error) {
        console.error("Payment History Error:", error);
        res.status(500).json({
            message:"Error fetching payments",
            error: error.message
        });
    }
};