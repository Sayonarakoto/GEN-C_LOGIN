const mongoose = require('mongoose');
const GatePassQR = require('../models/GatePassQR');
const GatePass = require('../models/GatePass');
const Student = require('../models/student');
const auditService = require('../services/auditService');

exports.verifyGatePassWithOtp = async (req, res) => {
    const { id, otp } = req.body;

    if (!id || !otp) {
        return res.status(400).json({ message: 'ID and OTP are required.' });
    }

    try {
        let qrData;

        // Check if the provided ID is a valid MongoDB ObjectId.
        if (mongoose.Types.ObjectId.isValid(id)) {
            // If it is, assume it's a direct passId from a QR scan.
            qrData = await GatePassQR.findById(id);
        } else {
            // If not, assume it's a studentId from manual entry.
            const student = await Student.findOne({ studentId: id });
            if (student) {
                // Find the active QR pass for that student.
                qrData = await GatePassQR.findOne({ student: student._id, status: 'active' });
            } else {
                await auditService.logAuditAttempt(id, 'Verified', req.user, 'Student Not Found');
                return res.status(404).json({ message: `Student with ID ${id} not found.` });
            }
        }

        if (!qrData) {
            await auditService.logAuditAttempt(id, 'Verified', req.user, 'Pass Not Found');
            return res.status(404).json({ message: 'No active gate pass found for the provided ID.' });
        }

        if (qrData.status !== 'active') {
            await auditService.logAuditAttempt(qrData.gatepass, 'Verified', req.user, 'Invalid Status', { status: qrData.status });
            return res.status(400).json({ message: `Pass is not active. Current status: ${qrData.status}` });
        }

        if (qrData.otp !== otp) {
            await auditService.logAuditAttempt(qrData.gatepass, 'Verified', req.user, 'Invalid OTP');
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        const gatePass = await GatePass.findById(qrData.gatepass);

        if (!gatePass) {
            await auditService.logAuditAttempt(qrData.gatepass, 'Verified', req.user, 'Associated Pass Not Found');
            return res.status(404).json({ message: 'Associated gate pass not found.' });
        }

        if (gatePass.hod_status !== 'APPROVED') { // Check against the correct schema field
            await auditService.logAuditAttempt(gatePass._id, 'Verified', req.user, 'Pass Not Approved', { status: gatePass.hod_status });
            return res.status(400).json({ message: `Gate pass is not approved. Current status: ${gatePass.hod_status}` });
        }

        // All checks passed. Update statuses.
        qrData.status = 'used';
        await qrData.save();

        gatePass.hod_status = 'USED'; // Update the correct schema field
        await gatePass.save();

        const student = await Student.findById(gatePass.student_id, 'fullName studentId');

        await auditService.logAuditAttempt(gatePass._id, 'Verified', req.user, 'Success', {
            student_name: student.fullName,
            student_id: student.studentId
        });

        res.status(200).json({
            message: 'Gate pass verified successfully.',
            is_valid: true,
            display_status: "VERIFICATION SUCCESS",
            pass_details: {
                pass_type: 'Gate Pass',
                status: gatePass.hod_status,
                student_name: student ? student.fullName : 'N/A',
                student_id: student ? student.studentId : 'N/A',
                date_valid_to: gatePass.date_valid_to
            }
        });

    } catch (error) {
        console.error('Error verifying gate pass with OTP:', error);
        if (req.user) {
            await auditService.logAuditAttempt(id, 'Verified', req.user, 'Server Error', { error: error.message });
        }
        res.status(500).json({ message: 'Server error during gate pass verification.' });
    }
};