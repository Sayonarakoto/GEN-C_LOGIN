const AuditLog = require('../../Genc.DAL/models/AuditLog');
const mongoose = require('mongoose');

/**
 * Logs an audit attempt for pass verification.
 * @param {string} passId - The ID of the pass.
 * @param {string} passType - The type of pass ('gate' or 'special').
 * @param {string} eventType - The type of event (e.g., 'Verified').
 * @param {object} securityUser - The security user object from req.user.
 * @param {string} resultDetails - Details about the result (e.g., 'SUCCESS').
 * @param {object} extraDetails - Additional details to merge into event_details.
 */
const logAuditAttempt = async (passId, passType, eventType, securityUser, resultDetails, extraDetails = {}) => {
  try {
    const capitalizedActorRole = securityUser.role.charAt(0).toUpperCase() + securityUser.role.slice(1);

    const logData = {
      event_type: eventType,
      actor_role: capitalizedActorRole,
      actor_id: securityUser.id,
      event_details: {
        scan_location: securityUser.scan_location || 'Unknown',
        result: resultDetails,
        ...extraDetails,
      },
      timestamp: new Date()
    };

    const isValidId = mongoose.Types.ObjectId.isValid(passId);

    if (passType === 'gate') {
      logData.gatepass_id = isValidId ? new mongoose.Types.ObjectId(passId) : null;
    } else { // Default to special pass
      logData.pass_id = isValidId ? new mongoose.Types.ObjectId(passId) : null;
    }

    await AuditLog.create(logData);
  } catch (error) {
    console.error('Error logging audit attempt:', error);
  }
};

module.exports = { logAuditAttempt };