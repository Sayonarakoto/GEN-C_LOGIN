// server/middleware/securityAuthorization.js

/**
 * Middleware: Verify user is a Security Officer
 */
exports.requireSecurity = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();
  
  if (userRole !== 'security') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Security role required',
      code: 'SECURITY_REQUIRED'
    });
  }
  
  next();
};

/**
 * Middleware: Verify user is a Security Supervisor
 */
exports.requireSecuritySupervisor = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();
  
  if (userRole !== 'security_supervisor') { // Assuming 'security_supervisor' is the role name
    return res.status(403).json({
      success: false,
      message: 'Access denied: Security Supervisor role required',
      code: 'SECURITY_SUPERVISOR_REQUIRED'
    });
  }
  
  next();
};