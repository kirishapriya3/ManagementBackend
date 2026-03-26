import express from "express";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.get("/test-email", async (req, res) => {
    await sendEmail({
        to: "projecttt1114@gmail.com",
        subject: "Test Email from Hostel App",
        text: "Your system is working 🚀",
        html: "<h2>Hostel Management Email Working ✅</h2>",
    });

    res.send("Email sent!");
});

export default router;