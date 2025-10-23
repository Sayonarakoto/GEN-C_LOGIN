
const mongoose = require('mongoose');

const GatePassQRSchema = new mongoose.Schema({
    gatepass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GatePass',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '1d' // Automatically delete after 24 hours
    },
    status: {
        type: String,
        enum: ['active', 'used', 'revoked', 'expired'],
        default: 'active'
    }
});

const GatePassQR = mongoose.model('GatePassQR', GatePassQRSchema);

module.exports = GatePassQR;
