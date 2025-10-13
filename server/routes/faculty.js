const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController'); // Import getDepartmentMembers
const { requireAuth, requireRole } = require('../middleware/auth');



// Route to get distinct departments for faculty
router.get('/departments/distinct', requireAuth, requireRole('faculty'), facultyController.getDistinctDepartments);

// Route to get faculty by department
router.get('/by-department/:department', requireAuth, facultyController.getFacultyByDepartment);

// New route to get HOD by department
router.get('/hod/by-department/:department', requireAuth, facultyController.getHODByDepartment);

// Route to get all faculty
router.get('/all', requireAuth, facultyController.getAllFaculty);

// Route to get all faculty members (including HODs) in the current user's department
router.get('/department-members', requireAuth, requireRole(['faculty', 'HOD']), facultyController.getDepartmentMembers);

// Route to get students by department with search and pagination
router.get('/students', requireAuth, requireRole(['faculty', 'HOD']), facultyController.getStudentsByDepartment);

router.put('/profile', requireAuth, requireRole(['faculty', 'HOD']), facultyController.updateFacultyProfile);

module.exports = router;