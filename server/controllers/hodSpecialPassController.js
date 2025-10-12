const { generateWatermarkedPDF } = require('../services/pdfGenerationService');
const Faculty = require('../models/Faculty');
const SpecialPass = require('../models/SpecialPass');
const Student = require('../models/student');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../config/jwt'); // Reusing generateToken
const { sendNotification } = require('../services/notificationService'); // Placeholder for notification service
const { generateThreeDigitOTP } = require('../utils/otpUtils'); // Import OTP utility
const { schedulePassCleanup } = require('../services/schedulerService'); // Import scheduler service

exports.getPendingSpecialPasses = async (req, res) => {
    // This value is 'CT' from the JWT
    const department = req.user.department; 

    // Add this new debug line
    console.log(`DEBUG: HOD Special Pass Query - Searching for Dept: '${department}', Status: 'Pending'`);

    try {
        const pendingPasses = await SpecialPass.find({
            department: new RegExp(`^${department}$`, 'i'), 
            status: 'Pending'
        })
        .populate('student_id', 'studentId fullName year')
        .populate('hod_approver_id', 'fullName') 
        .sort({ requested_at: -1 }); 

        // Add this final debug line
        console.log(`DEBUG: HOD Special Pass Query - Found ${pendingPasses.length} requests.`);

        res.status(200).json({ success: true, data: pendingPasses });
    } catch (error) {
        console.error('CRITICAL ERROR fetching HOD special passes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending requests.' });
    }
};

