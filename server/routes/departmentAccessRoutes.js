const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const departmentAccessController = require('../Genc.BL/controllers/departmentAccessController');

router.get('/submissions', requireAuth, requireRole(['faculty', 'HOD', 'hod', 'admin']), departmentAccessController.getDepartmentSubmissions);

module.exports = router;
