// server/middleware/facultyAuthorization.js

/**
 * Middleware: Verify user is Faculty (not HOD)
 */
exports.requireFaculty = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();
  
  if (userRole !== 'faculty') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Faculty role required',
      code: 'FACULTY_REQUIRED'
    });
  }
  
  next();
};

/**
 * Middleware: Validate Faculty can approve this entry
 * Checks:
 * 1. If requiresHODApproval is true, HODStatus must be 'Approved'
 * 2. Entry status must be 'Pending' or 'Resubmitted'
 * 3. Entry belongs to Faculty's department (via departmentIsolation)
 */
exports.validateFacultyApproval = async (req, res, next) => {
  try {
    const entry = req.lateEntry; // Populated by verifyEntryDepartment
    const { status } = req.body;
    
    if (!entry) {
      return res.status(400).json({
        success: false,
        message: 'Entry not loaded. Ensure verifyEntryDepartment runs first.',
        code: 'ENTRY_NOT_LOADED'
      });
    }

    // Verify entry is in actionable state before any decision
    if (!['Pending', 'Resubmitted'].includes(entry.status)) {
      return res.status(400).json({
        success: false,
        message: `Entry has already been ${entry.status.toLowerCase()}`,
        code: 'ENTRY_ALREADY_PROCESSED'
      });
    }

    // Allow immediate decline once state is validated
    if (status === 'Rejected') {
      return next();
    }

    // For approval, check HOD prerequisite
    if (status === 'Approved') {
      if (entry.requiresHODApproval && entry.HODStatus !== 'Approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot approve: Awaiting HOD Tier 1 approval',
          code: 'HOD_APPROVAL_PENDING',
          details: {
            requiresHODApproval: entry.requiresHODApproval,
            currentHODStatus: entry.HODStatus
          }
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating faculty approval',
      code: 'VALIDATION_ERROR'
    });
  }
};