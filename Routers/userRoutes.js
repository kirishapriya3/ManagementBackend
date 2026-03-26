import express from "express";
import { getMyDetails, updateMyDetails } from "../Controllers/userController.js";
import { verifyToken } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.put("/update", verifyToken, updateMyDetails);
router.get("/me", verifyToken, getMyDetails);

export default router;