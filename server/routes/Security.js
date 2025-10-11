const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

// Middleware to disable caching for this route
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

// @route   GET /api/security/logs
// @desc    Get all successful verification logs for the security dashboard
// @access  Private (Security)
router.get(
  '/logs',
  requireAuth,
  requireRole('security'),
  noCache, // Add the noCache middleware here
  auditController.getSecurityVerificationLogs
);

module.exports = router;