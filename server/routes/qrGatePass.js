const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireSecurity } = require('../middleware/securityAuthorization');
const qrGatePassController = require('../controllers/qrGatePassController');

// Route for security to verify a gate pass with OTP
router.post('/verify-otp', requireAuth, requireSecurity, qrGatePassController.verifyGatePassWithOtp);

module.exports = router;