exports.approveSpecialPass = async (req, res) => {
  const { passId } = req.params;
  const { hodComment } = req.body;
  const hodId = req.user.id; // Assuming HOD ID is attached by auth middleware

  try {
    // The user's suggestion to use .lean() is good, but we need a mongoose document to .save(), so I will fetch the full document.
    const pass = await SpecialPass.findById(passId).populate('student_id', 'studentId fullName');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Special Pass not found.' });
    }

    if (pass.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Pass is already ${pass.status}.` });
    }

    // Update pass status and common fields first
    pass.status = 'Approved';
    pass.hod_approver_id = hodId;
    pass.hod_comment = hodComment;
    pass.approved_at = new Date();

    // Generate OTP (always generate for approved passes)
    const otp = generateThreeDigitOTP();
    pass.verification_otp = otp; // Critical: Pass now has the OTP

    // **CRITICAL CONDITIONAL LOGIC**
    if (pass.requires_qr_scan) {
        
        // --- STEP 1: GENERATE & ASSIGN VERIFICATION ASSETS ---
        
        // 1A. Generate QR Code (JWT)
        const qrCodeJwt = generateToken(
          { pass_id: pass._id, student_id: pass.student_id, pass_type: pass.pass_type, },
          process.env.PASS_TOKEN_SECRET,
          '1h'
        );
        pass.qr_code_jwt = qrCodeJwt; // 🔑 Critical: Pass now has the JWT

        // --- STEP 2: GENERATE PDF (NOW IT HAS ALL DATA) ---

        // Fetch HOD's full name for the watermark
        const hod = await Faculty.findById(hodId);
        const hodName = hod ? hod.fullName : 'Unknown HOD';
        
        // 2. Generate PDF (The 'pass' object now contains qr_code_jwt and verification_otp)
        pass.qr_code_id = pass.qr_code_jwt;
        pass.one_time_pin = pass.verification_otp;
        const pdfResult = await generateWatermarkedPDF(pass, hodName); 
        if (pdfResult.success) {
          pass.pdf_path = pdfResult.filePath;
        } else {
          console.error('Failed to generate PDF:', pdfResult.error);
        }
    } else {
        // --- STEP B: INTERNAL EXEMPTION (No QR/OTP) ---
        // The status is already 'Approved'. The user suggested 'Approved (Internal)' but that would require a schema change.
        pass.qr_code_jwt = null;
        pass.pdf_path = null;
        // OTP is now always generated, so no need to null it here
    }

    await pass.save(); // Save the final updates

    // Log audit event
    await AuditLog.create({
      pass_id: pass._id,
      event_type: 'Approved',
      actor_role: 'HOD',
      actor_id: hodId,
      event_details: { 
        hodComment: hodComment, 
        otp: pass.verification_otp, // will be null for internal passes
        pdfPath: pass.pdf_path, // will be null for internal passes
        requires_qr_scan: pass.requires_qr_scan 
      },
      timestamp: new Date()
    });

    // Send notification to student
    await sendNotification(pass.student_id, 'Your special pass has been approved!', 'Pass Approved');

    // Conditionally build the response
    const responsePayload = {
      success: true,
      message: 'Special Pass approved successfully.',
      pass: pass,
    };

    if (pass.requires_qr_scan) {
      responsePayload.qrCodeJwt = pass.qr_code_jwt;
      responsePayload.otp = pass.verification_otp;
      responsePayload.pdfPath = pass.pdf_path;
    }

    res.status(200).json(responsePayload);

  } catch (error) {
    console.error('Error approving special pass:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.rejectSpecialPass = async (req, res) => {
  const { passId } = req.params;
  const { hodComment } = req.body;
  const hodId = req.user.id; // Assuming HOD ID is attached by auth middleware

  try {
    const pass = await SpecialPass.findById(passId).populate('student_id', 'studentId fullName');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Special Pass not found.' });
    }

    if (pass.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Pass is already ${pass.status}.` });
    }

    // Update pass status to Rejected
    pass.status = 'Rejected';
    pass.hod_approver_id = hodId;
    pass.hod_comment = hodComment;
    pass.approved_at = new Date(); // Or rejected_at if we add that field
    pass.is_finalized = true; // Mark as finalized

    await pass.save();

    // Schedule cleanup for rejected pass (e.g., 24 hours from now)
    const cleanupTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    await schedulePassCleanup(pass._id, cleanupTime);

    // Log audit event
    await AuditLog.create({
      pass_id: pass._id,
      event_type: 'Rejected',
      actor_role: 'HOD',
      actor_id: hodId,
      event_details: { hodComment: hodComment },
      timestamp: new Date()
    });

    // Send notification to student
    await sendNotification(pass.student_id, 'Your special pass has been rejected.', 'Pass Rejected');

    res.status(200).json({
      success: true,
      message: 'Special Pass rejected successfully.',
      pass: pass
    });

  } catch (error) {
    console.error('Error rejecting special pass:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.initiateSpecialPass = async (req, res) => { // This is the function for the /initiate endpoint
    console.log('DEBUG: initiateSpecialPass - Start');
    console.log('DEBUG: req.body:', req.body);
    // 🔑 STEP 1: Destructure the expected fields from the HOD form
    const {
        student_id,
        pass_type = 'HOD Initiated', // Provide a default value for now
        request_reason = 'Initiated by HOD',
        date_required,
        start_time,
        end_time
    } = req.body;

    const hodId = req.user.id; // The HOD is the one initiating and approving

    try {
        console.log('DEBUG: initiateSpecialPass - Before Student.findById');
        // Find the student by their MongoDB _id
        const student = await Student.findById(student_id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // 🔑 STEP 2: Calculate Valid Dates (Copied from the working logic)
        const dateValidFrom = new Date(`${date_required}T${start_time}:00`);
        const dateValidTo = new Date(`${date_required}T${end_time}:00`);

        if (isNaN(dateValidFrom.getTime()) || isNaN(dateValidTo.getTime()) || dateValidFrom >= dateValidTo) {
             return res.status(400).json({ success: false, message: 'Invalid date or time slot calculation.' });
        }

        // 🔑 STEP 3: Create the Pass (Since HOD initiates, it's immediately Approved)
        const newPass = new SpecialPass({
            pass_type,
            student_id: student._id, // Use the MongoDB ID
            department: student.department,
            request_reason,
            hod_approver_id: hodId,
            date_valid_from: dateValidFrom,
            date_valid_to: dateValidTo,
            is_one_time_use: false,
            requires_qr_scan: true,
            status: 'Approved', // Immediate approval by HOD
            requested_at: new Date(),
            approved_at: new Date()
        });

        // Populate student_id to ensure studentId is available for PDF generation
        await newPass.populate('student_id', 'studentId fullName');

        // 🔑 STEP 4: Generate QR/OTP (Crucial Step!)
        const qrCodeJwt = generateToken(
            { pass_id: newPass._id, student_id: newPass.student_id, pass_type: newPass.pass_type, },
            process.env.PASS_TOKEN_SECRET,
            '1h'
        );
        newPass.qr_code_jwt = qrCodeJwt;

        const otp = generateThreeDigitOTP();
        newPass.verification_otp = otp;

        // Fetch HOD's full name for the watermark
        const hod = await Faculty.findById(hodId);
        const hodName = hod ? hod.fullName : 'Unknown HOD';

        // Generate PDF
        newPass.qr_code_id = newPass.qr_code_jwt;
        newPass.one_time_pin = newPass.verification_otp;
        const pdfResult = await generateWatermarkedPDF(newPass, hodName);
        if (pdfResult.success) {
          newPass.pdf_path = pdfResult.filePath;
        } else {
          console.error('Failed to generate PDF:', pdfResult.error);
        }

        await newPass.save();

        // Log audit event
        await AuditLog.create({
          pass_id: newPass._id,
          event_type: 'Initiated',
          actor_role: 'HOD',
          actor_id: hodId,
          event_details: {
            request_reason: request_reason,
            otp: newPass.verification_otp,
            pdfPath: newPass.pdf_path,
            requires_qr_scan: newPass.requires_qr_scan
          },
          timestamp: new Date()
        });

        // Send notification to student
        await sendNotification(student._id, 'A special pass has been initiated for you by your HOD.', 'Pass Initiated');

        res.status(201).json({
            success: true,
            message: 'Pass initiated and approved successfully.',
            pass: newPass,
            qr_token: qrCodeJwt // Return token for the modal display
        });

    } catch (error) {
        console.error('Error initiating special pass (HOD):', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getSpecialPassHistory = async (req, res) => {
    const department = req.user.department;
    console.log(`DEBUG: HOD Special Pass History - Searching for Dept: '${department}', Status: ['Approved', 'Rejected']`);

    try {
        const historyPasses = await SpecialPass.find({
            department: department,
            status: { $in: ['Approved', 'Rejected'] }
        })
        .populate('student_id', 'studentId fullName year')
        .populate('hod_approver_id', 'fullName')
        .sort({ approved_at: -1, requested_at: -1 });

        console.log(`DEBUG: HOD Special Pass History - Found ${historyPasses.length} requests.`);

        res.status(200).json({ success: true, data: historyPasses });
    } catch (error) {
        console.error('CRITICAL ERROR fetching HOD special pass history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pass history.' });
    }
};

module.exports = {
    getPendingSpecialPasses: exports.getPendingSpecialPasses,
    approveSpecialPass: exports.approveSpecialPass,
    rejectSpecialPass: exports.rejectSpecialPass,
    initiateSpecialPass: exports.initiateSpecialPass,
    getSpecialPassHistory: exports.getSpecialPassHistory
};

exports.getSpecialPassHistory = async (req, res) => {
    const department = req.user.department;
    console.log(`DEBUG: HOD Special Pass History - Searching for Dept: '${department}', Status: ['Approved', 'Rejected']`);

    try {
        const historyPasses = await SpecialPass.find({
            department: department,
            status: { $in: ['Approved', 'Rejected'] }
        })
        .populate('student_id', 'studentId fullName year')
        .populate('hod_approver_id', 'fullName')
        .sort({ approved_at: -1, requested_at: -1 });

        console.log(`DEBUG: HOD Special Pass History - Found ${historyPasses.length} requests.`);

        res.status(200).json({ success: true, data: historyPasses });
    } catch (error) {
        console.error('CRITICAL ERROR fetching HOD special pass history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pass history.' });
    }
};