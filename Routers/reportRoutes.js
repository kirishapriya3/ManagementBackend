import express from "express";

import {
getRevenueReport,
getOccupancyReport,
getFinancialReport
} from "../Controllers/reportController.js";

import {verifyToken,adminOnly} from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.get("/revenue",verifyToken,adminOnly,getRevenueReport);

router.get("/occupancy",verifyToken,adminOnly,getOccupancyReport);

router.get("/financial",verifyToken,adminOnly,getFinancialReport);

export default router;