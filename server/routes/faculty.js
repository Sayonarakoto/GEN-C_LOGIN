const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController'); // Import getDepartmentMembers
const { requireAuth, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Config for Profile Pictures ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/profile-pictures');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, 'faculty-' + Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image file.'), false);
    }
};

const profileUpload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

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

// New route for faculty profile picture upload
router.post('/upload-profile-picture', requireAuth, requireRole(['faculty', 'HOD']), profileUpload.single('profileImage'), facultyController.uploadProfilePicture);

module.exports = router;