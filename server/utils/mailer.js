const fs = require('fs').promises; // Import fs.promises for async file reading
const path = require('path'); // Import path for resolving file paths

// ... (rest of the existing code)

async function sendResetEmail(to, resetUrl) {
  let htmlContent;
  try {
    // Read the HTML template file asynchronously
    const templatePath = path.join(__dirname, '..', 'views', 'resetPasswordEmail.html');
    htmlContent = await fs.readFile(templatePath, 'utf8');
    // Replace the placeholder with the actual reset URL
    htmlContent = htmlContent.replace('{{resetUrl}}', resetUrl);
  } catch (error) {
    console.error("❌ Error reading or processing email template:", error);
    // Fallback to a plain text version or throw an error if template is critical
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
    from: FROM_EMAIL,
    to,
    subject: "Password Reset Request - Paperless Campus",
    html: htmlContent, // Use the read and processed HTML content
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
