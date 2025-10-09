const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  pass_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SpecialPass',
    required: false // Made optional to allow for gatepass_id
  },
  gatepass_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GatePass',
    required: false // New field for GatePass events
  },
  event_type: {
    type: String,
    required: true,
    enum: ['Request', 'Approved', 'Verified', 'Rejected', 'Revoked', 'LatenessLogged'] // Added LatenessLogged
  },
  actor_role: {
    type: String,
    required: true,
    enum: ['Student', 'HOD', 'Admin', 'Security', 'Security Supervisor', 'faculty'] // Added faculty
  },
  actor_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  event_details: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);