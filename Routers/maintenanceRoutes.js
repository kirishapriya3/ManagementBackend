import express from "express";
import { createRequest, getAllRequests, getMyRequests, updateRequest } from "../Controllers/maintenanceController.js";
import { residentOnly, verifyToken } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", verifyToken,residentOnly, createRequest);
router.get("/my-requests", verifyToken, residentOnly, getMyRequests);
router.get("/", verifyToken, getAllRequests);
router.put("/:id", verifyToken, updateRequest);

export default router;
