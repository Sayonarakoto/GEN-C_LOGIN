const mongoose = require('mongoose');

const latecomerRequestHistorySchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'LateEntry', required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  actorModel: { type: String, required: true, enum: ['Student', 'Faculty'] },
  from_status: { type: String, required: true },
  to_status: { type: String, required: true },
  changes: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('LatecomerRequestHistory', latecomerRequestHistorySchema);