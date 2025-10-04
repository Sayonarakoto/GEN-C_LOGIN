// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const Student = require('../models/student');
const Faculty = require('../models/Faculty');
const Security = require('../models/security');

exports.requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  });
};

exports.requireRole = (roles) => {
    // 1. Convert single role to array if necessary, and ensure all items are strings
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        const userRole = req.user?.role;
        
        if (!userRole) {
            return res.status(403).json({ message: 'Access denied. Role not defined.' });
        }

        const isAuthorized = requiredRoles.some(requiredRole => {
            // CRITICAL CHECK: Ensure requiredRole is a string before calling toLowerCase
            if (typeof requiredRole !== 'string') {
                 console.error('requireRole received a non-string role:', requiredRole);
                 return false; // Skip authorization for this invalid role
            }
            // Comparison is case-insensitive for robustness
            return userRole.toLowerCase() === requiredRole.toLowerCase();
        });

        if (isAuthorized) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
    };
};

// Optionally load full user object based on role:
exports.attachUserDoc = async (req, res, next) => {
  try {
    const { id, role } = req.user || {};
    if (!id || !role) return next();
    
    const normalizedRole = role.toLowerCase();
    
    if (normalizedRole === 'student') {
      req.student = await Student.findById(id).select('-password');
    }
    
    if (normalizedRole === 'faculty' || normalizedRole === 'hod') {
      req.faculty = await Faculty.findById(id).select('-password');
      
      if (!req.user.department && req.faculty?.department) {
        req.user.department = req.faculty.department;
      }
    }
    
    if (normalizedRole === 'security') {
      req.security = await Security.findById(id).select('-password');
    }
    
    next();
  } catch (err) {
    next(err);
  }
};