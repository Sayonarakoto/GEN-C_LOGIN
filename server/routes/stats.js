const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { requireAuth } = require('../middleware/auth'); // Assuming this is the correct path
const requireFacultyOrHOD = require('../middleware/facultyOrHodAuthorization');

// Apply auth middleware to all routes in this file
router.use(requireAuth);
router.use(requireFacultyOrHOD);

// Gate Pass Stats
router.get('/gatepass', statsController.getGatePassStats);

// Special Pass Stats
router.get('/specialpass', statsController.getSpecialPassStats);

// Late Entry Stats
router.get('/lateentry', statsController.getLateEntryStats);

module.exports = router;
