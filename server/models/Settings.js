const mongoose = require('mongoose');

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const settingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: 'app',
        },
        collegeHoursStart: {
            type: String,
            required: true,
            match: [TIME_REGEX, 'Time must be in HH:MM (24-hour) format'],
            default: '09:30',
        },
        collegeHoursEnd: {
            type: String,
            required: true,
            match: [TIME_REGEX, 'Time must be in HH:MM (24-hour) format'],
            default: '16:00',
        },
        lateEntryCutoff: {
            type: String,
            required: true,
            match: [TIME_REGEX, 'Time must be in HH:MM (24-hour) format'],
            default: '09:30',
        },
        gatePassExtraMinutes: {
            type: Number,
            required: true,
            min: [0, 'Extra minutes cannot be negative'],
            max: [180, 'Extra minutes cannot exceed 180'],
            default: 10,
        },
        // TESTING ONLY: when true, college-hours request validation is skipped
        bypassTimeChecks: {
            type: Boolean,
            default: false,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Faculty',
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
