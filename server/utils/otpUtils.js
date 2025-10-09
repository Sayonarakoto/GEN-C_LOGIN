// server/utils/otpUtils.js

/**
 * Generates a random 3-digit number (100-999).
 * @returns {string} The generated 3-digit OTP as a string.
 */
exports.generateThreeDigitOTP = () => {
  return String(Math.floor(100 + Math.random() * 900));
};
