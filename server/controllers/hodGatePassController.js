// hodGatePassController.js
const GatePass = require('../models/GatePass');
const Faculty = require('../models/Faculty');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../config/jwt'); // Assuming this generates the QR token
const { generateThreeDigitOTP } = require('../utils/otpUtils');
const { sendNotification } = require('../services/notificationService');

// @desc    Get pending gate passes requiring HOD final approval
// @route   GET /api/gatepass/hod/pending
// @access  Private (HOD)
exports.getHODPendingGatePasses = async (req, res) => {
    try {
        const hodId = req.user.id;
        
        // CRUCIAL LOGIC: Find passes where Level 1 (Faculty) is done, and HOD (Level 2) is pending.
        const pendingPasses = await GatePass.find({
            hod_approver_id: hodId,
            faculty_status: 'APPROVED',
            hod_status: 'PENDING',
        })
            .populate('student_id', 'fullName studentId department')
            .populate('faculty_approver_id', 'fullName'); // To show who gave Level 1 approval

        res.status(200).json({ success: true, data: pendingPasses });
    } catch (error) {
        console.error('Error fetching HOD pending gate passes:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    HOD approves (finalizes) a gate pass and generates credentials
// @route   PUT /api/gatepass/hod/approve/:id
// @access  Private (HOD)
exports.hodApproveGatePass = async (req, res) => {
    try {
        const pass = await GatePass.findById(req.params.id).populate('student_id', 'fullName');

        if (!pass) {
            return res.status(404).json({ success: false, message: 'Gate pass not found' });
        }

        // 1. Authorization & Status Check
        if (pass.hod_status !== 'PENDING' || pass.hod_approver_id.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized or pass not awaiting HOD approval.' });
        }
        if (pass.faculty_status !== 'APPROVED') {
             return res.status(400).json({ success: false, message: 'Cannot finalize: Faculty approval is still pending or rejected.' });
        }

        // 2. Final Status Update
        pass.hod_status = 'APPROVED';
        
        // 3. CRITICAL STEP: Generate QR/OTP (Credentials)
        // Token includes Pass ID and expiration to ensure validity
        pass.qr_code_id = generateToken({ passId: pass._id.toString(), expiry: pass.date_valid_to }); 
        pass.verification_otp = generateThreeDigitOTP();

        await pass.save();

        // 4. Log and Notify
        await AuditLog.create({
            pass_id: pass._id,
            event_type: 'Final Approved',
            actor_role: 'HOD',
            actor_id: req.user.id,
            event_details: {
                status_change: 'hod_status: PENDING -> APPROVED',
                credentials_generated: true,
            },
        });

        // Notify Student
        await sendNotification(
            pass.student_id._id,
            `Your Gate Pass request has been APPROVED by the HOD. Your pass is now active.`, 
            'Gate Pass FINAL Approval'
        );

        res.status(200).json({ success: true, data: pass });
    } catch (error) {
        console.error('Error in hodApproveGatePass:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    HOD rejects a gate pass
// @route   PUT /api/gatepass/hod/reject/:id
// @access  Private (HOD)
exports.hodRejectGatePass = async (req, res) => {
    // Note: The facultyRejectGatePass should handle the termination for single-tier rejections.
    // This handles the final termination after faculty approval.
    try {
        const pass = await GatePass.findById(req.params.id).populate('student_id', 'fullName');

        if (!pass) {
            return res.status(404).json({ success: false, message: 'Gate pass not found' });
        }

        if (pass.hod_status !== 'PENDING' || pass.hod_approver_id.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized or pass not awaiting HOD rejection.' });
        }
        
        // Final Status Update & Termination
        pass.hod_status = 'REJECTED';
        // Note: No QR/OTP generated, ensure these fields are null/empty if they somehow existed

        await pass.save();

        // Log and Notify Student of Final Rejection
        await AuditLog.create({
            pass_id: pass._id,
            event_type: 'Final Rejected',
            actor_role: 'HOD',
            actor_id: req.user.id,
            event_details: {
                status_change: 'hod_status: PENDING -&gt; REJECTED',
            },
        });

        // Notify Student
        await sendNotification(
            pass.student_id._id,
            `Your Gate Pass request has been REJECTED by the HOD.`, 
            'Gate Pass Final Rejection'
        );

        res.status(200).json({ success: true, data: pass });
    } catch (error) {
        console.error('Error in hodRejectGatePass:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
