import express from "express";
import {loginUser, register, getAllResidents, getResidentById} from "../Controllers/authController.js";
import { verifyToken, adminOnly } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", loginUser);

// Admin-only resident management routes
router.get("/residents", verifyToken, adminOnly, getAllResidents);
router.get("/resident/:id", verifyToken, adminOnly, getResidentById);

export default router;


