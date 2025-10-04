// server/middleware/hodAuthorization.js

/**
 * Middleware: Verify user is an HOD
 */
exports.requireHOD = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();
  
  if (userRole !== 'hod') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: HOD role required',
      code: 'HOD_REQUIRED'
    });
  }
  
  next();
};

/**
 * Middleware: Validate HOD can take action on this entry
 * Checks:
 * 1. Entry requires HOD approval
 * 2. HOD status is still 'Pending'
 * 3. Entry belongs to HOD's department (via departmentIsolation)
 */
exports.validateHODAction = async (req, res, next) => {
  try {
    const entry = req.lateEntry; // Populated by verifyEntryDepartment
    
    if (!entry) {
      return res.status(400).json({
        success: false,
        message: 'Entry not loaded. Ensure verifyEntryDepartment runs first.',
        code: 'ENTRY_NOT_LOADED'
      });
    }

    // Check if entry requires HOD approval
    if (!entry.requiresHODApproval) {
      return res.status(400).json({
        success: false,
        message: 'This entry does not require HOD approval',
        code: 'HOD_APPROVAL_NOT_REQUIRED'
      });
    }

    // Check if HOD has already acted
    if (entry.HODStatus !== 'Pending') {
      const normalizedStatus =
        String(entry.HODStatus ?? '').trim().toLowerCase() || 'processed';

      return res.status(400).json({
        success: false,
        message: `HOD has already ${normalizedStatus} this request`,
        code: 'HOD_ALREADY_ACTED'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating HOD action',
      code: 'VALIDATION_ERROR'
    });
  }
};