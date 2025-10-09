const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

/**
 * Logs an audit attempt for pass verification.
 * @param {string} passId - The ID of the special pass.
 * @param {string} eventType - The type of event (e.g., 'Verified').
 * @param {object} securityUser - The security user object from req.user.
 * @param {string} resultDetails - Details about the result (e.g., 'SUCCESS', 'FAILED').
 */
const logAuditAttempt = async (passId, eventType, securityUser, resultDetails, extraDetails = {}) => {
  try {
    await AuditLog.create({
      pass_id: mongoose.Types.ObjectId.isValid(passId) ? new mongoose.Types.ObjectId(passId) : new mongoose.Types.ObjectId(),
      event_type: eventType,
      actor_role: securityUser.role,
      actor_id: securityUser.id,
      event_details: {
        scan_location: securityUser.scan_location || 'Unknown',
        result: resultDetails,
        ...extraDetails, // Merge additional details
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging audit attempt:', error);
  }
};

module.exports = { logAuditAttempt };