const jwt = require('jsonwebtoken');
const Faculty = require('../models/Faculty');

exports.protectFacultyRoute = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if faculty still exists
    const faculty = await Faculty.findById(decoded.id).select('-password');
    if (!faculty) {
      return res.status(401).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Add faculty to request object
    req.faculty = faculty;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};