const mongoose = require('mongoose');

const lateEntrySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentDepartment: { type: String, required: true }, // Added studentDepartment field
  date: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Resubmitted'], default: 'Pending' },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  rejectionReason: { type: String },
  resubmissionCount: { type: Number, default: 0 },
  lastActionAt: { type: Date, default: Date.now },
  resubmittedAt: { type: Date },
  editedFields: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('LateEntry', lateEntrySchema);