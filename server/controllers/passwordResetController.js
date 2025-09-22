const crypto = require('crypto');
// const nodemailer = require('nodemailer'); // Removed: Using mailer.js
const bcrypt = require('bcrypt'); // For hashing new passwords
const Student = require('../models/student'); // Our Student model
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
  try {
    const { email } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: 'Student with that email does not exist.' });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = Date.now() + 3600000; // 1 hour

    // Update student with reset token and expiration
    student.passwordResetToken = passwordResetToken;
    student.passwordResetExpires = passwordResetExpires;
    await student.save();

    // Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // Send email using the mailer utility
    await sendResetEmail(student.email, resetURL);

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

    const student = await Student.findOne({
      passwordResetToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!student) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update student's password and clear reset token fields
    student.passwordHash = hashedPassword; // Update the hashed password field
    student.tempPassword = undefined; // Clear the temporary password
    student.passwordResetToken = undefined;
    student.passwordResetExpires = undefined;
    await student.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

module.exports = { forgotPassword, resetPassword };