const SpecialPass = require('../models/SpecialPass'); // D1
const AuditLog = require('../models/AuditLog'); // D2
const Student = require('../models/student'); // To get student's department
const { validatePassToken, generateToken } = require('../config/jwt'); // From Task 3 and generateToken
const { logAuditAttempt } = require('../services/auditService'); // Task 5 (Logging)
const { sendNotification, sendPassUsedNotification } = require('../services/notificationService'); // Task 6 (Notification) and general notifications
const { generateThreeDigitOTP } = require('../utils/otpUtils'); // Import OTP utility
const { verifyOTPPass } = require('../services/verificationService'); // Import OTP verification service

exports.getStudentSpecialPasses = async (req, res) => {
    const studentId = req.user.id; 
    
    // 🐛 DEBUG 1: Log immediately to confirm the updated code is running
    console.log(`\n\n🔴 DEBUG START: Fetching Special Passes for ID: ${studentId}`);
    
    try {
        const passes = await SpecialPass.find({ student_id: studentId })
            .populate('student_id', 'studentId fullName department')
            .populate('hod_approver_id', 'fullName')
            .sort({ requested_at: -1 });

        // 🐛 DEBUG 2: Log the query results
        console.log(`🔴 DEBUG RESULT: Fetched ${passes.length} passes.`);
        if (passes.length > 0) {
            // Log the critical fields for the first pass
            console.log("🔴 DEBUG PASS 1: _id:", passes[0]._id, "Status:", passes[0].status, "Requested_at:", passes[0].requested_at);
        }
        console.log("🔴 DEBUG END\n");

        res.status(200).json({ success: true, data: passes });
    } catch (error) {
        console.error('Error fetching student special passes:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.createSpecialPassRequest = async (req, res) => {
    // 🔑 STEP 1: Ensure the two new time fields are correctly destructured
    const { 
        pass_type, 
        request_reason, 
        date_required, 
        start_time, // <--- New start time
        end_time,   // <--- New end time
        is_one_time_use 
    } = req.body;
    
    const studentId = req.user.id;

    try {
        // Fetch student to get department_id
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // 🔑 STEP 2: Combine Date and Time Strings and check for validity
        if (!date_required || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Missing required date or time inputs.' });
        }

        // Combine the strings into the ISO 8601 format (YYYY-MM-DDTHH:MM:SS.sssZ)
        // By adding ':00.000Z', we explicitly save the time slot in UTC.
        const dateValidFrom = new Date(`${date_required}T${start_time}:00.000Z`); 
        const dateValidTo = new Date(`${date_required}T${end_time}:00.000Z`); 
        
        // Final sanity check for date object validity
        if (isNaN(dateValidFrom.getTime()) || isNaN(dateValidTo.getTime()) || dateValidFrom >= dateValidTo) {
             console.error(`Invalid Date/Time Calculation: From=${dateValidFrom}, To=${dateValidTo}`);
             return res.status(400).json({ success: false, message: 'Invalid date or time slot. Please check your inputs.' });
        }
        
        // 🔑 STEP 3: Create new SpecialPass with the calculated dates
        const newPass = new SpecialPass({
            pass_type,
            student_id: studentId,
            department: student.department,
            request_reason,
            date_valid_from: dateValidFrom, // Use calculated Date object
            date_valid_to: dateValidTo,     // Use calculated Date object
            is_one_time_use: is_one_time_use || false,
            status: 'Pending',
            requires_qr_scan: !(['ID Lost', 'Improper Uniform'].includes(pass_type)),
            requested_at: new Date()
        });

        await newPass.save();

        // Log audit event (DFD 2.0)
        await AuditLog.create({
            pass_id: newPass._id,
            event_type: 'Request',
            actor_role: 'Student',
            actor_id: studentId,
            event_details: { request_reason: request_reason, pass_type: pass_type },
            timestamp: new Date()
        });

        // Send notification to relevant HOD (DFD 2.0)
        // This would typically involve finding the HODs for the department and sending them a notification
        // For now, a placeholder notification to the student themselves or a generic message.
        await sendNotification(studentId, 'Your special pass request has been submitted for HOD review.', 'Pass Request Submitted');

        res.status(201).json({
            success: true,
            message: 'Special pass request submitted successfully.',
            pass: newPass
        });

    } catch (error) {
        console.error('Error creating special pass request (Backend Failure):', error);
        // 🔑 CHANGE: Return a more specific error than just "Internal server error."
        return res.status(500).json({ success: false, message: 'Failed to process request due to internal error.' });
    }
};

exports.createOverridePass = async (req, res) => {
    const { studentId, request_reason, duration_minutes } = req.body;
    const supervisorId = req.user.id; // Attached by auth middleware

    try {
        // 1. Pre-Check: Mandatory Reason (DFD 6.3)
        if (!request_reason || request_reason.length < 10) {
            await AuditLog.create({
                event_type: 'Override Attempt Failed',
                actor_role: 'Security Supervisor',
                actor_id: supervisorId,
                event_details: { reason: 'Mandatory reason missing or too short.', mfaStatus: req.user.mfa_status },
                timestamp: new Date()
            });
            return res.status(400).json({ success: false, message: "Mandatory reason for override must be provided and be at least 10 characters long." });
        }

        // Fetch student to get department
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // 2. Calculate Validity (DFD 6.3)
        const dateValidFrom = new Date();
        const dateValidTo = new Date(dateValidFrom.getTime() + duration_minutes * 60000); // Minutes to milliseconds

        // DFD 6.3: Create Override Pass
        const newPass = new SpecialPass({
            pass_type: 'Emergency Override',
            student_id: studentId,
            department: student.department,
            request_reason: request_reason, // Mandatory reason
            hod_approver_id: supervisorId, // Supervisor acts as approver
            date_valid_from: dateValidFrom, // Starts now
            date_valid_to: dateValidTo,
            is_one_time_use: true, // Always true for override passes
            requires_qr_scan: true, // Always true for override passes
            status: 'Override - Active',
            requested_at: new Date(),
            approved_at: new Date(),
            bypass_flag: true // Set bypass flag
        });

        const savedPass = await newPass.save();

        // DFD 6.4: Generate QR Code
        const qrCodeJwt = generateToken(
            {
                pass_id: savedPass._id,
                student_id: savedPass.student_id,
                pass_type: savedPass.pass_type,
                bypass_flag: savedPass.bypass_flag,
                // Add other necessary data for verification
            },
            process.env.PASS_TOKEN_SECRET,
            '1h' // Example: 1 hour expiry for the JWT itself
        );

        // Update D1 with the JWT for persistence
        await SpecialPass.updateOne({ _id: savedPass._id }, { qr_code_jwt: qrCodeJwt });

        // Generate and store OTP
        const otp = generateThreeDigitOTP();
        await SpecialPass.updateOne({ _id: savedPass._id }, { verification_otp: otp });

        // DFD 6.5: Log & Finalize
        await AuditLog.create({
            pass_id: savedPass._id,
            event_type: 'Override Issued',
            actor_role: 'Security Supervisor',
            actor_id: supervisorId,
            event_details: { reason: request_reason, mfaStatus: req.user.mfa_status, otp: otp }, // Log OTP for audit
            timestamp: new Date()
        });

        // Notify student
        await sendNotification(studentId, 'An emergency override pass has been issued for you.', 'Emergency Pass Issued');

        // DFD 6.6: Display Override Pass
        res.status(201).json({
            success: true,
            message: 'Emergency override pass issued successfully.',
            pass: savedPass,
            qrCodeJwt: qrCodeJwt, // Return the generated QR Code JWT
            otp: otp // Return the generated OTP
        });

    } catch (error) {
        console.error('Error creating override pass:', error);
        await AuditLog.create({
            event_type: 'Override Issue Error',
            actor_role: 'Security Supervisor',
            actor_id: supervisorId,
            event_details: { error: error.message, mfaStatus: req.user.mfa_status },
            timestamp: new Date()
        });
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.verifyPass = async (req, res) => {
    const { qr_token, scan_location, student_id, verification_otp } = req.body; 
    const securityUser = req.user; // Attached by Task 1 Middleware

    // Add scan_location to securityUser for logging purposes
    securityUser.scan_location = scan_location;

    let verificationResult = { isValid: false, reason: 'Invalid input.' };
    let pass = null;
    let verificationMethod = 'Unknown';

    // DFD 5.2: Check Input Method & Parse
    if (qr_token) {
        verificationMethod = 'QR Code';
        verificationResult = validatePassToken(qr_token);
        if (verificationResult.isValid) {
            pass = await SpecialPass.findById(verificationResult.payload.pass_id)
                .populate('student_id', 'fullName studentId')
                .populate('hod_approver_id', 'fullName');
        }
    } else if (student_id && verification_otp) { 
        verificationMethod = 'Student ID + OTP Fallback';
        
        // 🔑 PASS BOTH: Call the service with the input Student ID string and OTP
        verificationResult = await verifyOTPPass(student_id, verification_otp); 

        if (verificationResult.isValid) {
            // The service returns the found pass, now re-fetch and populate
            pass = await SpecialPass.findById(verificationResult.pass._id)
                .populate('student_id', 'fullName studentId') // 🔑 Ensure 'studentId' is populated
                .populate('hod_approver_id', 'fullName');
        }
    } else { // 🔑 FAILURE: Missing QR token OR (Student ID and OTP)
        await logAuditAttempt('Unknown', 'Verified', securityUser, 'FAILED: Missing QR token or Student ID/OTP.');
        return res.status(400).json({
            is_valid: false,
            display_status: "INPUT REQUIRED",
            message: 'Missing QR token or both Student ID and OTP for verification.',
            pass_details: {}
        });
    }

    // Handle invalid verification result (from either QR or OTP path)
    if (!verificationResult.isValid || !pass) {
        const logPassId = verificationResult.payload?.pass_id || 'Unknown'; 
        await logAuditAttempt(logPassId, 'Verified', securityUser, `FAILED (${verificationMethod}): ${verificationResult.reason || 'Pass not found or invalid.'}`);
        return res.status(200).json({
            is_valid: false,
            display_status: "ENTRY DENIED",
            message: `Pass verification failed: ${verificationResult.reason || 'Pass not found or invalid.'}`,
            pass_details: {}
        });
    }

    // --- ADDED: Duplicate Verification Check ---
    const sixtySecondsAgo = new Date(Date.now() - 60000);
    const recentVerification = await AuditLog.findOne({
        pass_id: pass._id,
        event_type: 'Verified',
        timestamp: { $gte: sixtySecondsAgo },
        'event_details.result': { $regex: /^SUCCESS/ }
    });

    if (recentVerification) {
        await logAuditAttempt(pass._id, 'Verified', securityUser, `FAILED (${verificationMethod}): Duplicate scan attempted within 60 seconds.`);
        return res.status(200).json({
            is_valid: false,
            display_status: "DUPLICATE SCAN",
            message: "This pass was already successfully verified within the last minute.",
            pass_details: {
                student_name: pass.student_id ? pass.student_id.fullName : 'N/A',
                pass_type: pass.pass_type,
            }
        });
    }

    // --- 2. Database Status Check (DFD 5.3) ---
    // This logic now applies after either QR or OTP validation has provided a valid 'pass' object
    if (pass.status !== 'Approved' && pass.status !== 'Override - Active') {
        const statusReason = `Status is ${pass.status}`;
        
        // Log failure (Task 5)
        await logAuditAttempt(pass._id, 'Verified', securityUser, `FAILED (${verificationMethod}): ${statusReason}`);

        return res.status(200).json({
            is_valid: false,
            display_status: "ENTRY DENIED",
            message: `Pass ${statusReason}`,
            pass_details: {}
        });
    }

    // --- 3. SUCCESS: Finalize Pass & Notify (DFD 5.5) ---
    let finalStatus = 'ENTRY GRANTED';
    if (pass.is_one_time_use) {
        // Update D1 to 'Used' and set final message
        await SpecialPass.updateOne({ _id: pass._id }, { status: 'Used' });
        await sendPassUsedNotification(pass); // Trigger notification service (Task 6)
        finalStatus = 'PASS USED';
    }

    // --- 4. Log Success (DFD 5.4) ---
    const auditDetails = {
        student_name: pass.student_id ? pass.student_id.fullName : 'N/A',
        pass_type: pass.pass_type
    };
    await logAuditAttempt(pass._id, 'Verified', securityUser, `SUCCESS (${verificationMethod}): ${finalStatus}`, auditDetails);
    
    // --- 5. Response Formatting (DFD 5.6) ---
    const response = {
        is_valid: true,
        display_status: finalStatus, // 'ENTRY GRANTED' or 'PASS USED'
        message: 'Pass validated successfully.',
        // IMPORTANT: Only return non-sensitive fields for Security dashboard
        pass_details: {
            pass_id: pass._id,
            student_id: pass.student_id ? pass.student_id.studentId : 'N/A',
            student_name: pass.student_id ? pass.student_id.fullName : 'N/A',
            pass_type: pass.pass_type,
            hod_approver_name: pass.hod_approver_id ? pass.hod_approver_id.fullName : 'N/A',
            date_valid_to: pass.date_valid_to
        }
    };

    req.io.emit('new-pass-verified', response);
    return res.status(200).json(response);
};