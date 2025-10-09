const express = require("express");
const router = express.Router();
const authController = require('../controllers/authController');
const { passwordResetLimiter } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Files will be stored in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
  }
});

const upload = multer({ storage: storage });

// Add debug logging
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    console.log('Auth Route:', req.method, req.path);
    next();
  });
}

// ---------------- Student Auth ----------------
router.post("/signin", authController.studentLogin);  // This is the actual endpoint
router.post("/register", upload.single('profilePhoto'), authController.register); // New registration route with file upload

// ---------------- Faculty Auth ----------------
router.post("/faculty-login", authController.facultyLogin);

// ---------------- Security Auth ----------------
router.post('/security-login', authController.securityLogin);

// ---------------- Token Handling ----------------
router.post("/refresh", authController.refreshToken);

// ---------------- Password Reset ----------------
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, authController.resetPassword);

// ---------------- Unified Login ----------------
router.post("/login", authController.unifiedLogin);

module.exports = router;