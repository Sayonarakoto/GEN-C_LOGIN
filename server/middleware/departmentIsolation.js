// server/middleware/departmentIsolation.js

const LateEntry = require('../models/LateEntry');

/**
 * Middleware: Enforce departmental isolation for Faculty/HOD
 * Ensures users can only access data from their own department
 */
exports.enforceDepartmentIsolation = async (req, res, next) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    const userDepartment = req.user?.department;

    console.log(`[Department Isolation] enforceDepartmentIsolation: User Role: ${userRole}, User Department: ${userDepartment}`);

    // Only apply to Faculty and HOD roles
    if (userRole !== 'faculty' && userRole !== 'hod') {
      console.log(`[Department Isolation] Skipping for role: ${userRole}`);
      return next();
    }

    // Verify department exists in JWT
    if (!userDepartment) {
      console.warn(`[Department Isolation] Access denied: User ${req.user?.id} is not assigned to a department.`);
      return res.status(403).json({
        success: false,
        message: 'User is not assigned to a department',
        code: 'DEPARTMENT_MISSING'
      });
    }

    // Attach department filter to request for downstream use
    req.departmentFilter = { studentDepartment: userDepartment };
    req.userDepartment = userDepartment;
    console.log(`[Department Isolation] Department filter set for ${userDepartment}.`);

    next();
  } catch (error) {
    console.error('[Department Isolation] Error enforcing department isolation:', error);
    res.status(500).json({
      success: false,
      message: 'Error enforcing department isolation',
      code: 'ISOLATION_ERROR'
    });
  }
};

/**
 * Middleware: Verify request ownership for specific entry
 * Used for PUT/DELETE operations on individual entries
 */
exports.verifyEntryDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role?.toLowerCase();
    const userDepartment = req.user?.department;

    // 1. LOAD THE ENTRY FOR EVERYONE (Faculty, HOD, Student)
    const entry = await LateEntry.findById(id); 
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Late entry not found',
        code: 'ENTRY_NOT_FOUND'
      });
    }

    // 2. ENFORCE DEPARTMENT CHECK (Only for Faculty/HOD)
    if (userRole !== 'student') {
        if (entry.studentDepartment !== userDepartment) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Entry belongs to a different department',
                code: 'DEPARTMENT_MISMATCH'
            });
        }
    } else {
        // 3. ENFORCE STUDENT OWNERSHIP (Only for Student)
        if (entry.studentId.toString() !== req.user.id) {
             return res.status(403).json({
                success: false,
                message: 'Forbidden: You can only view/resubmit your own late entries',
                code: 'OWNERSHIP_MISMATCH'
            });
        }
    }

    // 4. ATTACH ENTRY FOR DOWNSTREAM USE (Critical)
    req.lateEntry = entry;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying entry department',
      code: 'VERIFICATION_ERROR'
    });
  }
};
