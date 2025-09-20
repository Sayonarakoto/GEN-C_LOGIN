console.log('--- auth.js LOADED ---'); // Unique log
const express = require("express");
const router = express.Router();
const authController = require('../controllers/authController');

// Add debug logging
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    console.log('Auth Route:', req.method, req.path);
    next();
  });
}

// ---------------- Student Auth ----------------
router.post("/signin", authController.studentLogin);  // This is the actual endpoint

// ---------------- Faculty Auth ----------------
router.post("/faculty-login", authController.facultyLogin);

// ---------------- Security Auth ----------------
router.post('/security-login', authController.securityLogin);

// ---------------- Token Handling ----------------
router.post("/refresh", authController.refreshToken);

// ---------------- Password Reset ----------------
router.post("/send-reset", authController.forgotPassword);
router.post("/forget", authController.resetPassword);

// ---------------- Unified Login ----------------
router.post("/login", authController.unifiedLogin);

module.exports = router;