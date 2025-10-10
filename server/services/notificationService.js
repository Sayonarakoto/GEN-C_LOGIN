const { sendSocketNotification } = require('../socket');

const sendNotification = async (recipientId, message, subject) => {
  console.log(`[Notification] To: ${recipientId}, Subject: ${subject}, Message: "${message}"`);
  sendSocketNotification(recipientId, subject, message);
};

const sendPassUsedNotification = async (pass) => {
  console.log(`Sending 'Pass Used' notification for Pass ID: ${pass._id}`);
  console.log(`Student ID: ${pass.student_id}, HOD Approver ID: ${pass.hod_approver_id}`);
};

module.exports = { 
    sendNotification,
    sendPassUsedNotification,
};