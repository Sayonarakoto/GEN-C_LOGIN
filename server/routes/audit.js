const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController'); // Import the whole controller
const { requireAuth, requireRole } = require('../middleware/auth'); // Import requireRole
const { requireHOD } = require('../middleware/hodAuthorization');

// @route   GET /api/audit/logs
// @desc    Get filtered audit logs for HODs
// @access  Private (HOD)
router.get('/logs', requireAuth, requireHOD, auditController.getAuditLogs);

// @route   GET /api/audit/logs/export
// @desc    Export filtered audit logs as CSV
// @access  Private (HOD)
router.get('/logs/export', requireAuth, requireHOD, auditController.exportAuditLogs);

// @route   GET /api/audit/logs/pdf
// @desc    Export filtered audit logs as PDF
// @access  Private (HOD)
router.get('/logs/pdf', requireAuth, requireHOD, auditController.exportAuditLogsPdf);

// @route   GET /api/audit/department-logs
// @desc    Get audit logs for the current user's department
// @access  Private (Faculty, HOD)
router.get('/department-logs', requireAuth, requireRole(['faculty', 'HOD']), auditController.getDepartmentAuditLogs);

module.exports = router;