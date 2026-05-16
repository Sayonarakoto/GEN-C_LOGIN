const path = require('path');
const GatePass = require('../models/GatePass');
const Student = require('../models/student');
const Faculty = require('../models/Faculty'); // Needed to check faculty role
const AuditLog = require('../models/AuditLog'); // New import
const { generateToken } = require('../config/jwt');
const { generateThreeDigitOTP } = require('../utils/otpUtils');
const { getISTTimeInMinutes } = require('../utils/timeUtils');
const { sendNotification } = require('../services/notificationService');
const { generateWatermarkedPDF } = require('../services/pdfGenerationService'); // New import
const { verifyOTPPass, verifyQRPass } = require('../services/verificationService'); // Import verification services
const { logAuditAttempt } = require('../services/auditService'); // Import audit service
const createError = require('../utils/error');

// @desc    Get active gate pass for a student
// @route   GET /api/gatepass/student/active
// @access  Private (Student)
exports.getActiveGatePass = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const activePass = await GatePass.findOne({
      student_id: studentId,
      faculty_status: 'APPROVED',
      hod_status: 'APPROVED',
      date_valid_to: { $gte: new Date() }
    }).populate('student_id', 'fullName studentId department')
      .populate('faculty_approver_id', 'fullName')
      .populate('hod_approver_id', 'fullName')
      .select('+pdf_path +qr_code_id +one_time_pin'); // Ensure fields are selected

    if (!activePass) {
      return next(createError('No active gate pass found.', 404));
    }

    res.status(200).json({ success: true, data: activePass });
  } catch (error) {
    console.error('Error fetching active gate pass:', error);
    next(error);
  }
};

// @desc    Request a new gate pass
// @route   POST /api/gatepass/student/request
// @access  Private (Student)
exports.requestGatePass = async (req, res, next) => {
    const { destination, reason, selectedApproverId, date_valid_from, date_valid_to, isHalfDay, approverRole } = req.body;
    const studentId = req.user.id;

    try {
        // Basic validation
        if (!destination || !reason || !selectedApproverId || !date_valid_from || !approverRole) {
            return next(createError('Please provide all required fields.', 400));
        }

        // If not a half-day pass, date_valid_to is required
        if (!isHalfDay && !date_valid_to) {
            return next(createError('Return time is required for full-day passes.', 400));
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return next(createError('Student not found.', 404));
        }

        const selectedApprover = await Faculty.findById(selectedApproverId);
        if (!selectedApprover) {
            return next(createError('Selected approver not found.', 404));
        }

        // CRITICAL FIX: Ensure selected approver is from the same department as the student
        if (selectedApprover.department !== student.department) {
            return next(createError('Selected approver is not from your department.', 403));
        }

        let faculty_approver_id = null;
        let hod_approver_id = null;
        let faculty_status = 'PENDING';
        let hod_status = 'PENDING';
        let notificationRecipientId = selectedApproverId;
        let notificationMessage = `A new Gate Pass request from ${student.fullName} is awaiting your approval.`;

        if (approverRole === 'HOD') {
            // Student chose HOD directly
            hod_approver_id = selectedApproverId;
            faculty_approver_id = null; // No faculty advisor in this path
            hod_status = 'PENDING';
            faculty_status = 'APPROVED'; // Bypassing faculty advisor
            notificationRecipientId = selectedApproverId; // Notify the HOD
            notificationMessage = `A new Gate Pass request from ${student.fullName} is awaiting your approval.`;
        } else { // Default to 'Faculty' (approverRole is not 'HOD')
            // Student chose Faculty Advisor
            faculty_approver_id = selectedApproverId;

            // Check if the selected faculty is actually an HOD
            if (selectedApprover.designation.toUpperCase() === 'HOD') {
                // If the selected faculty is an HOD, then it's a single-tier approval by this HOD
                hod_approver_id = selectedApproverId; // HOD acts as the initial approver
                faculty_approver_id = null; // No separate faculty approval step
                faculty_status = 'APPROVED'; // Bypassed faculty approval
                hod_status = 'PENDING'; // HOD still needs to approve
                notificationRecipientId = selectedApproverId; // Notify the HOD
                notificationMessage = `A new Gate Pass request from ${student.fullName} is awaiting your approval.`;
            } else {
                // Standard two-tier approval: Faculty -> HOD
                const hod = await Faculty.findOne({ department: student.department, designation: 'HOD' });
                if (!hod) {
                    return next(createError(`No HOD found for ${student.department} department.`, 404));
                }
                hod_approver_id = hod._id;
                faculty_status = 'PENDING';
                hod_status = 'PENDING';
                notificationRecipientId = selectedApproverId; // Notify the Faculty
                notificationMessage = `A new Gate Pass request from ${student.fullName} is awaiting your approval.`;
            }
        }

        // Convert ISO strings to Date objects
        const exitDate = new Date(date_valid_from);
        let returnDateObj = null;
        if (date_valid_to) {
            returnDateObj = new Date(date_valid_to);
        }

        // Validate dates
        if (isNaN(exitDate.getTime())) {
            return next(createError('Invalid exit date/time provided.', 400));
        }
        if (!isHalfDay && date_valid_to && isNaN(returnDateObj.getTime())) {
            return next(createError('Invalid return date/time provided.', 400));
        }

        // --- Time Range Validation (9:30 AM to 4:00 PM IST) ---
        const collegeStartHour = 9;
        const collegeStartMinute = 30;
        const collegeEndHour = 16;
        const collegeEndMinute = 0;

        const collegeStartTimeInMinutes = collegeStartHour * 60 + collegeStartMinute;
        const collegeEndTimeInMinutes = collegeEndHour * 60 + collegeEndMinute;

        // Function to get IST hour and minute from a Date object
        const exitTimeInMinutes = getISTTimeInMinutes(exitDate);

        if (exitTimeInMinutes < collegeStartTimeInMinutes || exitTimeInMinutes > collegeEndTimeInMinutes) {
            return next(createError('Requested exit time must be within college hours (9:30 AM - 4:00 PM).', 400));
        }

        if (returnDateObj) {
            const returnTimeInMinutes = getISTTimeInMinutes(returnDateObj);

            if (returnTimeInMinutes < collegeStartTimeInMinutes || returnTimeInMinutes > collegeEndTimeInMinutes) {
                return next(createError('Requested return time must be within college hours (9:30 AM - 4:00 PM).', 400));
            }
        }
        // --- End Time Range Validation ---

        const newPass = new GatePass({
            student_id: studentId,
            destination,
            reason,
            pass_type: 'Gate Pass', // Added pass_type
            faculty_approver_id,
            hod_approver_id,
            department_id: student.department,
            date_valid_from: exitDate,
            date_valid_to: returnDateObj,
            faculty_status,
            hod_status,
        });

        await newPass.save();

        // Log the request in AuditLog
        await AuditLog.create({
            gatepass_id: newPass._id,
            event_type: 'Request',
            actor_role: 'Student',
            actor_id: studentId,
            event_details: {
                destination,
                reason,
                faculty_approver_id,
                hod_approver_id,
                initial_faculty_status: faculty_status,
                initial_hod_status: hod_status,
            },
        });

        // Send notification to the initial approver
        if (notificationRecipientId) {
            await sendNotification(
                notificationRecipientId,
                notificationMessage,
                'New Gate Pass Request'
            );
        }

        res.status(201).json({ success: true, data: newPass });

    } catch (error) {
        console.error('Error requesting gate pass:', error);
        next(error);
    }
};

