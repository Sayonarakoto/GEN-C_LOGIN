const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireHOD } = require('../middleware/hodAuthorization');
const hodSpecialPassController = require('../controllers/hodSpecialPassController');

/**
 * @route   PUT /api/hod/special-passes/:passId/approve
 * @desc    HOD approves a pending special pass
 * @access  Private (HOD)
 */
router.put(
  '/:passId/approve',
  requireAuth,
  requireHOD,
  hodSpecialPassController.approveSpecialPass
);

/**
 * @route   PUT /api/hod/special-passes/:passId/reject
 * @desc    HOD rejects a pending special pass
 * @access  Private (HOD)
 */
router.put(
  '/:passId/reject',
  requireAuth,
  requireHOD,
  hodSpecialPassController.rejectSpecialPass
);

/**
 * @route   GET /api/hod/special-passes
 * @desc    Get all pending special passes for the HOD's department
 * @access  Private (HOD)
 */
router.get(
  '/',
  requireAuth,
  requireHOD,
  hodSpecialPassController.getPendingSpecialPasses
);

/**
 * @route   POST /api/hod/special-passes/initiate
 * @desc    HOD initiates a special pass for a student
 * @access  Private (HOD)
 */
router.post(
  '/initiate',
  requireAuth,
  requireHOD,
  hodSpecialPassController.initiateSpecialPass
);

/**
 * @route   GET /api/hod/special-passes/history
 * @desc    Get all approved/rejected special passes for the HOD's department
 * @access  Private (HOD)
 */
router.get(
    '/history',
    requireAuth,
    requireHOD,
    hodSpecialPassController.getSpecialPassHistory
);

module.exports = router;