const SpecialPass = require('../models/SpecialPass');
const GatePass = require('../models/GatePass'); // Import GatePass Model
const Student = require('../models/student'); // 🔑 NEW: Import Student Model
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const settingsService = require('./settingsService');

/**
 * Gate passes stop being verifiable once the check-in window has closed:
 * now > date_valid_from + gatePassExtraMinutes.
 * @param {object} pass - GatePass document
 * @returns {string|null} Human readable reason, or null when still inside the window
 */
function gatePassCheckinWindowExpired(pass) {
    if (!pass || !pass.date_valid_from) return null;

    const extraMinutes = Number.isInteger(settingsService.getSettings().gatePassExtraMinutes)
        ? settingsService.getSettings().gatePassExtraMinutes
        : 10;

    const validUntilMs = new Date(pass.date_valid_from).getTime() + extraMinutes * 60000;
    if (Date.now() > validUntilMs) {
        const checkInLabel = new Date(pass.date_valid_from).toLocaleString();
        return `Pass expired: check-in window closed. QR/OTP were valid until ${checkInLabel} plus ${extraMinutes} minutes.`;
    }
    return null;
}

/**
 * Older PDFs encoded the QR as plain JSON instead of a JWT.
 * @param {string} token - Scanned QR content
 * @returns {object|null} Decoded payload or null when the value is not usable
 */
function decodeLegacyQrPayload(token) {
    if (typeof token !== 'string' || !token.trim().startsWith('{')) return null;
    try {
        const parsed = JSON.parse(token);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
        return null;
    }
}

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
            return { isValid: false, reason: 'This pass type cannot be verified here.' };
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
        const now = new Date();
        if (pass.date_valid_from && now < pass.date_valid_from) {
            return { isValid: false, reason: 'Pass is not yet valid.' };
        }
        if (pass.date_valid_to && pass.date_valid_to < now) {
            return { isValid: false, reason: 'Pass expired.' };
        }

        if (passType === 'gate') {
            const windowExpired = gatePassCheckinWindowExpired(pass);
            if (windowExpired) {
                return { isValid: false, reason: windowExpired, code: 'EXPIRED' };
            }
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
        return { isValid: false, reason: 'Something went wrong while checking this pass. Please try again.' };
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
        let decoded = null;
        try {
            decoded = jwt.verify(qr_token, process.env.PASS_TOKEN_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return { isValid: false, reason: 'Pass expired: QR code has expired.', code: 'EXPIRED' };
            }
            // Printed PDFs used to encode plain JSON instead of a JWT - still accept them
            decoded = decodeLegacyQrPayload(qr_token);
            if (!decoded) {
                return { isValid: false, reason: 'Invalid QR code.', code: 'INVALID' };
            }
        }

        // Gate passes use `passId`, special passes use `pass_id`, legacy PDFs use `id`
        const passId = decoded.passId || decoded.pass_id || decoded.id;
        if (!passId || !mongoose.Types.ObjectId.isValid(String(passId))) {
            return { isValid: false, reason: 'Invalid QR code.', code: 'INVALID' };
        }

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
            return { isValid: false, reason: 'This pass type cannot be verified here.' };
        }

        const pass = await passModel.findById(passId);

        if (!pass) {
            return { isValid: false, reason: `${passTypeName} Pass not found.` };
        }

        const allowedStatuses = passType === 'gate' ? ['APPROVED'] : ['Approved', 'Override - Active'];
        if (!allowedStatuses.includes(pass[statusField])) {
            return { isValid: false, reason: `Pass is not approved.`, code: 'NOT_APPROVED' };
        }

        const now = new Date();
        if (pass.date_valid_from && now < pass.date_valid_from) {
            return { isValid: false, reason: 'Pass is not yet valid.', code: 'NOT_YET_VALID' };
        }
        if (pass.date_valid_to && pass.date_valid_to < now) {
            return { isValid: false, reason: 'Pass expired.', code: 'EXPIRED' };
        }

        if (passType === 'gate') {
            const windowExpired = gatePassCheckinWindowExpired(pass);
            if (windowExpired) {
                return { isValid: false, reason: windowExpired, code: 'EXPIRED' };
            }
        }

        if (passType === 'special' && pass.is_one_time_use && pass.status === 'Used') {
            return { isValid: false, reason: 'Special Pass already used.' };
        }

        return { isValid: true, pass: pass };

    } catch (error) {
        console.error('[verifyQRPass] Error verifying QR pass:', error);
        return { isValid: false, reason: 'Something went wrong while checking this pass. Please try again.' };
    }
};