// @desc    Get pending gate passes for a faculty member
// @route   GET /api/gatepass/faculty/pending
// @access  Private (Faculty)
exports.getPendingGatePasses = async (req, res, next) => {
  try {
    const facultyId = req.user.id;
    const pendingPasses = await GatePass.find({
      faculty_approver_id: facultyId,
      faculty_status: 'PENDING',
      hod_status: 'PENDING',
    }).populate('student_id', 'fullName studentId department');

    if (pendingPasses.length > 0) {
      const message = `You have ${pendingPasses.length} pending gate pass requests.`;
      await sendNotification(facultyId, message, 'Pending Requests');
    }

    res.status(200).json({ success: true, data: pendingPasses });
  } catch (error) {
    console.error('Error fetching pending gate passes:', error);
    next(error);
  }
};

// @desc    Get gate pass history for a faculty member
// @route   GET /api/gatepass/faculty/history
// @access  Private (Faculty)
exports.getGatePassHistory = async (req, res, next) => {
  try {
    const facultyId = req.user.id;
    const historyPasses = await GatePass.find({
      $or: [
        { faculty_approver_id: facultyId, faculty_status: { $ne: 'PENDING' } }, // Faculty has acted on it
        { hod_approver_id: facultyId, hod_status: { $ne: 'PENDING' } } // HOD has acted on it
      ]
    })
      .populate('student_id', 'fullName studentId department')
      .populate('faculty_approver_id', 'fullName')
      .populate('hod_approver_id', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: historyPasses });
  } catch (error) {
    console.error('Error fetching gate pass history:', error);
    next(error);
  }
};

