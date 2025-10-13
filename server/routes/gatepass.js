const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const verifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: 'Too many verification attempts, please try again later.'
});
const {
  getActiveGatePass,
  requestGatePass,
  getPendingGatePasses,
  getGatePassHistory,
  facultyApproveGatePass,
  facultyRejectGatePass,
  logLateReturn,
  getFacultyGatePassStats,
  getStudentGatePassHistory,
  downloadGatePassPDF,
  verifyGatePassByOTP, // NEW: Import verifyGatePassByOTP
  verifyGatePassByQR, // NEW: Import verifyGatePassByQR
} = require('../controllers/gatepassController');
const { requireAuth, requireRole } = require('../middleware/auth');

// --- Student Routes ---

// @route   GET /api/gatepass/student/active
// @desc    Get active gate pass for a student
// @access  Private (Student)
router.get('/student/active', requireAuth, getActiveGatePass);

// @route   POST /api/gatepass/student/request
// @desc    Request a new gate pass
// @access  Private (Student)
router.post('/student/request', requireAuth, requestGatePass);

// @route   GET /api/gatepass/student/history
// @desc    Get gate pass history for a student
// @access  Private (Student)
router.get('/student/history', requireAuth, getStudentGatePassHistory);

// @route   GET /api/gatepass/download-pdf/:id
// @desc    Download a gate pass PDF
// @access  Private (Student, HOD, Security)
router.get('/download-pdf/:id', requireAuth, downloadGatePassPDF);

// --- Faculty Routes ---

// @route   GET /api/gatepass/faculty/pending
// @desc    Get pending gate passes for a faculty member
// @access  Private (Faculty, HOD)
router.get('/faculty/pending', requireAuth, requireRole(['faculty', 'HOD']), getPendingGatePasses);

// @route   GET /api/gatepass/faculty/history
// @desc    Get gate pass history for a faculty member
// @access  Private (Faculty)
router.get('/faculty/history', requireAuth, requireRole(['faculty', 'HOD']), getGatePassHistory);

// @route   PUT /api/gatepass/faculty/approve/:id
// @desc    Faculty approves a gate pass and forwards to HOD
// @access  Private (Faculty)
router.put('/faculty/approve/:id', requireAuth, requireRole('faculty'), facultyApproveGatePass);

// @route   PUT /api/gatepass/faculty/reject/:id
// @desc    Faculty rejects a gate pass
// @access  Private (Faculty)
router.put('/faculty/reject/:id', requireAuth, requireRole('faculty'), facultyRejectGatePass);

// @route   GET /api/gatepass/faculty/stats
// @desc    Get gate pass statistics for a faculty member
// @access  Private (Faculty)
router.get('/faculty/stats', requireAuth, requireRole('faculty'), getFacultyGatePassStats);

// --- Security Routes ---

// @route   POST /api/gatepass/log-late-return
// @desc    Log a late return for a gate pass
// @access  Private (Security)
router.post('/log-late-return', requireAuth, requireRole('Security'), logLateReturn);

// @route   POST /api/gatepass/verify-otp
// @desc    Verify a gate pass using Student ID and OTP
// @access  Private (Security)
router.post('/verify-otp', requireAuth, requireRole('Security'), verifyGatePassByOTP);

// @route   POST /api/gatepass/verify-qr
// @desc    Verify a gate pass using QR Code
// @access  Private (Security)
router.post('/verify-qr', verifyLimiter, requireAuth, requireRole('Security'), verifyGatePassByQR);

module.exports = router;