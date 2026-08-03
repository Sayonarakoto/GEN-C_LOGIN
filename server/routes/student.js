const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const studentController = require('../Genc.BL/controllers/studentController');

// Standard Generic CRUD routes from BaseController
router.get('/', requireAuth, requireRole(['faculty', 'HOD', 'hod', 'admin']), studentController.list);
router.get('/detail/:id', requireAuth, studentController.getById);

// Feature Specific Student Routes
router.post("/StudentForm", requireAuth, requireRole(['faculty', 'HOD']), studentController.addStudent);
router.post('/upload-profile-picture', requireAuth, upload, studentController.uploadProfilePicture);
router.put('/profile', requireAuth, studentController.updateStudentProfile);
router.get('/:studentId/activity-report', requireAuth, studentController.getStudentActivityReport);
router.get('/:studentId/activity-report/download-pdf', requireAuth, requireRole(['faculty', 'hod']), studentController.downloadStudentActivityReportPDF);

module.exports = router;