// @desc    Faculty approves a gate pass and forwards to HOD
// @route   PUT /api/gatepass/faculty/approve/:id
// @access  Private (Faculty)
exports.facultyApproveGatePass = async (req, res, next) => {
  try {
    const pass = await GatePass.findById(req.params.id).populate('student_id', 'fullName');

    if (!pass) {
      return next(createError('Gate pass not found.', 404));
    }

    // Ensure the pass is pending faculty approval and assigned to this faculty
    if (pass.faculty_status !== 'PENDING' || pass.faculty_approver_id.toString() !== req.user.id) {
      return next(createError('Not authorized or pass not in correct status for faculty approval.', 401));
    }

    pass.faculty_status = 'APPROVED';
    // No need to set date_valid_to here, it's set on request, but we should fix the logic that
    // allows it to be null in the request if returnTime is not provided.

    // CHECK FOR HOD FINALIZATION (Single-Tier Approval)
    if (!pass.hod_approver_id || pass.faculty_approver_id.equals(pass.hod_approver_id)) { 
        // Case: No HOD assigned (single tier) OR the Faculty who approved IS the HOD
        
        // Finalize HOD status
        pass.hod_status = 'APPROVED'; 
        
        // CRITICAL STEP: Generate Credentials!
        pass.qr_code_id = generateToken({ passId: pass._id }, process.env.PASS_TOKEN_SECRET); 
        pass.one_time_pin = generateThreeDigitOTP();

        // Emit status update and notification to Student (FINAL APPROVAL)
        // This part needs to be adapted from hodApproveGatePass
        if (req.io && req.userSocketMap.has(pass.student_id._id.toString())) {
            req.io.to(pass.student_id._id.toString()).emit('statusUpdate:gatePass', {
                recordId: pass._id,
                newStatus: pass.hod_status,
                userId: pass.student_id._id,
                eventType: 'GATEPASS_HOD_APPROVED', // Changed to HOD_APPROVED as it's final
                hod_approver_id: req.user.id,
                qr_code_id: pass.qr_code_id,
                one_time_pin: pass.one_time_pin
            });
        }
        await sendNotification(
            pass.student_id._id,
            `Your Gate Pass to ${pass.destination} has been APPROVED by ${req.user.fullName}. QR Code and OTP are available in your app. OTP: ${pass.one_time_pin}`,
            'Gate Pass Approved'
        );
    } 
    // ...

    await pass.save(); 

    // If multi-tier, notify HOD
    if (pass.hod_approver_id && !pass.faculty_approver_id.equals(pass.hod_approver_id)) {
        // Notify HOD if one is separate
        const hod = await Faculty.findById(pass.hod_approver_id);
        if (hod) {
            await sendNotification(
                hod._id,
                `A Gate Pass for ${pass.student_id.fullName} is awaiting your final approval.`, 
                'Gate Pass Pending HOD Approval'
            );
        }
    }

    // Log faculty approval in AuditLog (moved after save to ensure pass._id is available)
    await AuditLog.create({
        gatepass_id: pass._id,
        event_type: 'Approved',
        actor_role: 'faculty',
        actor_id: req.user.id,
        event_details: {
            status_change: 'faculty_status: PENDING -> APPROVED',
            hod_notified: !!pass.hod_approver_id,
            qr_code_generated: !!pass.qr_code_id,
            one_time_pin_generated: !!pass.one_time_pin,
        },
    });

    res.status(200).json({ success: true, data: pass });
  } catch (error) {
    console.error('Error in facultyApproveGatePass:', error);
    // Log more details about the error for debugging
    if (error.name === 'CastError') {
      return next(createError('Invalid ID format provided.', 400));
    }
    if (error.name === 'ValidationError') {
      return next(createError(error.message, 400));
    }
    next(error);
  }
};

