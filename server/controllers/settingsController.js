const settingsService = require('../services/settingsService');
const createError = require('../utils/error');

// @desc    Get current application time settings
// @route   GET /api/settings
// @access  Private (any authenticated user - student forms need the allowed window)
exports.getSettings = async (req, res, next) => {
    try {
        res.json({ success: true, data: settingsService.getSettings() });
    } catch (error) {
        console.error('[Settings Controller] Error fetching settings:', error);
        next(error);
    }
};

// @desc    Update application time settings
// @route   PUT /api/settings
// @access  Private (HOD)
exports.updateSettings = async (req, res, next) => {
    try {
        const { collegeHoursStart, collegeHoursEnd, lateEntryCutoff } = req.body;

        if (!collegeHoursStart || !collegeHoursEnd || !lateEntryCutoff) {
            return next(createError('collegeHoursStart, collegeHoursEnd and lateEntryCutoff are required.', 400));
        }

        const updated = await settingsService.updateSettings(
            { collegeHoursStart, collegeHoursEnd, lateEntryCutoff },
            req.user?.id
        );

        res.json({
            success: true,
            data: updated,
            message: `Settings updated. College hours: ${settingsService.formatRange(updated.collegeHoursStart, updated.collegeHoursEnd)}.`,
        });
    } catch (error) {
        if (error.statusCode === 400) {
            return next(createError(error.message, 400));
        }
        console.error('[Settings Controller] Error updating settings:', error);
        next(error);
    }
};

// @desc    Reset settings back to env-var defaults
// @route   POST /api/settings/reset
// @access  Private (HOD)
exports.resetSettings = async (req, res, next) => {
    try {
        const defaults = await settingsService.resetSettings();

        res.json({
            success: true,
            data: defaults,
            message: `Settings reset to defaults. College hours: ${settingsService.formatRange(defaults.collegeHoursStart, defaults.collegeHoursEnd)}.`,
        });
    } catch (error) {
        console.error('[Settings Controller] Error resetting settings:', error);
        next(error);
    }
};
