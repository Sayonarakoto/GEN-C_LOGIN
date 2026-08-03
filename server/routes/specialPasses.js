const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireSecurity, requireSecuritySupervisor } = require('../middleware/securityAuthorization');
const { mfaCheck } = require('../middleware/mfaCheck');
const specialPassController = require('../Genc.BL/controllers/specialPassController');

/**
 * @route   POST /api/special-passes/request
 * @desc    Student requests a special pass
 * @access  Private (Student)
 */
router.post(
  '/request',
  requireAuth,
  specialPassController.createSpecialPassRequest
);

/**
 * @route   POST /api/special-passes/verify
 * @desc    Verify a student's special pass using a QR code token
 * @access  Private (Security)
 */
router.post(
  '/verify',
  requireAuth,
  requireSecurity,
  specialPassController.verifyPass
);

/**
 * @route   POST /api/special-passes/override
 * @desc    Security Supervisor issues an emergency override pass with MFA
 * @access  Private (Security Supervisor + MFA)
 */
router.post(
  '/override',
  requireAuth,
  requireSecuritySupervisor,
  mfaCheck,
  specialPassController.createOverridePass
);

/**
 * @route   GET /api/special-passes/student
 * @desc    Get all special passes for the logged-in student
 * @access  Private (Student)
 */
router.get(
  '/student',
  requireAuth,
  specialPassController.getStudentSpecialPasses
);

const { generateWatermarkedPDF } = require('../services/pdfGenerationService');
const Faculty = require('../models/Faculty');

// Route to securely download the pass PDF
router.get('/downloads/special-pass/:passId', requireAuth, async (req, res) => {
    const { passId } = req.params;
    const studentId = req.user.id;

    try {
        // 1. Find the pass and verify ownership
        const pass = await SpecialPass.findById(passId)
            .populate('student_id', 'fullName studentId department year profilePictureUrl profilePhoto')
            .populate('hod_approver_id', 'fullName');

        if (!pass || String(pass.student_id._id) !== studentId) {
            return res.status(404).json({ success: false, message: 'Pass not found or not authorized.' });
        }

        // 2. Regenerate PDF on-demand
        const hodName = pass.hod_approver_id ? pass.hod_approver_id.fullName : 'N/A';
        const pdfBytes = await generateWatermarkedPDF(pass, hodName);

        // 3. Serve the file via streaming
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=special_pass_${passId}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Error serving PDF:', error);
        res.status(500).json({ success: false, message: 'Could not generate PDF file.' });
    }
});

module.exports = router;
