const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/facultyController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Route to get dashboard stats
router.get('/stats', requireAuth, requireRole('faculty'), getDashboardStats);

module.exports = router;