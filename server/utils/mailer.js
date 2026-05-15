const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendResetEmail(to, resetUrl) {
  let htmlContent;
  try {
    const templatePath = path.join(__dirname, '..', 'views', 'resetPasswordEmail.html');
    htmlContent = await fs.readFile(templatePath, 'utf8');
    htmlContent = htmlContent.replace('{{resetUrl}}', resetUrl);
  } catch (error) {
    console.error("❌ Error reading or processing email template:", error);
    htmlContent = `
      <p>Hello,</p>
      <p>You requested to reset your Paperless Campus account password.</p>
      <p>Please click the following link to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link is valid for 1 hour.</p>
      <p>If you didn’t request this, please ignore this email or contact support.</p>
    `;
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject: "Password Reset Request - Paperless Campus",
    html: htmlContent,
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
