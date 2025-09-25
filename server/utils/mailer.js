const nodemailer = require("nodemailer");
const { SMTP_USER, SMTP_PASS, FROM_EMAIL } = process.env;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

async function sendResetEmail(to, resetUrl) {
  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject: "Password Reset Request - Paperless Campus",
    html: `
      <p>Hello,</p>
      <p>You requested to reset your Paperless Campus account password.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn’t request this, ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Reset email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending reset email:", error);
    throw new Error("Failed to send reset email.");
  }
}

module.exports = { sendResetEmail };
