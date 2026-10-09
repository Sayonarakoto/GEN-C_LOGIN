const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Student = require('../models/student');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const { sendResetOtpEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

const PURPOSE = 'password_reset';
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const OTP_REGEX = /^\d{6}$/;

// Security accounts have no email field, so they cannot receive a reset code.
// HODs log in from the Faculty table (see authController unifiedLogin), so
// role 'faculty' covers both ordinary faculty and HODs.
const ROLE_TARGETS = {
    student: { Model: Student, userModel: 'Student' },
    faculty: { Model: Faculty, userModel: 'Faculty' },
    librarian: { Model: User, userModel: 'User', roleFilter: 'librarian' },
    admin: { Model: User, userModel: 'User', roleFilter: 'admin' },
};

// How to load + re-hash a saved OTP row, keyed by the row's userModel.
// Student/Faculty have no pre-save hook - hash in the controller.
// User (librarian/admin) hashes in its own pre('save') hook, so pass it plain.
const MODEL_BY_NAME = {
    Student: { Model: Student, hashInController: true },
    Faculty: { Model: Faculty, hashInController: true },
    User: { Model: User, hashInController: false },
};

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const badRequest = (res, message, code) =>
    res.status(400).json({ success: false, message, code });

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Emails are stored inconsistently cased across collections, so match loosely.
const emailQuery = (email) => ({
    email: { $regex: `^${escapeRegex(email.trim().toLowerCase())}$`, $options: 'i' },
});

async function findAccountByEmail(email, role) {
    const query = emailQuery(email);

    // Preferred path: the client told us which kind of account to look up.
    if (role) {
        const target = ROLE_TARGETS[role];
        if (!target) return null;
        const user = await target.Model.findOne(
            target.roleFilter ? { ...query, role: target.roleFilter } : query
        );
        return user ? { user, Model: target.Model, userModel: target.userModel } : null;
    }

    // Legacy/API fallback without a role: search every table. The same email can
    // exist in more than one collection (unique indexes are per-collection), so
    // when that happens we refuse to guess - a wrong guess would reset someone
    // else's password.
    const hits = [];
    const student = await Student.findOne(query);
    if (student) hits.push({ user: student, Model: Student, userModel: 'Student' });
    const faculty = await Faculty.findOne(query);
    if (faculty) hits.push({ user: faculty, Model: Faculty, userModel: 'Faculty' });
    const staff = await User.findOne(query);
    if (staff) hits.push({ user: staff, Model: User, userModel: 'User' });

    if (hits.length > 1) {
        logger.warn(
            `Password reset refused for ${email}: exists in ${hits
                .map((h) => h.userModel)
                .join(' + ')} - no role was supplied`
        );
        return null;
    }
    return hits[0] || null;
}

async function findOtpRow(otp) {
    return PasswordResetOtp.findOne({
        otpHash: hashOtp(otp),
        purpose: PURPOSE,
        usedAt: null,
    });
}

async function invalidateRow(row) {
    await PasswordResetOtp.deleteOne({ _id: row._id });
}

// Shared guards for verify + reset. Returns an error response, or null when the row is usable.
async function checkOtpRow(res, otp) {
    if (!OTP_REGEX.test(String(otp || ''))) {
        badRequest(res, 'Please enter the 6-digit code from your email.', 'OTP_INVALID');
        return { failed: true };
    }

    const row = await findOtpRow(otp);
    if (!row) {
        badRequest(res, 'This reset code is invalid or has expired.', 'OTP_INVALID');
        return { failed: true };
    }

    if (row.expiresAt.getTime() <= Date.now()) {
        await invalidateRow(row);
        badRequest(res, 'This reset code has expired. Please request a new one.', 'OTP_EXPIRED');
        return { failed: true };
    }

    if (row.attempts >= MAX_ATTEMPTS) {
        await invalidateRow(row);
        badRequest(
            res,
            'Too many attempts with this code. Please request a new one.',
            'OTP_ATTEMPTS_EXCEEDED'
        );
        return { failed: true };
    }

    return { failed: false, row };
}

async function recordFailedAttempt(row) {
    await PasswordResetOtp.updateOne({ _id: row._id }, { $inc: { attempts: 1 } });
}

// @route   POST /api/auth/forgot-password
// @desc    Send a password-reset OTP by email
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
        if (!email) {
            return badRequest(res, 'Please provide your email address.', 'EMAIL_REQUIRED');
        }

        const role =
            typeof req.body?.role === 'string' ? req.body.role.trim().toLowerCase() : '';
        if (role && !ROLE_TARGETS[role]) {
            return badRequest(res, 'Please choose a valid account type.', 'INVALID_ROLE');
        }

        const account = await findAccountByEmail(email, role);

        // Always answer the same way so the endpoint cannot be used to probe accounts
        const genericResponse = {
            success: true,
            message: 'If an account with that email exists, a password reset code has been sent.',
        };

        if (!account) {
            return res.status(200).json(genericResponse);
        }

        const otp = String(crypto.randomInt(100000, 999999));

        await PasswordResetOtp.deleteMany({
            email: account.user.email,
            purpose: PURPOSE,
            usedAt: null,
        });
        await PasswordResetOtp.create({
            email: account.user.email,
            userModel: account.userModel,
            userId: account.user._id,
            otpHash: hashOtp(otp),
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${otp}`;

        try {
            await sendResetOtpEmail(account.user.email, otp, resetUrl);
        } catch (emailError) {
            // Never surface mail failures (and never leak whether the account exists)
            logger.error(`Password reset email failed for ${account.user.email}:`, emailError.message);
        }

        const devOnly =
            process.env.NODE_ENV !== 'production' ? { otp, resetUrl } : {};
        return res.status(200).json({ ...genericResponse, ...devOnly });
    } catch (error) {
        logger.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
            code: 'SERVER_ERROR',
        });
    }
};

// @route   POST /api/auth/verify-reset-otp
// @desc    Check a password-reset OTP before showing the reset form
// @access  Public
exports.verifyResetOtp = async (req, res) => {
    try {
        const { otp } = req.body || {};
        const { failed, row } = await checkOtpRow(res, otp);
        if (failed) return undefined;

        return res.status(200).json({ success: true, message: 'Code verified.', rowId: row._id });
    } catch (error) {
        logger.error('Verify reset OTP error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
            code: 'SERVER_ERROR',
        });
    }
};

// @route   POST /api/auth/reset-password
// @desc    Set a new password using a valid OTP
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body || {};

        const { failed, row } = await checkOtpRow(res, otp);
        if (failed) return undefined;

        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            await recordFailedAttempt(row);
            return badRequest(res, 'Password must be at least 6 characters.', 'PASSWORD_TOO_SHORT');
        }

        const target = MODEL_BY_NAME[row.userModel];
        if (!target) {
            await invalidateRow(row);
            return badRequest(res, 'This reset code is invalid or has expired.', 'OTP_INVALID');
        }
        const user = await target.Model.findById(row.userId);
        if (!user) {
            await invalidateRow(row);
            return badRequest(res, 'This reset code is invalid or has expired.', 'OTP_INVALID');
        }

        user.password = target.hashInController
            ? await bcrypt.hash(newPassword, 10)
            : newPassword;
        await user.save();

        await PasswordResetOtp.updateOne(
            { _id: row._id },
            { $set: { usedAt: new Date() } }
        );
        await PasswordResetOtp.deleteMany({
            email: row.email,
            purpose: PURPOSE,
            usedAt: null,
        });

        return res.status(200).json({
            success: true,
            message: 'Your password has been reset. You can now log in.',
        });
    } catch (error) {
        logger.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
            code: 'SERVER_ERROR',
        });
    }
};
