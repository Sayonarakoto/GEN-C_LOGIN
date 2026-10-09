const settingsService = require('../services/settingsService');

// Keep the JWT alive a little past the check-in window so the app-level
// (more descriptive) window message is what verification reports to the client.
const BUFFER_SECONDS = 300;
const MIN_SECONDS = 60;

function getExtraMinutes() {
    const configured = settingsService.getSettings().gatePassExtraMinutes;
    return Number.isInteger(configured) ? configured : 10;
}

/**
 * Seconds a gate pass QR/OTP credential should stay valid for:
 * check-in time + gatePassExtraMinutes (+ small buffer).
 * @param {object} pass - GatePass document
 * @returns {number} lifetime in seconds
 */
function gatePassQrExpirySeconds(pass) {
    const extraMinutes = getExtraMinutes();
    const startMs = pass && pass.date_valid_from
        ? new Date(pass.date_valid_from).getTime()
        : Date.now();
    const validUntilMs = startMs + extraMinutes * 60000 + BUFFER_SECONDS * 1000;
    return Math.max(MIN_SECONDS, Math.floor((validUntilMs - Date.now()) / 1000));
}

module.exports = { gatePassQrExpirySeconds, getExtraMinutes };
