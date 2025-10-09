const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

// @route   GET /api/security/logs
// @desc    Get all successful verification logs for the security dashboard
// @access  Private (Security)
router.get(
  '/logs',
  requireAuth,
  requireRole('security'),
  auditController.getSecurityVerificationLogs
);

module.exports = router;