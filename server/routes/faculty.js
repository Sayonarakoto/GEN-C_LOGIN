const express = require('express');
const router = express.Router();
const { getDashboardStats, getDistinctDepartments, getFacultyByDepartment, getHODByDepartment } = require('../controllers/facultyController'); // Import getDistinctDepartments and getHODByDepartment
const { requireAuth, requireRole } = require('../middleware/auth');

// Route to get dashboard stats
router.get('/stats', requireAuth, requireRole('faculty'), getDashboardStats);

// Route to get distinct departments for faculty
router.get('/departments/distinct', requireAuth, requireRole('faculty'), getDistinctDepartments); // New route

// Route to get faculty by department
router.get('/by-department/:department', requireAuth, getFacultyByDepartment);

// New route to get HOD by department
router.get('/hod/by-department/:department', requireAuth, getHODByDepartment);

module.exports = router;