// @desc    Faculty rejects a gate pass
// @route   PUT /api/gatepass/faculty/reject/:id
// @access  Private (Faculty)
exports.facultyRejectGatePass = async (req, res, next) => {
    try {
        const pass = await GatePass.findById(req.params.id).populate('student_id', 'fullName');

        if (!pass) {
            return next(createError('Gate pass not found.', 404));
        }

        if (pass.faculty_status !== 'PENDING' || !pass.faculty_approver_id || pass.faculty_approver_id.toString() !== req.user.id) {
            return next(createError('Not authorized or pass not in correct status for faculty rejection.', 401));
        }

        pass.faculty_status = 'REJECTED';
        // CRITICAL FIX 1: Terminate the HOD's PENDING status immediately on faculty rejection.
        // This ensures the student sees the final REJECTED status.
        if (pass.hod_approver_id) {
            pass.hod_status = 'REJECTED'; // Set HOD status to rejected as well
        }

        await pass.save();

        // Log faculty rejection in AuditLog
        await AuditLog.create({
            gatepass_id: pass._id,
            event_type: 'Rejected',
            actor_role: 'faculty',
            actor_id: req.user.id,
            event_details: {
                status_change: 'faculty_status: PENDING -> REJECTED',
                rejection_reason: req.body.rejectionReason || 'No reason provided',
            },
        });

        // Emit Socket.IO event for frontend update
        if (req.io && pass.student_id && req.userSocketMap.has(pass.student_id._id.toString())) {
            req.io.to(pass.student_id._id.toString()).emit('statusUpdate:gatePass', {
                recordId: pass._id,
                newStatus: pass.faculty_status,
                userId: pass.student_id._id,
                eventType: 'GATEPASS_FACULTY_REJECTED',
                faculty_approver_id: req.user.id,
                rejection_reason: req.body.rejectionReason
            });
        }

        if (pass.student_id) {
            await sendNotification(
                pass.student_id._id,
                `Your Gate Pass to ${pass.destination} has been REJECTED by your faculty.`, 
                'Gate Pass Rejected'
            );
        }

        res.status(200).json({ success: true, data: pass });
    } catch (error) {
        console.error('Error in facultyRejectGatePass:', error);
        next(error);
    }
};

// @desc    HOD approves/finalizes a gate pass
// @route   PUT /api/gatepass/hod/approve/:id
// @access  Private (HOD)
exports.hodApproveGatePass = async (req, res, next) => {
  try {
    const pass = await GatePass.findById(req.params.id).populate('student_id', 'fullName');

    if (!pass) {
      return next(createError('Gate pass not found.', 404));
    }

    // Check if the HOD is authorized to approve this pass
    const isHODofDepartment = req.user.department.toString() === pass.department_id.toString();
    const isAssignedHOD = pass.hod_approver_id && pass.hod_approver_id.toString() === req.user.id;
    const isDirectHODApproval = !pass.hod_approver_id && pass.faculty_approver_id.toString() === req.user.id && pass.faculty_status === 'APPROVED';

    if (!isHODofDepartment || (!isAssignedHOD && !isDirectHODApproval)) {
        return next(createError('Not authorized to approve this pass.', 401));
    }

    // Ensure the pass is in a state ready for HOD approval
    if (pass.hod_status !== 'PENDING' || (pass.faculty_status !== 'APPROVED' && !isDirectHODApproval)) {
        return next(createError('Pass not in correct status for HOD approval.', 400));
    }

    pass.hod_status = 'APPROVED';

    // Generate QR code ID and OTP
    const qr_code_id = generateToken(
        {
            pass_id: pass._id,
            student_id: pass.student_id._id,
            pass_type: 'Gate Pass',
        },
        process.env.PASS_TOKEN_SECRET,
        '1h' // QR code valid for 1 hour
    );
    const one_time_pin = generateThreeDigitOTP();

    pass.qr_code_id = qr_code_id;
    pass.one_time_pin = one_time_pin;

    await pass.save();

    // Log HOD approval and credential generation in AuditLog
    await AuditLog.create({
        gatepass_id: pass._id,
        event_type: 'Approved',
        actor_role: 'HOD',
        actor_id: req.user.id,
        event_details: {
            status_change: 'hod_status: PENDING -> APPROVED',
            qr_code_generated: true,
            one_time_pin_generated: true,
            pdf_generated: false, // Updated to reflect no disk file
        },
    });

    // Emit Socket.IO event for frontend update
    if (req.io && req.userSocketMap.has(pass.student_id._id.toString())) {
        req.io.to(pass.student_id._id.toString()).emit('statusUpdate:gatePass', {
            recordId: pass._id,
            newStatus: pass.hod_status,
            userId: pass.student_id._id,
            eventType: 'GATEPASS_HOD_APPROVED',
            hod_approver_id: req.user.id,
            qr_code_id: pass.qr_code_id,
            one_time_pin: pass.one_time_pin
        });
    }

    // Send notification to student
    await sendNotification(
        pass.student_id._id,
        `Your Gate Pass to ${pass.destination} has been APPROVED by ${req.user.fullName}. QR Code and OTP are available in your app. OTP: ${one_time_pin}`,
        'Gate Pass Approved'
    );

    res.status(200).json({ success: true, data: pass });
  } catch (error) {
    console.error('Error in hodApproveGatePass:', error);
    next(error);
  }
};

