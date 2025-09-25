const express = require('express');
const router = express.Router();
const { getDashboardStats, getDistinctDepartments } = require('../controllers/facultyController'); // Import getDistinctDepartments
const { requireAuth, requireRole } = require('../middleware/auth');

// Route to get dashboard stats
router.get('/stats', requireAuth, requireRole('faculty'), getDashboardStats);

// Route to get distinct departments for faculty
router.get('/departments/distinct', requireAuth, requireRole('faculty'), getDistinctDepartments); // New route

module.exports = router;