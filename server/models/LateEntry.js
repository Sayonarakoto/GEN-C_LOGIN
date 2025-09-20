const mongoose = require('mongoose');

const LateEntrySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  reason: { type: String, required: true, maxlength: 500 },
  entryTime: { type: Date, required: true, default: Date.now, index: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending', index: true },
  // Optional fields you may add later:
  // gate: String,
  // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SecurityUser' },
  // department: String, // denormalized from student for faculty filtering
}, { timestamps: true });

LateEntrySchema.index({ student: 1, entryTime: -1 });

module.exports = mongoose.model('LateEntry', LateEntrySchema);