// @desc    HOD rejects a gate pass
// @route   PUT /api/gatepass/hod/reject/:id
// @access  Private (HOD)
exports.hodRejectGatePass = async (req, res, next) => {
    try {
        const pass = await GatePass.findById(req.params.id).populate('student_id', 'fullName');

        if (!pass) {
            return next(createError('Gate pass not found.', 404));
        }

        const isHODofDepartment = req.user.department.toString() === pass.department_id.toString();
        const isAssignedHOD = pass.hod_approver_id && pass.hod_approver_id.toString() === req.user.id;
        const isDirectHODApproval = !pass.hod_approver_id && pass.faculty_approver_id.toString() === req.user.id && pass.faculty_status === 'APPROVED';

        if (!isHODofDepartment || (!isAssignedHOD && !isDirectHODApproval)) {
            return next(createError('Not authorized to reject this pass.', 401));
        }

        if (pass.hod_status !== 'PENDING') {
            return next(createError('Pass not in correct status for HOD rejection.', 400));
        }

        pass.hod_status = 'REJECTED';
        await pass.save();

        // Log HOD rejection in AuditLog
        await AuditLog.create({
            gatepass_id: pass._id,
            event_type: 'Rejected',
            actor_role: 'HOD',
            actor_id: req.user.id,
            event_details: {
                status_change: 'hod_status: PENDING -> REJECTED',
                rejection_reason: req.body.rejectionReason || 'No reason provided',
            },
        });

        // Emit Socket.IO event for frontend update
        if (req.io && req.userSocketMap.has(pass.student_id._id.toString())) {
            req.io.to(pass.student_id._id.toString()).emit('statusUpdate:gatePass', {
                recordId: pass._id,
                newStatus: pass.hod_status,
                userId: pass.student_id._id,
                eventType: 'GATEPASS_HOD_REJECTED',
                hod_approver_id: req.user.id,
                rejection_reason: req.body.rejectionReason
            });
        }

        await sendNotification(
            pass.student_id._id,
            `Your Gate Pass to ${pass.destination} has been REJECTED by the HOD.`, 
            'Gate Pass Rejected'
        );

        res.status(200).json({ success: true, data: pass });
    } catch (error) {
        console.error('Error in hodRejectGatePass:', error);
        next(error);
    }
};

// @desc    Verify a gate pass using Student ID and OTP
// @route   POST /api/gatepass/verify-otp
// @access  Private (Security)
exports.verifyGatePassByOTP = async (req, res, next) => {
    const { studentIdString, otp, scan_location } = req.body;
    const securityUser = req.user; // Attached by auth middleware

    // Add scan_location to securityUser for logging purposes
    securityUser.scan_location = scan_location;

    try {
        if (!studentIdString || !otp) {
            await logAuditAttempt('Unknown', 'gate', 'Verified', securityUser, 'FAILED: Missing Student ID or OTP for Gate Pass verification.');
            return next(createError('Missing Student ID or OTP for verification.', 400));
        }

        // Use the centralized verifyOTPPass service
        const verificationResult = await verifyOTPPass(studentIdString, otp, 'gate');

        if (!verificationResult.isValid) {
            // Log the failure reason provided by the service
            await logAuditAttempt('Unknown', 'gate', 'Verified', securityUser, `FAILED (OTP): ${verificationResult.reason}`);
            let displayStatus = "ENTRY DENIED";
            if (verificationResult.reason.includes('Student ID not found')) {
                displayStatus = "STUDENT NOT FOUND";
            } else if (verificationResult.reason.includes('No active Gate Pass found')) {
                displayStatus = "PASS NOT FOUND";
            } else if (verificationResult.reason.includes('Pass expired')) {
                displayStatus = "PASS EXPIRED";
            }
            return res.status(200).json({
                is_valid: false,
                display_status: displayStatus,
                message: verificationResult.reason,
                pass_details: {}
            });
        }

        const gatePass = verificationResult.pass;

        // Populate student and HOD details for the response and audit log
        await gatePass.populate('student_id', 'fullName studentId');
        await gatePass.populate('hod_approver_id', 'fullName');

        // --- Duplicate Verification Check ---
        const sixtySecondsAgo = new Date(Date.now() - 60000);
        const recentVerification = await AuditLog.findOne({
            gatepass_id: gatePass._id,
            event_type: 'Verified',
            timestamp: { $gte: sixtySecondsAgo },
            'event_details.result': { $regex: /^SUCCESS/ }
        });

        if (recentVerification) {
            await logAuditAttempt(gatePass._id, 'gate', 'Verified', securityUser, `FAILED (OTP): Duplicate scan attempted within 60 seconds.`);
            return res.status(200).json({
                is_valid: false,
                display_status: "DUPLICATE SCAN",
                message: "This pass was already successfully verified within the last minute.",
                pass_details: {
                    student_name: gatePass.student_id ? gatePass.student_id.fullName : 'N/A',
                    pass_type: gatePass.pass_type,
                }
            });
        }

        // Log success
        const auditDetails = {
            student_name: gatePass.student_id ? gatePass.student_id.fullName : 'N/A',
            pass_type: gatePass.pass_type,
            pass_start_time: gatePass.date_valid_from,
            pass_end_time: gatePass.date_valid_to,
        };
        await logAuditAttempt(gatePass._id, 'gate', 'Verified', securityUser, `SUCCESS (OTP): ENTRY GRANTED`, auditDetails);

        // Send notification to student
        await sendNotification(
            gatePass.student_id._id,
            `Your Gate Pass to ${gatePass.destination} has been verified by Security at ${scan_location}.`,
            'Gate Pass Verified'
        );

        const response = {
            is_valid: true,
            display_status: "ENTRY GRANTED",
            message: 'Gate Pass validated successfully.',
            pass_details: {
                pass_id: gatePass._id,
                student_id: gatePass.student_id ? gatePass.student_id.studentId : 'N/A',
                student_name: gatePass.student_id ? gatePass.student_id.fullName : 'N/A',
                pass_type: gatePass.pass_type,
                hod_approver_name: gatePass.hod_approver_id ? gatePass.hod_approver_id.fullName : 'N/A',
                date_valid_to: gatePass.date_valid_to
            }
        };

        req.io.emit('new-pass-verified', response);
        return res.status(200).json(response);

    } catch (error) {
        console.error('Error in verifyGatePassByOTP:', error);
        await logAuditAttempt('Unknown', 'gate', 'Verified', securityUser, `FAILED (OTP): Server Error - ${error.message}`);
        next(error);
    }
};

