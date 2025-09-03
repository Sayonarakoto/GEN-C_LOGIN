const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// signup & login
router.post('/signup', authController.signup);
router.post("/signin", authController.signin);
// password reset
router.post('/send-reset', authController.forgotPassword);
router.post('/forget', authController.refreshToken);

// refresh token (optional)
router.post('/refresh', authController.refreshToken);

module.exports = router;
