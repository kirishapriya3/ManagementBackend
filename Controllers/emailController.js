import { sendEmail } from "../Config/brevoConfig.js";
import User from "../Models/User.js";

export const sendBillingReminder = async (req, res) => {
  try {

    const { userId, message } = req.body;

    const user = await User.findById(userId);

    const email = {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "Hostel Management"
      },

      to: [
        {
          email: user.email,
          name: user.name
        }
      ],

      subject: "Hostel Billing Reminder",

      htmlContent: `
        <h2>Billing Reminder</h2>
        <p>${message}</p>
      `
    };

    await sendEmail(email);

    res.status(200).json({
      message: "Email sent successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: "Email sending failed",
      error
    });

  }
};

export const sendMaintenanceUpdate = async (req, res) => {

  try {

    const { userId, issue, status } = req.body;

    const user = await User.findById(userId);

    const email = {

      sender: {
        name: "Hostel Management",
        email: process.env.BREVO_SENDER_EMAIL
      },

      to: [
        {
          email: user.email,
          name: user.name
        }
      ],

      subject: "Maintenance Request Update",

      htmlContent: `
        <h2>Maintenance Request Update</h2>
        <p>Hello ${user.name},</p>
        <p>Your maintenance request for <b>${issue}</b> has been updated.</p>
        <p>Status: <b>${status}</b></p>
      `
    };

    await apiInstance.sendTransacEmail(email);

    res.status(200).json({
      message: "Maintenance update email sent"
    });

  } catch (error) {

    res.status(500).json({
      message: "Error sending maintenance email",
      error
    });

  }
};

export const sendRoomAllocationEmail = async (req, res) => {

  try {

    const { userId, roomNumber } = req.body;

    const user = await User.findById(userId);

    const email = {

      sender: {
        name: "Hostel Management",
        email: process.env.BREVO_SENDER_EMAIL
      },

      to: [
        {
          email: user.email,
          name: user.name
        }
      ],

      subject: "Room Allocation Confirmation",

      htmlContent: `
        <h2>Room Allocation</h2>
        <p>Hello ${user.name},</p>
        <p>You have been allocated <b>Room ${roomNumber}</b>.</p>
        <p>Welcome to the hostel!</p>
      `
    };

    await apiInstance.sendTransacEmail(email);

    res.status(200).json({
      message: "Room allocation email sent"
    });

  } catch (error) {

    res.status(500).json({
      message: "Error sending room email",
      error
    });

  }
};

