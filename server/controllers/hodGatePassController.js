// hodGatePassController.js
const GatePass = require('../models/GatePass');
const Faculty = require('../models/Faculty');
const AuditLog = require('../models/AuditLog');
const { generateToken, PASS_TOKEN_SECRET } = require('../config/jwt'); // Assuming this generates the QR token
const { generateThreeDigitOTP } = require('../utils/otpUtils');
const { sendNotification } = require('../services/notificationService');
const { generateWatermarkedPDF } = require('../services/pdfGenerationService');

// @desc    Get pending gate passes requiring HOD final approval
// @route   GET /api/gatepass/hod/pending
// @access  Private (HOD)
exports.getHODPendingGatePasses = async (req, res) => {
    try {
        const hodId = req.user.id;
        const userDepartment = req.user.department; // Assuming department is in req.user from auth middleware

        console.log(`[HOD GatePass Controller] getHODPendingGatePasses: HOD ID: ${hodId}, Department: ${userDepartment}`);

        // CRUCIAL LOGIC: Find passes where Level 1 (Faculty) is done, and HOD (Level 2) is pending.
        // Also ensure the pass belongs to the HOD's department
        const pendingPasses = await GatePass.find({
            hod_approver_id: hodId,
            department_id: userDepartment, // Added department filter
            faculty_status: 'APPROVED',
            hod_status: 'PENDING',
        })
            .populate('student_id', 'fullName studentId department')
            .populate('faculty_approver_id', 'fullName'); // To show who gave Level 1 approval

        console.log(`[HOD GatePass Controller] Found ${pendingPasses.length} pending passes for HOD ${hodId}`);
        res.status(200).json({ success: true, data: pendingPasses });
    } catch (error) {
        console.error('[HOD GatePass Controller] Error fetching HOD pending gate passes:', error);
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
        const tokenPayload = {
            passId: pass._id.toString(),
            studentId: pass.student_id._id.toString(), // Include student ID for better verification
            departmentId: pass.department_id.toString(), // Include department ID
        };
        // Calculate expiresIn based on pass.date_valid_to
        const now = new Date();
        const validTo = new Date(pass.date_valid_to);
        let expiresInDuration = '1h'; // Default to 1 hour if calculation is problematic or pass is short
        if (validTo > now) {
            const diffSeconds = Math.floor((validTo.getTime() - now.getTime()) / 1000);
            if (diffSeconds > 0) {
                expiresInDuration = `${diffSeconds}s`;
            }
        }

        pass.qr_code_id = generateToken(tokenPayload, PASS_TOKEN_SECRET, expiresInDuration); 
        pass.one_time_pin = generateThreeDigitOTP(); // Changed from verification_otp to one_time_pin to match schema

        // Fetch HOD's full name for the watermark
        const hod = await Faculty.findById(req.user.id);
        const hodName = hod ? hod.fullName : 'Unknown HOD';

        // Generate PDF
        const pdfResult = await generateWatermarkedPDF(pass, hodName);
        if (pdfResult.success) {
            pass.pdf_path = pdfResult.filePath;
        } else {
            console.error('Failed to generate PDF for Gate Pass:', pdfResult.error);
        }

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
                pdfPath: pass.pdf_path, // Include PDF path in audit log
            },
        });

        // Notify Student
        await sendNotification(
            pass.student_id._id,
            `Your Gate Pass request has been APPROVED by the HOD. Your pass is now active and available for download.`, 
            'Gate Pass FINAL Approval'
        );

        res.status(200).json({ success: true, data: pass, pdfPath: pass.pdf_path });
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

// @desc    Get all gate pass history for HOD's department
// @route   GET /api/gatepass/hod/history
// @access  Private (HOD)
exports.getHODGatePassHistory = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) {
      return res.status(400).json({ success: false, message: 'HOD user does not have a department assigned.' });
    }

    const historyPasses = await GatePass.find({ department_id: department })
      .populate('student_id', 'fullName studentId')
      .populate('faculty_approver_id', 'fullName')
      .populate('hod_approver_id', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: historyPasses });
  } catch (error) {
    console.error('Error fetching HOD gate pass history:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get department-wide gate pass statistics for HOD
// @route   GET /api/gatepass/hod/stats
// @access  Private (HOD)
exports.getHODDepartmentStats = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) {
      return res.status(400).json({ success: false, message: 'HOD user does not have a department assigned.' });
    }

    // Total gate passes for the department
    const totalGatePasses = await GatePass.countDocuments({ department_id: department });

    // Total approved by HOD
    const totalApprovedByHOD = await GatePass.countDocuments({
      department_id: department,
      hod_status: 'APPROVED',
    });

    // Total rejected by HOD
    const totalRejectedByHOD = await GatePass.countDocuments({
      department_id: department,
      hod_status: 'REJECTED',
    });

    // Total pending HOD approval
    const totalPendingHODApproval = await GatePass.countDocuments({
      department_id: department,
      faculty_status: 'APPROVED',
      hod_status: 'PENDING',
    });

    // Total late returns for the department
    const departmentLateReturns = await AuditLog.countDocuments({
        event_type: 'LatenessLogged',
        'event_details.expectedReturnTime': { $lt: new Date() },
        gatepass_id: {
            $in: await GatePass.find({ department_id: department }).distinct('_id')
        }
    });

    // Master Audit Log for the department (last 50 entries for example)
    const masterAuditLog = await AuditLog.find({
      $or: [
        { gatepass_id: { $in: await GatePass.find({ department_id: department }).distinct('_id') } },
        // Potentially include special passes if they are also department-specific and relevant to HOD oversight
      ]
    })
      .sort({ timestamp: -1 })
      .limit(50);


    res.status(200).json({ success: true, data: {
        totalGatePasses,
        totalApprovedByHOD,
        totalRejectedByHOD,
        totalPendingHODApproval,
        departmentLateReturns,
        masterAuditLog,
    } });
  } catch (error) {
    console.error('Error fetching HOD department stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
