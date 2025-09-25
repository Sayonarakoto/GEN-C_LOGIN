// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const Student = require('../models/student');
const Faculty = require('../models/Faculty');
const Security = require('../models/security');

exports.requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Auth Header:', authHeader);
  console.log('Extracted Token:', token ? `${token.substring(0, 20)}...` : 'No token');

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    console.log('Token verified successfully. User:', decoded);
    req.user = decoded;
    next();
  });
};

exports.requireRole = (...roles) => (req, res, next) => {
  console.log(`Checking for role: ${roles}. User role is: ${req.user?.role}`);
  if (!req.user || !roles.includes(req.user.role)) {
    console.log('Role check failed.');
    return res.status(403).json({ message: 'Forbidden' });
  }
  console.log('Role check passed.');
  next();
};

// Optionally load full user object based on role:
exports.attachUserDoc = async (req, res, next) => {
  try {
    const { id, role } = req.user || {};
    if (!id || !role) return next();
    if (role === 'student') req.student = await Student.findById(id).select('-password');
    if (role === 'faculty' || role === 'HOD') req.faculty = await Faculty.findById(id).select('-password');
    if (role === 'security') req.security = await Security.findById(id).select('-password');
    next();
  } catch (err) {
    next(err);
  }
};
