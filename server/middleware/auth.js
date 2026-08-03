// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../Genc.DAL/models/User');

exports.requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn('[Auth Middleware] requireAuth: No token provided.');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.warn({ error: err.message }, '[Auth Middleware] requireAuth: Invalid or expired token.');
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    logger.debug({ user: req.user }, '[Auth Middleware] requireAuth: Token verified successfully.');
    next();
  });
};

exports.requireRole = (...roles) => {
  const requiredRoles = roles.flat();

  return (req, res, next) => {
    const userRole = req.user?.activeRole || req.user?.role;
    logger.debug({ userRole, requiredRoles }, '[Auth Middleware] requireRole: Checking role permissions.');

    if (!userRole) {
      logger.warn('[Auth Middleware] requireRole: Access denied. Role not defined for user.');
      return res.status(403).json({ message: 'Access denied. Role not defined.' });
    }

    const isAuthorized = requiredRoles.some((requiredRole) => {
      if (typeof requiredRole !== 'string') {
        logger.error({ requiredRole }, '[Auth Middleware] requireRole received non-string role');
        return false;
      }
      return userRole.toLowerCase() === requiredRole.toLowerCase();
    });

    if (isAuthorized) {
      logger.debug('[Auth Middleware] requireRole: User authorized.');
      next();
    } else {
      logger.warn({ userRole, requiredRoles }, '[Auth Middleware] requireRole: Access denied. Insufficient permissions.');
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
  };
};

exports.attachUserDoc = async (req, res, next) => {
  try {
    const { id } = req.user || {};
    if (!id) return next();

    req.userDoc = await User.findById(id).select('-password');
    next();
  } catch (err) {
    logger.error({ error: err }, '[Auth Middleware] attachUserDoc error');
    next(err);
  }
};