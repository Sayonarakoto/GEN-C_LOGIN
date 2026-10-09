const mongoose = require('mongoose');

/**
 * One row per issued password-reset code, shared by every account type.
 * The raw OTP is never stored - only its sha256 hash.
 */
const passwordResetOtpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            index: true,
        },
        userModel: {
            type: String,
            enum: ['Student', 'Faculty', 'User'],
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        otpHash: {
            type: String,
            required: true,
            unique: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        expiresAt: {
            type: Date,
            required: true,
            // Auto-delete once expired (TTL index, same pattern as GatePassQR)
            index: { expires: 0 },
        },
        usedAt: {
            type: Date,
            default: null,
        },
        purpose: {
            type: String,
            default: 'password_reset',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);
