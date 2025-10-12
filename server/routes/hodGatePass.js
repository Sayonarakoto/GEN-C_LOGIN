const express = require('express');
const router = express.Router();
const {
  getHODPendingGatePasses,
  hodApproveGatePass,
  hodRejectGatePass,
  getHODDepartmentStats,
  getHODGatePassHistory,
} = require('../controllers/hodGatePassController');
// Assuming requireAuth and requireRole are essential for initial checks
const { requireAuth, requireRole } = require('../middleware/auth');
// Custom HOD-specific authorization and department checks
// const { hodAuthorization } = require('../middleware/hodAuthorization'); // Removed as it was causing TypeError
const { enforceDepartmentIsolation } = require('../middleware/departmentIsolation');

/* NOTE: This router file is intended to be mounted at a base path like: 
  app.use('/api/gatepass/hod', require('./routes/hodGatePassRoutes'));
  
  We apply the core HOD middlewares once to the whole router instance.
*/

// --- Middleware Chain Simplification ---
// Define a core middleware chain that applies to all HOD routes
const HOD_ACCESS = [
    requireAuth, 
    requireRole('HOD'), 
    enforceDepartmentIsolation
];

// --- HOD Routes for Gate Passes ---

// @route GET /api/gatepass/hod/pending
// @desc    Get pending gate passes for HOD approval
// @access  Private (HOD)
router.get('/pending', HOD_ACCESS, getHODPendingGatePasses);

// @route PUT /api/gatepass/hod/approve/:id
// @desc    HOD approves/finalizes a gate pass
// @access  Private (HOD)
// FIX: Removed redundant '/hod' from the route path
router.put('/approve/:id', HOD_ACCESS, hodApproveGatePass);

// @route PUT /api/gatepass/hod/reject/:id
// @desc    HOD rejects a gate pass
// @access  Private (HOD)
// FIX: Removed redundant '/hod' from the route path
router.put('/reject/:id', HOD_ACCESS, hodRejectGatePass);

// @route GET /api/gatepass/hod/history
// @desc    Get all gate pass history for HOD's department
// @access  Private (HOD)
// FIX: Removed redundant '/hod' from the route path
router.get('/history', HOD_ACCESS, getHODGatePassHistory);

// @route GET /api/gatepass/hod/stats
// @desc    Get department-wide gate pass statistics for HOD
// @access  Private (HOD)
// FIX: Removed redundant '/hod' from the route path
router.get('/stats', HOD_ACCESS, getHODDepartmentStats);

module.exports = router;