
const requireFacultyOrHOD = (req, res, next) => {
  if (req.user && (req.user.role === 'Faculty' || req.user.role === 'HOD')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: Access is restricted to Faculty and HOD roles.' });
  }
};

module.exports = requireFacultyOrHOD;
