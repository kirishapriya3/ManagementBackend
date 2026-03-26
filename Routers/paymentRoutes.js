import express from "express";

import {
createPaymentIntent,
confirmPayment,
createCheckoutSession,
createTestCheckoutSession,
handleWebhook,
getPaymentHistory
} from "../Controllers/paymentController.js";
import { handlePaymentSuccess } from "../Controllers/paymentSuccessController.js";
import {verifyToken,residentOnly} from "../Middlewares/authMiddleware.js";

const router = express.Router();

// Payment intent for embedded Stripe form
router.post("/create-intent",verifyToken,residentOnly,createPaymentIntent);

// Payment confirmation
router.post("/confirm",verifyToken,residentOnly,confirmPayment);

// Checkout session for redirect to Stripe
router.post("/create-checkout-session",verifyToken,residentOnly,createCheckoutSession);

// Test checkout session (no bill required)
router.post("/test-checkout-session",verifyToken,residentOnly,createTestCheckoutSession);

// Payment success handler (for Stripe redirects)
router.get("/success", verifyToken, residentOnly, handlePaymentSuccess);

// Webhook endpoint (no auth required)
router.post("/webhook", express.raw({type: 'application/json'}), handleWebhook);

// Payment history
router.get("/history",verifyToken,residentOnly,getPaymentHistory);

export default router;