// @desc    Verify a gate pass using QR Code
// @route   POST /api/gatepass/verify-qr
// @access  Private (Security)
exports.verifyGatePassByQR = async (req, res, next) => {
    const { qr_token, scan_location } = req.body;
    const securityUser = req.user; // Attached by auth middleware

    // Add scan_location to securityUser for logging purposes
    securityUser.scan_location = scan_location;

    try {
        if (!qr_token) {
            await logAuditAttempt('Unknown', 'gate', 'Verified', securityUser, 'FAILED: Missing QR Token for Gate Pass verification.');
            return next(createError('Missing QR Token for verification.', 400));
        }

        // Use the centralized verifyQRPass service
        const verificationResult = await verifyQRPass(qr_token, 'gate');

        if (!verificationResult.isValid) {
            // Log the failure reason provided by the service
            await logAuditAttempt('Unknown', 'gate', 'Verified', securityUser, `FAILED (QR): ${verificationResult.reason}`);
            let displayStatus = "ENTRY DENIED";
            if (verificationResult.reason.includes('Invalid QR')) {
                displayStatus = "INVALID QR";
            } else if (verificationResult.reason.includes('not found')) {
                displayStatus = "PASS NOT FOUND";
            } else if (verificationResult.reason.includes('expired')) {
                displayStatus = "PASS EXPIRED";
            }
            return res.status(200).json({
                is_valid: false,
                display_status: displayStatus,
                message: verificationResult.reason,
                pass_details: {}
            });
        }

        const gatePass = verificationResult.pass;

        // Populate student and HOD details for the response and audit log
        await gatePass.populate('student_id', 'fullName studentId');
        await gatePass.populate('hod_approver_id', 'fullName');

        // --- Duplicate Verification Check ---
        const sixtySecondsAgo = new Date(Date.now() - 60000);
        const recentVerification = await AuditLog.findOne({
            gatepass_id: gatePass._id,
            event_type: 'Verified',
            timestamp: { $gte: sixtySecondsAgo },
            'event_details.result': { $regex: /^SUCCESS/ }
        });

        if (recentVerification) {
            await logAuditAttempt(gatePass._id, 'gate', 'Verified', securityUser, `FAILED (QR): Duplicate scan attempted within 60 seconds.`);
            return res.status(200).json({
                is_valid: false,
                display_status: "DUPLICATE SCAN",
                message: "This pass was already successfully verified within the last minute.",
                pass_details: {
                    student_name: gatePass.student_id ? gatePass.student_id.fullName : 'N/A',
                    pass_type: gatePass.pass_type,
                }
            });
        }

        // Log success
        const auditDetails = {
            student_name: gatePass.student_id ? gatePass.student_id.fullName : 'N/A',
            pass_type: gatePass.pass_type,
            pass_start_time: gatePass.date_valid_from,
            pass_end_time: gatePass.date_valid_to,
        };
        await logAuditAttempt(gatePass._id, 'gate', 'Verified', securityUser, `SUCCESS (QR): ENTRY GRANTED`, auditDetails);

        // Send notification to student
        await sendNotification(
            gatePass.student_id._id,
            `Your Gate Pass to ${gatePass.destination} has been verified by Security at ${scan_location}.`,
            'Gate Pass Verified'
        );

        const response = {
            is_valid: true,
            display_status: "ENTRY GRANTED",
            message: 'Gate Pass validated successfully.',
            pass_details: {
                pass_id: gatePass._id,
                student_id: gatePass.student_id ? gatePass.student_id.studentId : 'N/A',
                student_name: gatePass.student_id ? gatePass.student_id.fullName : 'N/A',
                pass_type: gatePass.pass_type,
                hod_approver_name: gatePass.hod_approver_id ? gatePass.hod_approver_id.fullName : 'N/A',
                date_valid_to: gatePass.date_valid_to
            }
        };

        req.io.emit('new-pass-verified', response);
        return res.status(200).json(response);

    } catch (error) {
        console.error('Error in verifyGatePassByQR:', error);
        await logAuditAttempt('Unknown', 'gate', 'Verified', securityUser, `FAILED (QR): Server Error - ${error.message}`);
        next(error);
    }
};

