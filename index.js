import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './Config/dbConfig.js';
import authRoutes from "./Routers/authRoutes.js";
import userRoutes from "./Routers/userRoutes.js";
import residentRoutes from "./Routers/residentRoutes.js";
import roomRoutes from "./Routers/roomRoutes.js";
import maintananceRoutes from "./Routers/maintenanceRoutes.js";
import billingRoutes from "./Routers/billingRoutes.js";
import paymentRoutes from "./Routers/paymentRoutes.js";
import invoiceRoutes from "./Routers/invoiceRoutes.js";
// import reportRoutes from "./Routers/reportRoutes.js";
import testRoutes from "./Routers/testRoutes.js";
import emailRoutes from "./Routers/emailRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
//  origin: "http://localhost:5173",
origin: "*",
credentials: true
}));

app.use(express.json());

app.use("/api/auth",authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/maintenance", maintananceRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/payment",paymentRoutes);
app.use("/api/invoices", invoiceRoutes);
// app.use("/api/reports", reportRoutes);
app.use("/api", testRoutes);
app.use("/api/email", emailRoutes);

app.get("/test", (req, res) => res.json({message: "Server is working"}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
});