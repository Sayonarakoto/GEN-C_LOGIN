const express = require('express');
const router = express.Router();
const { getDashboardStats, getDistinctDepartments, getFacultyByDepartment, getHODByDepartment, getAllFaculty, getDepartmentMembers } = require('../controllers/facultyController'); // Import getDepartmentMembers
const { requireAuth, requireRole } = require('../middleware/auth');

// Route to get dashboard stats
router.get('/stats', requireAuth, requireRole(['faculty', 'HOD']), getDashboardStats);

// Route to get distinct departments for faculty
router.get('/departments/distinct', requireAuth, requireRole('faculty'), getDistinctDepartments);

// Route to get faculty by department
router.get('/by-department/:department', requireAuth, getFacultyByDepartment);

// New route to get HOD by department
router.get('/hod/by-department/:department', requireAuth, getHODByDepartment);

// Route to get all faculty
router.get('/all', requireAuth, getAllFaculty);

// Route to get all faculty members (including HODs) in the current user's department
router.get('/department-members', requireAuth, requireRole(['faculty', 'HOD']), getDepartmentMembers);

module.exports = router;