// @desc    Log a late return for a gate pass
// @route   POST /api/gatepass/log-late-return
// @access  Private (Security)
exports.logLateReturn = async (req, res, next) => {
    const { gatePassId, scanLocation, remarks } = req.body;
    const securityId = req.user.id;

    try {
        if (!gatePassId) {
            return next(createError('Gate Pass ID is required.', 400));
        }

        const gatePass = await GatePass.findById(gatePassId).populate('student_id', 'fullName');
        if (!gatePass) {
            return next(createError('Gate Pass not found.', 404));
        }

        // Ensure the gate pass was approved and is not already marked as late
        if (gatePass.hod_status !== 'APPROVED') {
            return next(createError('Gate Pass was not approved or is not valid for late return logging.', 400));
        }

        // Log the lateness event in AuditLog
        await AuditLog.create({
            gatepass_id: gatePass._id,
            event_type: 'LatenessLogged',
            actor_role: 'Security',
            actor_id: securityId,
            event_details: {
                scanLocation,
                remarks,
                returnTime: new Date(),
                expectedReturnTime: gatePass.date_valid_to,
            },
        });

        // Emit Socket.IO event for frontend update
        if (req.io && req.userSocketMap.has(gatePass.student_id._id.toString())) {
            req.io.to(gatePass.student_id._id.toString()).emit('statusUpdate:gatePass', {
                recordId: gatePass._id,
                newStatus: 'LATE_RETURN',
                userId: gatePass.student_id._id,
                eventType: 'GATEPASS_LATE_RETURN',
                security_id: securityId,
                scan_location: scanLocation,
                remarks: remarks
            });
        }

        // Notify the assigned HOD
        if (gatePass.hod_approver_id) {
            const hod = await Faculty.findById(gatePass.hod_approver_id);
            if (hod) {
                await sendNotification(
                    hod._id,
                    `A student (${gatePass.student_id.fullName}) with Gate Pass ID ${gatePass._id} has logged a late return. Please review.`, 
                    'Late Gate Pass Return'
                );
            }
        }

        res.status(200).json({ success: true, message: 'Late return logged successfully.' });

    } catch (error) {
        console.error('Error logging late return:', error);
        next(error);
    }
};

// @desc    Get gate pass history for a student
// @route   GET /api/gatepass/student/history
// @access  Private (Student)
exports.getStudentGatePassHistory = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const historyPasses = await GatePass.find({ student_id: studentId })
      .populate('faculty_approver_id', 'fullName')
      .populate('hod_approver_id', 'fullName')
      .select('+pdf_path') // Add this line
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: historyPasses });
  } catch (error) {
    console.error('Error fetching student gate pass history:', error);
    next(error);
  }
};

// @desc    Download a gate pass PDF
// @route   GET /api/gatepass/download-pdf/:id
// @access  Private (Student, HOD, Security)
exports.downloadGatePassPDF = async (req, res, next) => {
  try {
    const passId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const gatePass = await GatePass.findById(passId)
      .populate('student_id', 'fullName studentId department year profilePictureUrl')
      .populate('hod_approver_id', 'fullName');

    if (!gatePass) {
      return next(createError('Gate Pass not found.', 404));
    }

    // Authorization: Only the student who requested it, or an HOD/Security can download
    const isStudent = userRole === 'student' && gatePass.student_id._id.toString() === userId;
    const isHOD = userRole === 'HOD' && gatePass.department_id.toString() === req.user.department.toString();
    const isSecurity = userRole === 'security';

    if (!isStudent && !isHOD && !isSecurity) {
      return next(createError('Not authorized to download this gate pass.', 403));
    }

    // Regenerate the PDF on-demand
    const hodName = gatePass.hod_approver_id ? gatePass.hod_approver_id.fullName : 'N/A';
    const pdfBytes = await generateWatermarkedPDF(gatePass, hodName);

    // Stream the PDF to the client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="gate_pass_${passId}.pdf"`);
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Error in downloadGatePassPDF:', error);
    next(error);
  }
};

