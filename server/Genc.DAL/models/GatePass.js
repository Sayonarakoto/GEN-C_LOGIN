const mongoose = require('mongoose');

const GatePassSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    faculty_approver_id: { // Renamed from approved_by_faculty_id
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        default: null
    },
    hod_approver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        default: null
    },
    destination: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    pass_type: {
        type: String,
        default: 'Gate Pass'
    },
    faculty_status: { // New field for Level 1 approval
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'USED'],
        default: 'PENDING'
    },
    hod_status: { // New field for Level 2 approval
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'USED'],
        default: 'PENDING'
    },
    qr_code_id: { // Renamed from qr_token
        type: String
    },
    one_time_pin: { // Renamed from verification_otp
        type: String,
    },
    date_valid_from: {
        type: Date,
        required: true
    },
    date_valid_to: {
        type: Date
    },
    department_id: {
        type: String,
        required: true
    },
    hod_comment: {
        type: String
    },
    pdf_path: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('GatePass', GatePassSchema);