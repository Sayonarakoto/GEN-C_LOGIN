const SpecialPass = require('../models/SpecialPass');
const Student = require('../models/student'); // 🔑 NEW: Import Student Model

/**
 * Verifies a special pass using the Student's Human-Readable ID and OTP.
 * @param {string} inputStudentIdString - The Student's Human-Readable ID (e.g., '4455').
 * @param {string} otp - The 3-digit OTP.
 * @returns {object} - An object containing isValid (boolean) and the pass object if valid.
 */
exports.verifyOTPPass = async (inputStudentIdString, otp) => {
    console.log(`[verifyOTPPass] Input: studentIdString=${inputStudentIdString}, otp=${otp}`); // DEBUG
    try {
        // 1. 🔑 Find the Student's MongoDB ObjectId using their human-readable ID
        const student = await Student.findOne({ studentId: inputStudentIdString });
        console.log(`[verifyOTPPass] Student lookup result: ${student ? student._id : 'Not found'}`); // DEBUG

        if (!student) {
            return { isValid: false, reason: 'Student ID not found.' };
        }
        
        const studentObjectId = student._id;
        console.log(`[verifyOTPPass] Found studentObjectId: ${studentObjectId}`); // DEBUG

        // 2. Search for the Pass using the Student's ObjectId and the OTP
        const passQuery = {
            student_id: studentObjectId, // <-- Search by the correct MongoDB ObjectId
            verification_otp: otp,
            status: { $in: ['Approved', 'Override - Active'] } 
        };
        console.log(`[verifyOTPPass] SpecialPass query: ${JSON.stringify(passQuery)}`); // DEBUG
        const pass = await SpecialPass.findOne(passQuery);
        console.log(`[verifyOTPPass] SpecialPass lookup result: ${pass ? pass._id : 'Not found'}`); // DEBUG

        if (!pass) {
            return { isValid: false, reason: 'No active pass found for the provided Student ID and OTP.' };
        }

        // --- Standard Validity Checks ---
        if (pass.date_valid_to < new Date()) {
            console.log(`[verifyOTPPass] Pass expired: ${pass._id}`); // DEBUG
            return { isValid: false, reason: 'Pass expired.' };
        }
        if (pass.is_one_time_use && pass.status === 'Used') {
            console.log(`[verifyOTPPass] Pass already used: ${pass._id}`); // DEBUG
            return { isValid: false, reason: 'Pass already used.' };
        }

        console.log(`[verifyOTPPass] Pass valid: ${pass._id}`); // DEBUG
        return { isValid: true, pass: pass };

    } catch (error) {
        console.error('[verifyOTPPass] Error verifying OTP pass:', error);
        return { isValid: false, reason: 'Internal server error.' };
    }
};
