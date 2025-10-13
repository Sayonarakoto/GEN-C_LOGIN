const express = require('express');
const router = express.Router();
const qrGatePassController = require('../controllers/qrGatePassController');

// Route for admin to create a QR gate pass
router.post('/create', qrGatePassController.createPass);

// Route for gate attendant to verify a QR gate pass
router.post('/verify', qrGatePassController.verifyPass);

module.exports = router;
