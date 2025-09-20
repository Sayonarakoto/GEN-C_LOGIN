// server/models/LateEntry.js
const mongoose = require('mongoose');

const lateEntrySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  recordedAt: { type: Date, required: true, default: Date.now, index: true },
  reason: { type: String, required: true, maxlength: 500 },
  gate: { type: String }, // e.g., Main Gate, North Gate
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Security', required: true },
  status: { type: String, enum: ['recorded', 'acknowledged', 'reviewed'], default: 'recorded', index: true },
  remarks: { type: String, maxlength: 500 },
}, { timestamps: true });

lateEntrySchema.index({ student: 1, recordedAt: -1 });

module.exports = mongoose.model('LateEntry', lateEntrySchema);
