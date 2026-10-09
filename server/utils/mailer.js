const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

// SMTP settings come from .env (SMTP_*). Legacy EMAIL_* names still work as a fallback.
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

const FALLBACK_FROM = () =>
  process.env.DEFAULT_FROM_EMAIL || process.env.FROM_EMAIL || smtpUser || 'noreply@localhost';

const FALLBACK_TEMPLATE = ({ otp, resetUrl }) => `
  <p>Hello,</p>
  <p>You requested to reset your Paperless Campus account password.</p>
  <p>Use this code on the reset page:</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:8px;">${otp}</p>
  <p>Or click the button below:</p>
  <p><a href="${resetUrl}">Reset Password</a></p>
  <p>This code is valid for 10 minutes.</p>
  <p>If you didn't request this, please ignore this email.</p>
`;

async function buildTemplate(otp, resetUrl) {
  try {
    const templatePath = path.join(__dirname, '..', 'views', 'resetPasswordEmail.html');
    const html = await fs.readFile(templatePath, 'utf8');
    return html.replace(/\{\{otp\}\}/g, otp).replace(/\{\{resetUrl\}\}/g, resetUrl);
  } catch (error) {
    console.error('❌ Error reading reset email template, using fallback:', error.message);
    return FALLBACK_TEMPLATE({ otp, resetUrl });
  }
}

/**
 * Sends the password-reset email: the code itself plus a link to the reset page.
 * Throws on transport failure - callers decide how to surface it.
 */
async function sendResetOtpEmail(to, otp, resetUrl) {
  const html = await buildTemplate(otp, resetUrl);

  const info = await transporter.sendMail({
    from: FALLBACK_FROM(),
    to,
    subject: 'Password Reset Code - Paperless Campus',
    html,
  });

  console.log('✅ Reset email sent:', info.messageId);
  return info;
}

module.exports = { sendResetOtpEmail };
