import express from "express";

import {
  sendBillingReminder,
  sendMaintenanceUpdate,
  sendRoomAllocationEmail
} from "../Controllers/emailController.js";

import { verifyToken, adminOnly, adminOrStaff } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/billing", verifyToken, adminOrStaff, sendBillingReminder);

router.post("/maintenance", verifyToken, adminOnly, sendMaintenanceUpdate);

router.post("/room", verifyToken, adminOnly, sendRoomAllocationEmail);

export default router;