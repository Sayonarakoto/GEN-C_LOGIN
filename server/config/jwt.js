const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const PASS_TOKEN_SECRET = process.env.PASS_TOKEN_SECRET; // Dedicated secret for pass JWTs

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (!PASS_TOKEN_SECRET) {
  throw new Error('PASS_TOKEN_SECRET environment variable is required');
}

const JWT_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES || '24h';

exports.generateToken = (payload, secret = JWT_SECRET, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(payload, secret, { expiresIn });
};

exports.verifyToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token missing or invalid');
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

exports.validatePassToken = (qr_token) => {
  try {
    const decoded = jwt.verify(qr_token, PASS_TOKEN_SECRET);
    return {
      isValid: true,
      payload: decoded
    };
  } catch (error) {
    const reason = error.name === 'TokenExpiredError' ? 'Expired' : 'Invalid';
    return {
      isValid: false,
      reason: reason
    };
  }
};