// @desc    Get all gate pass history for HOD's department
// @route   GET /api/gatepass/hod/history
// @access  Private (HOD)
exports.getHODGatePassHistory = async (req, res, next) => {
  try {
    const department = req.user.department;
    if (!department) {
      return next(createError('HOD user does not have a department assigned.', 400));
    }

    const historyPasses = await GatePass.find({ department_id: department })
      .populate('student_id', 'fullName studentId')
      .populate('faculty_approver_id', 'fullName')
      .populate('hod_approver_id', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: historyPasses });
  } catch (error) {
    console.error('Error fetching HOD gate pass history:', error);
    next(error);
  }
};

// @desc    Get pending gate passes for HOD approval
// @route   GET /api/gatepass/hod/pending
// @access  Private (HOD)
exports.getPendingHODApprovals = async (req, res, next) => {
  try {
    const hodId = req.user.id; // Get HOD's ID from the authenticated user
    if (!hodId) {
      return next(createError('HOD user ID not found.', 400));
    }

    const pendingPasses = await GatePass.find({
      $or: [
        // Case 1: HOD is the secondary approver (multi-tier)
        {
          hod_approver_id: hodId,
          faculty_status: 'APPROVED',
          hod_status: 'PENDING',
        },
        // Case 2: HOD is the initial approver (single-tier)
        {
          faculty_approver_id: hodId,
          hod_approver_id: null, // Explicitly check for null
          faculty_status: 'PENDING', // HOD as faculty, still pending their approval
        },
      ],
    })
      .populate('student_id', 'fullName studentId')
      .populate('faculty_approver_id', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: pendingPasses });
  } catch (error) {
    console.error('Error fetching pending HOD approvals:', error);
    next(error);
  }
};

// @desc    Get gate pass statistics for a faculty member
// @route   GET /api/gatepass/faculty/stats
// @access  Private (Faculty)
exports.getFacultyGatePassStats = async (req, res, next) => {
  try {
    const facultyId = req.user.id;
    const department = req.user.department;

    // Total gate passes where faculty is the approver
    const totalApprovedByFaculty = await GatePass.countDocuments({
      faculty_approver_id: facultyId,
      faculty_status: 'APPROVED',
    });

    // Total gate passes rejected by faculty
    const totalRejectedByFaculty = await GatePass.countDocuments({
      faculty_approver_id: facultyId,
      faculty_status: 'REJECTED',
    });

    // Total gate passes pending faculty approval
    const totalPendingFacultyApproval = await GatePass.countDocuments({
      faculty_approver_id: facultyId,
      faculty_status: 'PENDING',
    });

    // Total late returns for gate passes where this faculty is the initial approver
    // This requires querying AuditLog for 'LatenessLogged' events related to gate passes
    // that this faculty initially approved.
    const lateReturns = await AuditLog.countDocuments({
        event_type: 'LatenessLogged',
        'event_details.expectedReturnTime': { $lt: new Date() }, // Assuming late if current time > expected return
        gatepass_id: { 
            $in: await GatePass.find({ faculty_approver_id: facultyId }).distinct('_id')
        }
    });


    res.status(200).json({
      success: true,
      data: {
        totalApprovedByFaculty,
        totalRejectedByFaculty,
        totalPendingFacultyApproval,
        lateReturns,
      },
    });
  } catch (error) {
    console.error('Error fetching faculty gate pass stats:', error);
    next(error);
  }
};

// @desc    Get department-wide gate pass statistics for HOD
// @route   GET /api/gatepass/hod/stats
// @access  Private (HOD)
exports.getHODDepartmentStats = async (req, res, next) => {
  try {
    const department = req.user.department;
    if (!department) {
      return next(createError('HOD user does not have a department assigned.', 400));
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


    res.status(200).json({
      success: true,
      data: {
        totalGatePasses,
        totalApprovedByHOD,
        totalRejectedByHOD,
        totalPendingHODApproval,
        departmentLateReturns,
        masterAuditLog,
      },
    });
  } catch (error) {
    console.error('Error fetching HOD department stats:', error);
    next(error);
  }
};
