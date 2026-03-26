import express from "express";
import {
    createInvoice,
    getResidentInvoices,
    getInvoice,
    downloadInvoice
} from "../Controllers/invoiceController.js";
import { verifyToken, residentOnly } from "../Middlewares/authMiddleware.js";

const router = express.Router();

// Get all resident invoices
router.get("/", verifyToken, residentOnly, getResidentInvoices);

// Get single invoice
router.get("/:id", verifyToken, residentOnly, getInvoice);

// Download invoice PDF
router.get("/:id/download", verifyToken, residentOnly, downloadInvoice);

export default router;
