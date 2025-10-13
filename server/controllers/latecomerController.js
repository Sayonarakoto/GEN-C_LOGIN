const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const LateEntry = require('../models/LateEntry');
const Faculty = require('../models/Faculty');
const { sendNotification } = require('../services/notificationService');
// Assuming '../utils/latecomerUtils' is the correct path
const { checkHODNeed, finalizeAction } = require('../utils/latecomerUtils'); 

// Helper function for population
const populateLateEntry = (query) => {
    return query
        .populate('studentId', 'fullName studentId department')
        .populate('facultyId', 'fullName employeeId designation')
        .populate('HODId', 'fullName employeeId designation');
};

// Helper function to handle responses (Refactor)
const handleResponse = (res, promise) => {
  promise
    .then(data => res.status(200).json({ success: true, data }))
    .catch(err => {
      console.error("Error in latecomerController:", err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    });
};

// =========================================================
// FACULTY & HOD ACTIONS
// =========================================================

// GET /api/latecomers/faculty/pending (T3.1 - Working)
exports.getFacultyPending = async (req, res) => {
  try {
    const facultyId = req.user.id;
    if (!facultyId) {
      return res.status(400).json({ success: false, message: 'User authentication data is incomplete.' });
    }

    const query = {
      facultyId: new mongoose.Types.ObjectId(facultyId),
      status: { $in: ['Pending Faculty', 'Resubmitted'] }
    };

    const pendingRequestsQuery = LateEntry.find(query).sort({ createdAt: -1 });
    const pendingRequests = await populateLateEntry(pendingRequestsQuery);

    if (pendingRequests.length > 0) {
      const message = `You have ${pendingRequests.length} pending late entry requests.`;
      await sendNotification(facultyId, message, 'Pending Requests');
    }

    res.status(200).json({ success: true, data: pendingRequests });

  } catch (err) {
    console.error('--- FATAL ERROR in getFacultyPending ---', err);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred while fetching pending requests.',
      error: err.message
    });
  }
};

