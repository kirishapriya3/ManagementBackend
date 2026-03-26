import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

// Configure API key
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Send email function
const sendEmail = async ({ to, subject, text, html }) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    try {
        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL,
                name: process.env.BREVO_SENDER_NAME,
            },
            to: [{ email: to }],
            subject: subject,
            textContent: text,
            htmlContent: html,
        });

        console.log("✅ Email sent:", response.messageId);
    } catch (error) {
        console.error("❌ Email error:", error.message);
    }
};

export { sendEmail };