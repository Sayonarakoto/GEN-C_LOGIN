const LateEntry = require('../models/LateEntry');
const AuditLog = require('../models/AuditLog');

/**
 * Checks if a student's submission requires HOD approval based on their recent rejection history.
 * @param {string} studentId The ID of the student to check.
 * @returns {Promise<boolean>} True if HOD approval is needed, false otherwise.
 */
async function checkHODNeed(studentId) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Find all late entries for the student to get their IDs
  const studentEntries = await LateEntry.find({ studentId: studentId }, '_id');
  if (studentEntries.length === 0) {
    return false; // No entries, no need for HOD
  }
  const entryIds = studentEntries.map(e => e._id);

  // Count how many times a faculty has rejected this student's entries
  const rejectedCount = await AuditLog.countDocuments({
    pass_id: { $in: entryIds }, // pass_id stores the late entry ID
    event_type: 'Rejected',
    actor_role: 'faculty', // Only count faculty rejections
    timestamp: { $gte: threeMonthsAgo },
  });

  // If the student has 2 or more faculty rejections in the last 3 months, flag it.
  return rejectedCount >= 2;
}

/**
 * Finalizes an action on a late entry, updating its status and creating an audit log.
 * @param {object} entry - The Mongoose document of the late entry.
 * @param {string} actorId - The ID of the user performing the action.
 * @param {string} action - A string for the audit log (e.g., 'FACULTY_APPROVED', 'HOD_REJECTED').
 * @param {object} updates - An object with the fields to update on the entry.
 */
async function finalizeAction(entry, actorId, action, updates) {
    Object.assign(entry, updates);
    entry.lastActionAt = new Date();

    await entry.save();

    // Map action types to valid AuditLog event_type enum values
    // Valid enum: ['Request', 'Approved', 'Verified', 'Rejected', 'Revoked', 'LatenessLogged', 'Initiated', 'Final Approved']
    let eventType;
    if (action.includes('APPROVED')) {
        eventType = updates.status === 'Approved' && entry.requiresHODApproval ? 'Final Approved' : 'Approved';
    } else if (action.includes('REJECTED')) {
        eventType = 'Rejected';
    } else {
        eventType = 'Request'; // Default fallback
    }

    // Determine actor_role from action
    let actorRole = 'faculty'; // Default
    if (action.includes('HOD')) {
        actorRole = 'HOD';
    }

    // Create audit log non-blocking - don't fail the request if audit log creation fails
    try {
        await AuditLog.create({
            event_type: eventType,
            pass_id: entry._id, // Using pass_id field to store late entry ID
            actor_id: actorId,
            actor_role: actorRole,
            event_details: {
                ...updates,
                action: action, // Store original action in event_details for reference
                entryId: entry._id.toString(),
            },
        });
    } catch (auditError) {
        // Log the error but don't fail the request
        console.error('Failed to create audit log for late entry:', auditError);
        // Continue execution - the entry was already saved successfully
    }
}

module.exports = { checkHODNeed, finalizeAction };