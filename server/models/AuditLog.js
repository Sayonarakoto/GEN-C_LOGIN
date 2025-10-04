const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'UPDATE_LATE_ENTRY_STATUS',
      'HOD_APPROVED',
      'HOD_REJECTED',
      'FACULTY_APPROVED', // Assuming these are also used
      'FACULTY_REJECTED', // Assuming these are also used
      'STUDENT_SUBMITTED' // Assuming this is also used
    ],
  },
  entityType: {
    type: String,
    required: true,
    enum: ['LateEntry'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  changes: {
    type: Object,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
