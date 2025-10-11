const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Assuming this exists
const { getHODPendingGatePasses, hodApproveGatePass, hodRejectGatePass } = require('../controllers/hodGatePassController');

// All HOD routes should use a middleware to ensure the user is an HOD
// You might need an additional role middleware here: protect, isHOD
router.get('/pending', protect, getHODPendingGatePasses);
router.put('/approve/:id', protect, hodApproveGatePass);
router.put('/reject/:id', protect, hodRejectGatePass);

module.exports = router;