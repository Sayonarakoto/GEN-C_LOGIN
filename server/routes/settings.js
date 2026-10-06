const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// @route   GET /api/settings
// @desc    Get current application time settings
// @access  Private (any authenticated user)
router.get('/', requireAuth, settingsController.getSettings);

// @route   PUT /api/settings
// @desc    Update application time settings
// @access  Private (HOD)
router.put('/', requireAuth, requireRole('HOD'), settingsController.updateSettings);

// @route   POST /api/settings/reset
// @desc    Reset settings to env-var defaults
// @access  Private (HOD)
router.post('/reset', requireAuth, requireRole('HOD'), settingsController.resetSettings);

module.exports = router;
