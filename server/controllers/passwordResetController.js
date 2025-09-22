const crypto = require('crypto');
// const nodemailer = require('nodemailer'); // Removed: Using mailer.js
const bcrypt = require('bcrypt'); // For hashing new passwords
const Student = require('../models/student'); // Our Student model
const Faculty = require('../models/Faculty'); // Import Faculty model
const Security = require('../models/security'); // Import Security model
const { sendResetEmail } = require('../utils/mailer'); // Import sendResetEmail

// Configure Nodemailer (removed from here, now in mailer.js)
// const transporter = nodemailer.createTransport({
//   service: 'Gmail', // e.g., 'Gmail', 'Outlook', 'SendGrid'
//   auth: {
//     user: process.env.EMAIL_USER, // Your email address
//     pass: process.env.EMAIL_PASS, // Your email password or app-specific password
//   },
// });

// @route   POST /api/forgot-password
// @desc    Request a password reset link
// @access  Public
const forgotPassword = async (req, res) => {
  console.log('Forgot password request received.'); // Added log
  try {
    const { email } = req.body;

    let user = await Student.findOne({ email });
    if (!user) {
      user = await Faculty.findOne({ email });
    }
    if (!user) {
      user = await Security.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ message: 'User with that email does not exist.' }); // Changed message
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = Date.now() + 3600000; // 1 hour

    // Update user with reset token and expiration
    user.resetPasswordToken = passwordResetToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save(); // Use user.save()

    // Create reset URL
    const resetURL = `${process.env.FRONTEND_URL}/GEN-C_LOGIN/reset-password/${resetToken}`;
    console.log('Generated reset URL:', resetURL);

    // Send email using the mailer utility
    await sendResetEmail(user.email, resetURL); // Use user.email

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// @route   POST /api/reset-password/:token
// @desc    Reset password using the token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

    let user = await Student.findOne({
      resetPasswordToken: passwordResetToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      user = await Faculty.findOne({
        resetPasswordToken: passwordResetToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
    }
    if (!user) {
      user = await Security.findOne({
        resetPasswordToken: passwordResetToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and clear reset token fields
    user.password = hashedPassword; // Update the hashed password field
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save(); // Use user.save()

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

module.exports = { forgotPassword, resetPassword };