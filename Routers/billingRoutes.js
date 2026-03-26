import express from "express";
import { adminOnly, residentOnly, verifyToken, adminOrStaff } from "../Middlewares/authMiddleware.js";
import { 
    createBill, 
    getAllBills, 
    getMyBills, 
    getResidentBills, 
    updateBill, 
    getCurrentBill,
    processPayment,
    getPaymentHistory,
    applyDiscount,
    addLateFee,
    getAllResidentsBillingStatus,
    getFinancialOverview
} from "../Controllers/billingController.js";
import { createPaymentIntent } from "../Controllers/paymentController.js";

const router = express.Router();

// Resident routes - MUST come before parameterized routes
router.get("/my-bills", verifyToken, residentOnly, getMyBills);
router.get("/current", verifyToken, residentOnly, getCurrentBill);
router.post("/payment", verifyToken, residentOnly, processPayment);
router.get("/payment-history", verifyToken, residentOnly, getPaymentHistory);

// Admin routes
router.post("/", verifyToken, adminOnly, createBill);
router.get("/", verifyToken, adminOnly, getAllBills);
router.get("/overview", verifyToken, adminOrStaff, getAllResidentsBillingStatus);
router.get("/financial-overview", verifyToken, adminOnly, getFinancialOverview);
router.get("/:residentId", verifyToken, adminOnly, getResidentBills);
router.put("/:id", verifyToken, adminOnly, updateBill);
router.post("/:id/discount", verifyToken, adminOnly, applyDiscount);
router.post("/:id/late-fee", verifyToken, adminOnly, addLateFee);

// Payment processing
router.post("/create-intent", verifyToken, residentOnly, createPaymentIntent);

export default router;