const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// ---------------- Student Auth ----------------
router.post("/signin", authController.studentLogin);

// ---------------- Faculty Auth ----------------
router.post("/faculty-login", authController.facultyLogin);

// ---------------- Token Handling ----------------
router.post("/refresh", authController.refreshToken);

// ---------------- Password Reset ----------------
router.post("/send-reset", authController.forgotPassword);
router.post("/forget", authController.resetPassword);

module.exports = router;
