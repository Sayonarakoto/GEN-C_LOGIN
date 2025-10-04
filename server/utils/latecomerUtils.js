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
    entityId: { $in: entryIds },
    entityType: 'LateEntry',
    action: 'FACULTY_REJECTED',
    timestamp: { $gte: threeMonthsAgo },
  });

  // If the student has 2 or more faculty rejections in the last 3 months, flag it.
  return rejectedCount >= 2;
}

/**
 * Finalizes an action on a late entry, updating its status and creating an audit log.
 * @param {object} entry - The Mongoose document of the late entry.
 * @param {string} actorId - The ID of the user performing the action.
 * @param {string} action - A string for the audit log (e.g., 'FACULTY_APPROVE').
 * @param {object} updates - An object with the fields to update on the entry.
 */
async function finalizeAction(entry, actorId, action, updates) {
    Object.assign(entry, updates);
    entry.lastActionAt = new Date();

    await entry.save();

    await AuditLog.create({
        action: action,
        entityType: 'LateEntry',
        entityId: entry._id,
        userId: actorId,
        changes: updates,
    });
}

module.exports = { checkHODNeed, finalizeAction };