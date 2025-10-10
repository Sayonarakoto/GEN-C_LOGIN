const GatePass = require('../models/GatePass');
const Student = require('../models/student');
const Faculty = require('../models/Faculty'); // Needed to check faculty role
const AuditLog = require('../models/AuditLog'); // New import
const { generateToken } = require('../config/jwt');
const { generateThreeDigitOTP } = require('../utils/otpUtils');
const { sendNotification } = require('../services/notificationService');

// @desc    Get active gate pass for a student
// @route   GET /api/gatepass/student/active
// @access  Private (Student)
exports.getActiveGatePass = async (req, res) => {
  try {
    const studentId = req.user.id;

    const activePass = await GatePass.findOne({
      student_id: studentId,
      faculty_status: 'APPROVED',
      hod_status: 'APPROVED',
      date_valid_to: { $gte: new Date() }
    }).populate('student_id', 'fullName studentId department');

    if (!activePass) {
      return res.status(404).json({ success: false, message: 'No active gate pass found.' });
    }

    res.status(200).json({ success: true, data: activePass });
  } catch (error) {
    console.error('Error fetching active gate pass:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Request a new gate pass
// @route   POST /api/gatepass/student/request
// @access  Private (Student)
exports.requestGatePass = async (req, res) => {
    const { destination, reason, selectedApproverId, exitTime, returnTime } = req.body;
    const studentId = req.user.id;

    try {
        // Basic validation
        if (!destination || !reason || !selectedApproverId || !exitTime) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const selectedApprover = await Faculty.findById(selectedApproverId);
        if (!selectedApprover) {
            return res.status(404).json({ success: false, message: 'Selected approver not found.' });
        }

        let faculty_approver_id = null;
        let hod_approver_id = null;
        let faculty_status = 'PENDING';
        let hod_status = 'PENDING';
        let notificationRecipientId = null;
        let notificationMessage = '';

        if (selectedApprover.designation === 'FACULTY') {
            faculty_approver_id = selectedApproverId;
            const hod = await Faculty.findOne({ department: student.department, designation: 'HOD' });
            if (!hod) {
                return res.status(404).json({ success: false, message: `No HOD found for ${student.department} department.` });
            }
            hod_approver_id = hod._id;
            notificationRecipientId = faculty_approver_id;
            notificationMessage = `A new Gate Pass request from ${student.fullName} is awaiting your approval.`;
        } else if (selectedApprover.designation === 'HOD') {
            faculty_approver_id = selectedApproverId; // HOD acts as the initial approver
            hod_approver_id = null; // Single-tier approval, HOD is the only approver
            faculty_status = 'APPROVED'; // Bypassed faculty approval
            notificationRecipientId = faculty_approver_id;
            notificationMessage = `A new Gate Pass request from ${student.fullName} is awaiting your approval.`;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid approver designation.' });
        }

        // FIX: Directly use ISO 8601 strings to create Date objects
        const exitDate = new Date(exitTime);
        let returnDate = null;
        if (returnTime) {
            returnDate = new Date(returnTime);
        }

        const newPass = new GatePass({
            student_id: studentId,
            destination,
            reason,
            faculty_approver_id,
            hod_approver_id,
            department_id: student.department,
            date_valid_from: exitDate,
            date_valid_to: returnDate,
            faculty_status,
            hod_status,
        });

        await newPass.save();

        // Log the request in AuditLog
        await AuditLog.create({
            pass_id: newPass._id,
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
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get pending gate passes for a faculty member
// @route   GET /api/gatepass/faculty/pending
// @access  Private (Faculty)
exports.getPendingGatePasses = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const pendingPasses = await GatePass.find({
      faculty_approver_id: facultyId,
      faculty_status: 'PENDING',
      hod_status: 'PENDING',
    }).populate('student_id', 'fullName studentId department');

    res.status(200).json({ success: true, data: pendingPasses });
  } catch (error) {
    console.error('Error fetching pending gate passes:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get gate pass history for a faculty member
// @route   GET /api/gatepass/faculty/history
// @access  Private (Faculty)
exports.getGatePassHistory = async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Faculty approves a gate pass and forwards to HOD
// @route   PUT /api/gatepass/faculty/approve/:id
// @access  Private (Faculty)
exports.facultyApproveGatePass = async (req, res) => {
  try {
    const pass = await GatePass.findById(req.params.id).populate('student_id', 'fullName');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Gate pass not found' });
    }

    // Ensure the pass is pending faculty approval and assigned to this faculty
    if (pass.faculty_status !== 'PENDING' || pass.faculty_approver_id.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized or pass not in correct status for faculty approval.' });
    }

    pass.faculty_status = 'APPROVED';
    await pass.save();

    // Log faculty approval in AuditLog
    await AuditLog.create({
        pass_id: pass._id,
        event_type: 'Approved',
        actor_role: 'faculty',
        actor_id: req.user.id,
        event_details: {
            status_change: 'faculty_status: PENDING -> APPROVED',
            hod_notified: !!pass.hod_approver_id,
        },
    });

    // Emit Socket.IO event for frontend update
    if (req.io && req.userSocketMap.has(pass.student_id._id.toString())) {
        req.io.to(pass.student_id._id.toString()).emit('statusUpdate:gatePass', {
            recordId: pass._id,
            newStatus: pass.faculty_status,
            userId: pass.student_id._id,
            eventType: 'GATEPASS_FACULTY_APPROVED',
            faculty_approver_id: req.user.id
        });
    }

    // Notify HOD if there is one assigned
    if (pass.hod_approver_id) {
        const hod = await Faculty.findById(pass.hod_approver_id);
        if (hod) {
            await sendNotification(
                hod._id,
                `A Gate Pass for ${pass.student_id.fullName} is awaiting your final approval.`, 
                'Gate Pass Pending HOD Approval'
            );
        }
    }

    res.status(200).json({ success: true, data: pass });
  } catch (error) {
    console.error('Error in facultyApproveGatePass:', error);
    // Log more details about the error for debugging
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format provided.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server Error', details: error.message });
  }
};

// @desc    Faculty rejects a gate pass
// @route   PUT /api/gatepass/faculty/reject/:id
// @access  Private (Faculty)
exports.facultyRejectGatePass = async (req, res) => {
    try {
        const pass = await GatePass.findById(req.params.id).populate('student_id', 'fullName');

        if (!pass) {
            return res.status(404).json({ success: false, message: 'Gate pass not found' });
        }

        if (pass.faculty_status !== 'PENDING' || pass.faculty_approver_id.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized or pass not in correct status for faculty rejection.' });
        }

        pass.faculty_status = 'REJECTED';
        await pass.save();

        // Log faculty rejection in AuditLog
        await AuditLog.create({
            pass_id: pass._id,
            event_type: 'Rejected',
            actor_role: 'faculty',
            actor_id: req.user.id,
            event_details: {
                status_change: 'faculty_status: PENDING -> REJECTED',
                rejection_reason: req.body.rejectionReason || 'No reason provided',
            },
        });

        // Emit Socket.IO event for frontend update
        if (req.io && req.userSocketMap.has(pass.student_id._id.toString())) {
            req.io.to(pass.student_id._id.toString()).emit('statusUpdate:gatePass', {
                recordId: pass._id,
                newStatus: pass.faculty_status,
                userId: pass.student_id._id,
                eventType: 'GATEPASS_FACULTY_REJECTED',
                faculty_approver_id: req.user.id,
                rejection_reason: req.body.rejectionReason
            });
        }

        await sendNotification(
            pass.student_id,
            `Your Gate Pass to ${pass.destination} has been REJECTED by your faculty.`, 
            'Gate Pass Rejected'
        );

        res.status(200).json({ success: true, data: pass });
    } catch (error) {
        console.error('Error in facultyRejectGatePass:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    HOD approves/finalizes a gate pass
// @route   PUT /api/gatepass/hod/approve/:id
// @access  Private (HOD)
exports.hodApproveGatePass = async (req, res) => {
  try {
    const pass = await GatePass.findById(req.params.id).populate('student_id', 'fullName');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Gate pass not found' });
    }

    // Check if the HOD is authorized to approve this pass
    const isHODofDepartment = req.user.department.toString() === pass.department_id.toString();
    const isAssignedHOD = pass.hod_approver_id && pass.hod_approver_id.toString() === req.user.id;
    const isDirectHODApproval = !pass.hod_approver_id && pass.faculty_approver_id.toString() === req.user.id && pass.faculty_status === 'APPROVED';

    if (!isHODofDepartment || (!isAssignedHOD && !isDirectHODApproval)) {
        return res.status(401).json({ success: false, message: 'Not authorized to approve this pass.' });
    }

    // Ensure the pass is in a state ready for HOD approval
    if (pass.hod_status !== 'PENDING' || (pass.faculty_status !== 'APPROVED' && !isDirectHODApproval)) {
        return res.status(400).json({ success: false, message: 'Pass not in correct status for HOD approval.' });
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
        pass_id: pass._id,
        event_type: 'Approved',
        actor_role: 'HOD',
        actor_id: req.user.id,
        event_details: {
            status_change: 'hod_status: PENDING -> APPROVED',
            qr_code_generated: true,
            one_time_pin_generated: true,
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
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    HOD rejects a gate pass
// @route   PUT /api/gatepass/hod/reject/:id
// @access  Private (HOD)
exports.hodRejectGatePass = async (req, res) => {
    try {
        const pass = await GatePass.findById(req.params.id).populate('student_id', 'fullName');

        if (!pass) {
            return res.status(404).json({ success: false, message: 'Gate pass not found' });
        }

        const isHODofDepartment = req.user.department.toString() === pass.department_id.toString();
        const isAssignedHOD = pass.hod_approver_id && pass.hod_approver_id.toString() === req.user.id;
        const isDirectHODApproval = !pass.hod_approver_id && pass.faculty_approver_id.toString() === req.user.id && pass.faculty_status === 'APPROVED';

        if (!isHODofDepartment || (!isAssignedHOD && !isDirectHODApproval)) {
            return res.status(401).json({ success: false, message: 'Not authorized to reject this pass.' });
        }

        if (pass.hod_status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'Pass not in correct status for HOD rejection.' });
        }

        pass.hod_status = 'REJECTED';
        await pass.save();

        // Log HOD rejection in AuditLog
        await AuditLog.create({
            pass_id: pass._id,
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
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Log a late return for a gate pass
// @route   POST /api/gatepass/log-late-return
// @access  Private (Security)
exports.logLateReturn = async (req, res) => {
    const { gatePassId, scanLocation, remarks } = req.body;
    const securityId = req.user.id;

    try {
        if (!gatePassId) {
            return res.status(400).json({ success: false, message: 'Gate Pass ID is required.' });
        }

        const gatePass = await GatePass.findById(gatePassId).populate('student_id', 'fullName');
        if (!gatePass) {
            return res.status(404).json({ success: false, message: 'Gate Pass not found.' });
        }

        // Ensure the gate pass was approved and is not already marked as late
        if (gatePass.hod_status !== 'APPROVED') {
            return res.status(400).json({ success: false, message: 'Gate Pass was not approved or is not valid for late return logging.' });
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
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get gate pass history for a student
// @route   GET /api/gatepass/student/history
// @access  Private (Student)
exports.getStudentGatePassHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const historyPasses = await GatePass.find({ student_id: studentId })
      .populate('faculty_approver_id', 'fullName')
      .populate('hod_approver_id', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: historyPasses });
  } catch (error) {
    console.error('Error fetching student gate pass history:', error);
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

// @desc    Get pending gate passes for HOD approval
// @route   GET /api/gatepass/hod/pending
// @access  Private (HOD)
exports.getPendingHODApprovals = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) {
      return res.status(400).json({ success: false, message: 'HOD user does not have a department assigned.' });
    }

    const pendingPasses = await GatePass.find({
      department_id: department,
      faculty_status: 'APPROVED',
      hod_status: 'PENDING',
    })
      .populate('student_id', 'fullName studentId')
      .populate('faculty_approver_id', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: pendingPasses });
  } catch (error) {
    console.error('Error fetching pending HOD approvals:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get gate pass statistics for a faculty member
// @route   GET /api/gatepass/faculty/stats
// @access  Private (Faculty)
exports.getFacultyGatePassStats = async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