// GET /api/latecomers/hod/pending (T3.4)
exports.getHODPending = async (req, res) => {
  console.log('DEBUG: Entering getHODPending');
  try {
    // This value is correctly 'CT' from the JWT
    const department = req.user.department; 
    const hodId = req.user.id;

    if (!department) {
        console.error('ERROR: HOD user does not have a department assigned.');
        return res.status(400).json({ success: false, message: 'HOD user does not have a department assigned.' });
    }

    console.log(`DEBUG: getHODPending - User ID: ${hodId}, Department: ${department}`);

    const query = {
        // Ensure department is used here!
        department: department, 
        status: { $in: ['Pending HOD', 'Pending Faculty', 'Resubmitted'] }
    };

    console.log('DEBUG: getHODPending - Executing database query:', JSON.stringify(query, null, 2));
    
    const pendingRequestsQuery = LateEntry.find(query)
        .populate('studentId', 'fullName studentId department')
        .populate('facultyId', 'fullName employeeId')
        .populate('HODId', 'fullName employeeId')
        .sort({ updatedAt: -1, createdAt: -1 });

    const pendingRequests = await pendingRequestsQuery;
    
    console.log(`DEBUG: getHODPending - Found ${pendingRequests.length} pending requests.`);
    if (pendingRequests.length > 0) {
        console.log('DEBUG: getHODPending - First request found:', JSON.stringify(pendingRequests[0], null, 2));
    }

    res.status(200).json({ success: true, data: pendingRequests });
  } catch (err) {
    console.error('Error in getHODPending:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/latecomers/department/approved (Generic approved list by department)
exports.getApprovedByDepartment = (req, res) => {
  const departmentRegex = new RegExp(`^${req.user.department}$`, 'i');
  const query = {
    department: departmentRegex,
    status: 'Approved' 
  };
  const promise = populateLateEntry(LateEntry.find(query)).sort({ createdAt: -1 });
  handleResponse(res, promise);
};

// PUT /api/latecomers/:id/faculty-action (T4.2, T4.4)
exports.facultyAction = async (req, res) => {
  const { id } = req.params;
  const { action, remarks } = req.body;
  const { department, id: facultyId } = req.user;

  try {
    const departmentRegex = new RegExp(`^${department}$`, 'i');

    const entry = await LateEntry.findOne({ 
      _id: id, 
      department: departmentRegex, 
      facultyId: new mongoose.Types.ObjectId(facultyId) 
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found, not in your department, or not assigned to you.' });
    }
    
    if (!['Pending Faculty', 'Resubmitted'].includes(entry.status)) {
        return res.status(400).json({ success: false, message: `Entry already finalized with status: ${entry.status}` });
    }

    if (!entry.FacultyActionable) {
      return res.status(403).json({ success: false, message: 'Action not allowed. Waiting for HOD approval.' });
    }

    let newStatus;
    let isFinal = false; 
    let auditAction;

    if (action === 'approve') {
        auditAction = 'FACULTY_APPROVED';
        if (entry.requiresHODApproval) {
            newStatus = 'Pending HOD';
        } else {
            newStatus = 'Approved';
            isFinal = true; 
        }
    } else if (action === 'reject') {
        auditAction = 'FACULTY_REJECTED';
        newStatus = 'Rejected';
    } else {
        return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    const updates = {
        status: newStatus,
        isFinal: isFinal,
        remarks: remarks,
        facultyId: facultyId, 
    };

    await finalizeAction(entry, facultyId, auditAction, updates);
    res.status(200).json({ success: true, data: entry });

  } catch (err) {
    console.error("Error in facultyAction:", err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /api/latecomers/:id/hod-action (T4.3)
exports.hodAction = async (req, res) => {
  const { id } = req.params;
  const { action, remarks } = req.body;
  const { department, id: hodId } = req.user;

  try {
    const departmentRegex = new RegExp(`^${department}$`, 'i');

    const entry = await LateEntry.findOne({ 
        _id: id, 
        department: departmentRegex, 
        status: 'Pending HOD' 
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found, not in your department, or not pending HOD action.' });
    }

    let auditAction;
    let newStatus;
    let newHODStatus;
    let isFinal = true; // HOD action is ALWAYS final

    if (action === 'approve') {
        newStatus = 'Approved'; 
        newHODStatus = 'Approved';
        auditAction = 'HOD_APPROVED';
    } else if (action === 'reject') {
        newStatus = 'Rejected'; 
        newHODStatus = 'Rejected';
        auditAction = 'HOD_REJECTED';
    } else {
        return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    const updates = {
        status: newStatus,
        HODStatus: newHODStatus,
        HODRemarks: remarks,
        HODId: hodId,
        HODActionAt: new Date(),
        FacultyActionable: action === 'approve' ? true : false,
        isFinal: isFinal // HOD action finalizes the entry
    };

    await finalizeAction(entry, hodId, auditAction, updates);

    const populated = await populateLateEntry(LateEntry.findById(entry._id));
    res.status(200).json({ success: true, data: populated });

  } catch (err) {
    console.error("Error in hodAction:", err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/latecomers/faculty/all (New Filtered Faculty Dashboard View)
exports.getFacultyLateEntries = async (req, res) => {
  try {
    const { statusFilter, from, to } = req.query; // Get filter from query params
    const facultyId = req.user.id;

    let queryCriteria = { facultyId: new mongoose.Types.ObjectId(facultyId) };

    // APPLY THE FILTER LOGIC for status
    if (statusFilter === 'Rejected') {
        queryCriteria.status = 'Rejected';
        queryCriteria.isFinal = false; // Only non-final rejected entries (resubmittable)
    } else if (statusFilter === 'Pending') {
        queryCriteria.status = { $in: ['Pending Faculty', 'Resubmitted'] };
    } else if (statusFilter === 'Approved') {
        queryCriteria.status = 'Approved';
        queryCriteria.isFinal = true; // Only final approved entries
    }

    // APPLY THE FILTER LOGIC for dates
    if (from || to) {
        queryCriteria.createdAt = {};
        if (from) {
            queryCriteria.createdAt.$gte = new Date(from);
        }
        if (to) {
            // Set to the end of the day for the 'to' date
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            queryCriteria.createdAt.$lte = toDate;
        }
    }
    
    // Sort by updatedAt for most recent activity
    const entriesQuery = LateEntry.find(queryCriteria).sort({ updatedAt: -1, createdAt: -1 });
    const entries = await populateLateEntry(entriesQuery);

    res.status(200).json({ success: true, data: entries });

  } catch (err) {
    console.error("Error in getFacultyLateEntries:", err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// NEW: Get Faculty Dashboard Stats
exports.getFacultyStats = async (req, res) => {
    try {
        const userId = req.user.id; 
        const userRole = req.user.role;
        const userDepartment = req.user.department;

        console.log(`DEBUG: getFacultyStats - User ID: ${userId}, Role: ${userRole}, Department: ${userDepartment}`);

        let baseQuery = {};

        if (userRole === 'HOD') {
            if (!userDepartment) {
                return res.status(400).json({ success: false, message: 'HOD user does not have a department assigned.' });
            }
            baseQuery.department = userDepartment;
            // HODs see stats for their department, not just what they personally approved as faculty
        } else if (userRole === 'faculty') {
            baseQuery.facultyId = new mongoose.Types.ObjectId(userId);
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized to view faculty stats.' });
        }

        // 1. Get Pending Count
        const pendingQuery = {
            ...baseQuery,
            status: { $in: ['Pending Faculty', 'Resubmitted'] }
        };
        // If HOD, also include entries pending HOD approval for their department
        if (userRole === 'HOD') {
            pendingQuery.status.$in.push('Pending HOD');
        }
        console.log('DEBUG: getFacultyStats - Pending Query:', JSON.stringify(pendingQuery));
        const pendingCount = await LateEntry.countDocuments(pendingQuery);
        console.log(`DEBUG: getFacultyStats - Pending Count: ${pendingCount}`);

        // 2. Get Approved Count
        const approvedQuery = {
            ...baseQuery,
            status: 'Approved',
            isFinal: true
        };
        console.log('DEBUG: getFacultyStats - Approved Query:', JSON.stringify(approvedQuery));
        const approvedCount = await LateEntry.countDocuments(approvedQuery);
        console.log(`DEBUG: getFacultyStats - Approved Count: ${approvedCount}`);

        // 3. Get Rejected (Non-Final) Count
        const rejectedQuery = {
            ...baseQuery,
            status: 'Rejected',
            isFinal: false
        };
        console.log('DEBUG: getFacultyStats - Rejected Query:', JSON.stringify(rejectedQuery));
        const rejectedCount = await LateEntry.countDocuments(rejectedQuery);
        console.log(`DEBUG: getFacultyStats - Rejected Count: ${rejectedCount}`);

        res.status(200).json({
            success: true,
            data: {
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount
            }
        });

    } catch (err) {
        console.error("Error in getFacultyStats:", err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};


// =========================================================
// STUDENT ACTIONS
// =========================================================

// POST /api/latecomers
exports.createLateEntry = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { reason, facultyId, reasonCategory, date: rawDate, HODId: studentSelectedHODId } = req.body; 
      let requiresHODApproval = false; 
      let hodIdToUse = null; 

      const date = rawDate ? new Date(rawDate) : new Date();
      if (isNaN(date.getTime())) { 
        return res.status(400).json({ success: false, message: 'Invalid date provided.' });
      }

      // 🛑 FIX: Correctly structure the HOD determination logic
      if (studentSelectedHODId) {
        requiresHODApproval = true;
        hodIdToUse = studentSelectedHODId;
      } else {
        const historyRequiresHOD = await checkHODNeed(req.user.id);
        if (historyRequiresHOD) {
          requiresHODApproval = true;
          
          const userDepartment = req.user.department;
          if (!userDepartment) {
            return res.status(400).json({ 
              message: 'User department not found. Cannot submit entry.' 
            });
          }
          const departmentRegex = new RegExp(`^${userDepartment}$`);
          const hod = await Faculty.findOne({ department: departmentRegex, designation: new RegExp('^HOD', 'i') });

          if (!hod) {
            return res.status(400).json({ success: false, message: 'No HOD found for your department to approve this special case based on history.' });
          }
          hodIdToUse = hod._id;
        }
      }
      
      const userDepartment = req.user.department;
      if (!userDepartment) {
        return res.status(400).json({ 
          message: 'User department not found. Cannot submit entry.' 
        });
      }

      const initialStatus = requiresHODApproval ? 'Pending HOD' : 'Pending Faculty';
      const initialHODStatus = requiresHODApproval ? 'Pending' : 'N/A';
      const facultyActionable = !requiresHODApproval;

      // Final check for HOD ID if required HOD approval
      if (requiresHODApproval && !hodIdToUse) {
          const departmentRegex = new RegExp(`^${userDepartment}$`);
          const hod = await Faculty.findOne({ department: departmentRegex, designation: new RegExp('^HOD', 'i') });
          if (!hod) {
              return res.status(400).json({ success: false, message: 'No HOD found for your department to process this escalated request.' });
          }
          hodIdToUse = hod._id;
      }


      const doc = await LateEntry.create({
        studentId: req.user.id,
        department: userDepartment,
        date, 
        reason,
        facultyId,
        reasonCategory,
        requiresHODApproval,
        status: initialStatus,
        HODStatus: initialHODStatus,
        FacultyActionable: facultyActionable,
        HODId: hodIdToUse,
        isFinal: false 
      });

      res.status(201).json({ 
        success: true, 
        lateEntry: doc,
        message: requiresHODApproval 
          ? 'Special case submitted. Awaiting HOD approval.' 
          : 'Late entry submitted successfully.'
      });
    } catch (err) {
      console.error("Error creating late entry:", err);
      res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/latecomers/:id/update
exports.updateLateEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { reason, facultyId, reasonCategory, date } = req.body; 

    const existingEntry = await LateEntry.findById(id);

    if (!existingEntry) {
      return res.status(404).json({ success: false, message: 'Late entry not found.' });
    }

    if (existingEntry.studentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only update your own late entries.' });
    }

    if (existingEntry.isFinal || existingEntry.status === 'Pending HOD') {
      return res.status(400).json({ success: false, message: 'Cannot update a finalized or currently pending HOD late entry.' });
    }

    const newStatus = ['Rejected', 'Resubmitted'].includes(existingEntry.status) ? 'Pending Faculty' : existingEntry.status;

    // NOTE: Removed redundant `lastActionAt: new Date()` since timestamps: true handles `updatedAt`
    const updatedEntry = await LateEntry.findByIdAndUpdate(
      id,
      {
        reason,
        facultyId,
        reasonCategory,
        date,
        status: newStatus,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedEntry });

  } catch (err) {
    console.error("Error in updateLateEntry:", err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// GET /api/latecomers/student/all
exports.getStudentEntries = async (req, res) => {
  try {
    const query = LateEntry.find({ studentId: req.user.id }).sort({ updatedAt: -1, createdAt: -1 }); 
    const entries = await populateLateEntry(query);
    res.json({ success: true, entries });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/latecomers/rejected/resubmittable
exports.getStudentRejectedEntries = async (req, res) => {
  try {
    const query = LateEntry.find({ 
        studentId: req.user.id, 
        isFinal: false, 
        status: 'Rejected' 
    }).sort({ updatedAt: -1 }); // Use updatedAt for sorting
    
    const rejectedEntries = await populateLateEntry(query);
    res.status(200).json({ success: true, entries: rejectedEntries });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// GET /api/latecomers/:id
exports.getLateEntryById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const lateEntry = await LateEntry.findById(id).populate('studentId', 'fullName studentId department');

      if (!lateEntry) {
        return res.status(404).json({ message: 'Late entry not found' });
      }

      if (req.user.role === 'student' && (!lateEntry.studentId || lateEntry.studentId._id.toString() !== req.user.id)) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own late entries' });
      }

      res.status(200).json({ success: true, lateEntry });
    } catch (err) {
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// PUT /api/latecomers/:id/resubmit
exports.resubmitEntry = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { reason } = req.body; 

      const existingEntry = await LateEntry.findById(id);
      if (!existingEntry) {
        return res.status(404).json({ message: 'Late entry not found' });
      }

      if (existingEntry.studentId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You can only resubmit your own entries' });
      }

      // --- 🛑 START OF MODIFIED LOGIC ---

      let nextStatus = 'Resubmitted'; // Default for Faculty review
      let nextHODStatus = 'N/A';
      let hodIdToUse = null;
      let facultyActionable = true;
      let newRequiresHODApproval = existingEntry.requiresHODApproval; // Keep existing value unless changed

      // RE-EVALUATE HOD REQUIREMENT (This accounts for the student "escalating" based on history or specific condition)
      const historyRequiresHOD = await checkHODNeed(req.user.id);
      console.log(`DEBUG: resubmitEntry - checkHODNeed returned: ${historyRequiresHOD}`);
      
      if (historyRequiresHOD) {
        newRequiresHODApproval = true;
        nextStatus = 'Pending HOD';
        nextHODStatus = 'Pending';
        facultyActionable = false;

        // Find HOD (same logic as createLateEntry)
        const userDepartment = existingEntry.department; // Use department from the entry itself
        const departmentRegex = new RegExp(`^${userDepartment}$`, 'i');
        const hod = await Faculty.findOne({ 
            department: departmentRegex, 
            designation: new RegExp('^HOD', 'i') 
        });

        if (!hod) {
            return res.status(400).json({ success: false, message: 'No HOD found for department on escalation.' });
        }
        hodIdToUse = hod._id;
      }
      
      // If the entry was originally HOD-required but the student made no change, route back to HOD
      if (existingEntry.requiresHODApproval && !historyRequiresHOD) {
         nextStatus = 'Pending HOD';
         nextHODStatus = 'Pending';
         facultyActionable = false;
         hodIdToUse = existingEntry.HODId; // Use original HOD ID
      }


      const updatedEntry = await LateEntry.findByIdAndUpdate(
        id,
        {
          reason,
          status: nextStatus,
          HODStatus: nextHODStatus,
          resubmittedAt: new Date(),
          $inc: { resubmissionCount: 1 },
          isFinal: false,
          
          // CRITICAL UPDATES: Update the routing fields
          HODId: hodIdToUse || existingEntry.HODId, // Update HODId if newly escalated, otherwise keep original
          requiresHODApproval: newRequiresHODApproval,
          FacultyActionable: facultyActionable, 
        },
        { new: true, runValidators: true }
      );

      // --- END OF MODIFIED LOGIC ---

      res.status(200).json({ success: true, lateEntry: updatedEntry });
    } catch (err) {
      console.error("Error in resubmitEntry:", err); // Added error logging
      res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/latecomers (Generic: Superadmin or all department entries)
exports.getLateEntries = async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== 'superadmin') {
      const departmentRegex = new RegExp(`^${req.user.department}$`, 'i');
      query = { department: departmentRegex };
    }

    const lateEntriesQuery = LateEntry.find(query).sort({ createdAt: -1 });
    const lateEntries = await populateLateEntry(lateEntriesQuery);

    res.status(200).json({ success: true, data: lateEntries });
  } catch (err) {
    console.error('Error in getLateEntries:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Other Helper/Utility Controllers
exports.checkHODNeedController = async (req, res) => {
  try {
    const needsHOD = await checkHODNeed(req.user.id);
    res.json({ success: true, needsHODApproval: needsHOD });
  } catch (err) {
    console.error('Error checking HOD need:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all late entry history for HOD's department
// @route   GET /api/latecomers/hod/history
// @access  Private (HOD)
exports.getHODLateEntryHistory = async (req, res) => {
  try {
    const { statusFilter, from, to } = req.query; // Get filter from query params
    const department = req.user.department;
    if (!department) {
      return res.status(400).json({ success: false, message: 'HOD user does not have a department assigned.' });
    }

    let queryCriteria = { department: department };

    // APPLY THE FILTER LOGIC for status
    if (statusFilter === 'Rejected') {
        queryCriteria.status = 'Rejected';
        queryCriteria.isFinal = false; // Only non-final rejected entries (resubmittable)
    } else if (statusFilter === 'Pending') {
        queryCriteria.status = { $in: ['Pending Faculty', 'Pending HOD', 'Resubmitted'] };
    } else if (statusFilter === 'Approved') {
        queryCriteria.status = 'Approved';
        queryCriteria.isFinal = true; // Only final approved entries
    }

    // APPLY THE FILTER LOGIC for dates
    if (from || to) {
        queryCriteria.createdAt = {};
        if (from) {
            queryCriteria.createdAt.$gte = new Date(from);
        }
        if (to) {
            // Set to the end of the day for the 'to' date
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            queryCriteria.createdAt.$lte = toDate;
        }
    }

    const history = await LateEntry.find(queryCriteria)
      .populate('studentId', 'fullName studentId')
      .populate('facultyId', 'fullName')
      .populate('HODId', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: history });
  } catch (err) {
    console.error('Error fetching HOD late entry history:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 🛑 EXPORT ALL FUNCTIONS
module.exports = {
  getFacultyPending: exports.getFacultyPending,
  getHODPending: exports.getHODPending,
  getApprovedByDepartment: exports.getApprovedByDepartment,
  facultyAction: exports.facultyAction,
  hodAction: exports.hodAction,
  createLateEntry: exports.createLateEntry,
  getStudentEntries: exports.getStudentEntries,
  checkHODNeedController: exports.checkHODNeedController,
  getStudentRejectedEntries: exports.getStudentRejectedEntries,
  getLateEntryById: exports.getLateEntryById,
  resubmitEntry: exports.resubmitEntry,
  getLateEntries: exports.getLateEntries,
  updateLateEntry: exports.updateLateEntry,
  getFacultyLateEntries: exports.getFacultyLateEntries,
  getFacultyStats: exports.getFacultyStats,
  getHODLateEntryHistory: exports.getHODLateEntryHistory
};