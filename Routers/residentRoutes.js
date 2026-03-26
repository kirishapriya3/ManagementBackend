import express from "express";
import { adminOnly, verifyToken, adminOrStaff } from "../Middlewares/authMiddleware.js";
import { createResident, deleteResident, getResidentById, getResidents, updateResident, getAvailableResidents, assignResidentToRoom, unassignResidentFromRoom } from "../Controllers/residentController.js";
import User from "../Models/User.js";

const router = express.Router();

router.post("/", verifyToken, adminOnly, createResident);
router.get("/available", verifyToken, adminOrStaff, getAvailableResidents);
router.post("/assign", verifyToken, adminOrStaff, assignResidentToRoom);
router.post("/unassign", verifyToken, adminOrStaff, unassignResidentFromRoom);
router.get("/", verifyToken, adminOrStaff, getResidents);
router.get("/:id", verifyToken, adminOrStaff, getResidentById);
router.get("/me", verifyToken, async (req, res) => {
    const user = await User.findById(req.user.userId);
    res.status(200).json(user);
});
router.put("/:id", verifyToken, adminOnly, updateResident);
router.delete("/:id", verifyToken, adminOnly, deleteResident);

export default router;