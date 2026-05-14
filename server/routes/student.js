const express = require("express");
const router = express.Router();
const Student = require("../models/student");
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const studentController = require('../controllers/studentController');

// Add student (by faculty)
router.post("/StudentForm", requireAuth, requireRole(['faculty', 'HOD']), studentController.addStudent);

router.post('/upload-profile-picture', requireAuth, upload, studentController.uploadProfilePicture);

router.put('/profile', requireAuth, studentController.updateStudentProfile);

router.get('/:studentId/activity-report', requireAuth, studentController.getStudentActivityReport);
router.get('/:studentId/activity-report/download-pdf', requireAuth, requireRole(['faculty', 'hod']), studentController.downloadStudentActivityReportPDF);


module.exports = router;