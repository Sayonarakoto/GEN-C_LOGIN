/**
 * Sends a general notification to a user.
 * (This is the function missing from your exports)
 * @param {string} recipientId - The user ID to notify (student or faculty).
 * @param {string} message - The notification content.
 * @param {string} subject - The notification subject/type.
 */
const sendNotification = async (recipientId, message, subject) => {
  console.log(`[Notification] To: ${recipientId}, Subject: ${subject}, Message: "${message}"`);
  // Add your real-world notification logic here (e.g., email API, push service)
};

/**
 * Placeholder for sending pass used notifications.
 * @param {object} pass - The special pass object.
 */
const sendPassUsedNotification = async (pass) => {
  console.log(`Sending 'Pass Used' notification for Pass ID: ${pass._id}`);
  console.log(`Student ID: ${pass.student_id}, HOD Approver ID: ${pass.hod_approver_id}`);
  // In a real application, this would integrate with an actual notification system
  // (e.g., email, SMS, in-app notification, push notification).
  // This function would typically interact with other services or APIs.
};

module.exports = { 
    sendNotification,          // <--- ADD THIS EXPORT
    sendPassUsedNotification 
};