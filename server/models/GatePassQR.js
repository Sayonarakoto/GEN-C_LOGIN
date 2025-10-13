
const mongoose = require('mongoose');

const GatePassQRSchema = new mongoose.Schema({
    holderName: {
        type: String,
        required: true
    },
    passType: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'used', 'revoked'],
        default: 'active'
    },
    meta: mongoose.Schema.Types.Mixed
});

const GatePassQR = mongoose.model('GatePassQR', GatePassQRSchema);

module.exports = GatePassQR;
