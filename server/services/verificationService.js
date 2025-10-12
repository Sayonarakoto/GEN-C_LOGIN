const SpecialPass = require('../models/SpecialPass');
const GatePass = require('../models/GatePass'); // Import GatePass Model
const Student = require('../models/student'); // 🔑 NEW: Import Student Model
const jwt = require('jsonwebtoken');

/**
 * Verifies a pass (SpecialPass or GatePass) using the Student's Human-Readable ID and OTP.
 * @param {string} inputStudentIdString - The Student's Human-Readable ID (e.g., '4455').
 * @param {string} otp - The 3-digit OTP.
 * @param {string} passType - The type of pass to verify ('special' or 'gate').
 * @returns {object} - An object containing isValid (boolean) and the pass object if valid.
 */
exports.verifyOTPPass = async (inputStudentIdString, otp, passType) => {
    console.log(`[verifyOTPPass] Input: studentIdString=${inputStudentIdString}, otp=${otp}, passType=${passType}`); // DEBUG
    try {
        // 1. 🔑 Find the Student's MongoDB ObjectId using their human-readable ID
        const student = await Student.findOne({ studentId: inputStudentIdString });
        console.log(`[verifyOTPPass] Student lookup result: ${student ? student._id : 'Not found'}`); // DEBUG

        if (!student) {
            return { isValid: false, reason: 'Student ID not found.' };
        }
        
        const studentObjectId = student._id;
        console.log(`[verifyOTPPass] Found studentObjectId: ${studentObjectId}`); // DEBUG

        let passModel;
        let otpFieldName;
        let statusField; // 'status' for SpecialPass, 'hod_status' for GatePass
        let statusValues;
        let passTypeName;

        if (passType === 'special') {
            passModel = SpecialPass;
            otpFieldName = 'verification_otp';
            statusField = 'status';
            statusValues = { $in: ['Approved', 'Override - Active'] };
            passTypeName = 'Special';
        } else if (passType === 'gate') {
            passModel = GatePass;
            otpFieldName = 'one_time_pin';
            statusField = 'hod_status'; // GatePass uses hod_status for final approval
            statusValues = 'APPROVED'; // Assuming 'APPROVED' is the final status for GatePass
            passTypeName = 'Gate';
        } else {
            return { isValid: false, reason: 'Invalid pass type provided.' };
        }

        // 2. Search for the Pass using the Student's ObjectId and the OTP
        const passQuery = {
            student_id: studentObjectId,
            [otpFieldName]: otp,
            [statusField]: statusValues,
        };

        console.log(`[verifyOTPPass] ${passTypeName}Pass query: ${JSON.stringify(passQuery)}`); // DEBUG
        const pass = await passModel.findOne(passQuery);
        console.log(`[verifyOTPPass] ${passTypeName}Pass lookup result: ${pass ? pass._id : 'Not found'}`); // DEBUG

        if (!pass) {
            return { isValid: false, reason: `No active ${passTypeName} Pass found for the provided Student ID and OTP.` };
        }

        // --- Standard Validity Checks ---
        if (pass.date_valid_to && pass.date_valid_to < new Date()) {
            return { isValid: false, reason: 'Pass expired.' };
        }

        // Conditional check for one-time use, only applicable to SpecialPass
        if (passType === 'special' && pass.is_one_time_use && pass.status === 'Used') {
            console.log(`[verifyOTPPass] Special Pass already used: ${pass._id}`); // DEBUG
            return { isValid: false, reason: 'Special Pass already used.' };
        }

        console.log(`[verifyOTPPass] Pass valid: ${pass._id}`); // DEBUG
        return { isValid: true, pass: pass };

    } catch (error) {
        console.error('[verifyOTPPass] Error verifying OTP pass:', error);
        return { isValid: false, reason: 'Internal server error.' };
    }
};

/**
 * Verifies a pass (SpecialPass or GatePass) using a QR token.
 * @param {string} qr_token - The QR token.
 * @param {string} passType - The type of pass to verify ('special' or 'gate').
 * @returns {object} - An object containing isValid (boolean) and the pass object if valid.
 */
exports.verifyQRPass = async (qr_token, passType) => {
    try {
        let decoded;
        try {
            decoded = jwt.verify(qr_token, process.env.PASS_TOKEN_SECRET);
        } catch (error) {
            return { isValid: false, reason: 'Invalid QR Token.' };
        }

        const { passId } = decoded;

        let passModel;
        let statusField;
        let statusValues;
        let passTypeName;

        if (passType === 'special') {
            passModel = SpecialPass;
            statusField = 'status';
            statusValues = { $in: ['Approved', 'Override - Active'] };
            passTypeName = 'Special';
        } else if (passType === 'gate') {
            passModel = GatePass;
            statusField = 'hod_status';
            statusValues = 'APPROVED';
            passTypeName = 'Gate';
        } else {
            return { isValid: false, reason: 'Invalid pass type provided.' };
        }

        const pass = await passModel.findById(passId);

        if (!pass) {
            return { isValid: false, reason: `${passTypeName} Pass not found.` };
        }

        if (pass[statusField] !== 'APPROVED' && pass[statusField] !== 'Override - Active') {
            return { isValid: false, reason: `Pass is not approved.` };
        }

        if (pass.date_valid_to && pass.date_valid_to < new Date()) {
            return { isValid: false, reason: 'Pass expired.' };
        }

        if (passType === 'special' && pass.is_one_time_use && pass.status === 'Used') {
            return { isValid: false, reason: 'Special Pass already used.' };
        }

        return { isValid: true, pass: pass };

    } catch (error) {
        console.error('[verifyQRPass] Error verifying QR pass:', error);
        return { isValid: false, reason: 'Internal server error.' };
    }
};