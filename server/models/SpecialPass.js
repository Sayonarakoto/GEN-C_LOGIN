const mongoose = require('mongoose');

const specialPassSchema = new mongoose.Schema({
  pass_type: {
    type: String,
    required: true,
    enum: ['Lab Entry', 'Late Entry', 'Mosque Pass', 'ID Lost', 'Improper Uniform', 'Other', 'Event Pass'] // Example types
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  department: {
    type: String,
    required: true,
    set: (value) => value.toUpperCase()
  },
  request_reason: {
    type: String,
    required: function() { return this.pass_type !== 'Mosque Pass'; } // Reason not required for Mosque Pass
  },
  hod_approver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty', // Assuming HODs are Faculty members
    default: null
  },
  hod_comment: {
    type: String,
    default: null
  },
  date_valid_from: {
    type: Date,
    required: true
  },
  date_valid_to: {
    type: Date,
    required: true
  },
  is_one_time_use: {
    type: Boolean,
    default: false
  },
  requires_qr_scan: {
    type: Boolean,
    default: true // Override passes will always require QR scan
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Approved', 'Rejected', 'Used', 'Expired', 'Revoked', 'Override - Active'], // Added 'Override - Active'
    default: 'Pending'
  },
  bypass_flag: {
    type: Boolean,
    default: false
  },
  qr_code_jwt: {
    type: String,
    default: null
  },
  verification_otp: {
    type: String,
    default: null // Stores the 3-digit OTP for fallback verification
  },
  requested_at: {
    type: Date,
    default: Date.now
  },
  approved_at: {
    type: Date,
    default: null
  },
  pdf_path: {
    type: String,
    default: null
  },
  is_finalized: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('SpecialPass', specialPassSchema);