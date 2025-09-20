// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const Student = require('../models/student');
const Faculty = require('../models/Faculty');
const Security = require('../models/security');

exports.verifyJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.checkRole = (...allowed) => (req, res, next) => {
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

// Optionally load full user object based on role:
exports.attachUserDoc = async (req, res, next) => {
  try {
    const { id, role } = req.user || {};
    if (!id || !role) return next();
    if (role === 'student') req.student = await Student.findById(id).select('-password');
    if (role === 'faculty') req.faculty = await Faculty.findById(id).select('-password');
    if (role === 'security') req.security = await Security.findById(id).select('-password');
    next();
  } catch (err) {
    next(err);
  }
};
