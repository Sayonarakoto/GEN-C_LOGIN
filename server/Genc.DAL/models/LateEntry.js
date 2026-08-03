
const mongoose = require('mongoose');

const lateEntrySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  // CRITICAL for RBAC: Links the entry to the student's department.
  department: { type: String, required: true, index: true },
  date: { type: Date, required: false },
  reason: { type: String, required: true },
  // Used to trigger the HOD flag from the form if needed, or for analytics.
  reasonCategory: { type: String },

  // Main status, distinguishes between Faculty and HOD queues.
  status: {
    type: String,
    required: true,
    enum: [
      'Pending Faculty',
      'Pending HOD',
      'Resubmitted',
      'Approved',
      'Rejected',
    ],
    default: 'Pending Faculty'
  },

  isFinal: { // <--- ADD THIS FIELD
    type: Boolean,
    default: false // Requests start as not final
  },
  
  // --- Two-Tier Approval Fields ---
  // Flag set on submission to determine the workflow path.
  requiresHODApproval: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  // Tracks the HOD's action.
  HODStatus: { 
    type: String, 
    enum: ['N/A', 'Pending', 'Approved', 'Rejected'], 
    default: 'N/A'
  },
  // Auditing: Stores the HOD who acted on the request.
  HODId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Faculty', // HODs are also faculty members
    default: null
  },
  HODActionAt: { type: Date },
  HODRemarks: { type: String, default: '' },

  FacultyActionable: { type: Boolean, default: true },
  
  // --- Faculty Action Fields ---
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  remarks: { type: String, default: '' },

  // --- Other metadata ---
  resubmissionCount: { type: Number, default: 0 },
  lastActionAt: { type: Date, default: Date.now },
  resubmittedAt: { type: Date },
  qr_token: { type: String },
  verification_otp: { type: String, minlength: 3, maxlength: 3 },
}, { timestamps: true });

// Compound index for efficient dashboard queries
lateEntrySchema.index({ department: 1, status: 1 });
lateEntrySchema.index({ department: 1, HODStatus: 1 });

module.exports = mongoose.model('LateEntry', lateEntrySchema);
