import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

export const sendEmail = async (emailData) => {
  try {
    const response = await axios.post(
      BREVO_API,
      emailData,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;

  } catch (error) {
    console.log("Brevo Email Error:", error.response?.data || error.message);
    throw error;
  }
};