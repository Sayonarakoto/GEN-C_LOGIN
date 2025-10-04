const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, attachUserDoc } = require('../middleware/auth');
const { body, param } = require('express-validator');
const latecomerController = require('../controllers/latecomerController');
const facultyController = require('../controllers/facultyController'); // NEW: Import facultyController

// 👇 1. ADD THIS ROUTE TO FIX THE 404 ERROR
router.get('/', requireAuth, latecomerController.getLateEntries);

// FACULTY/HOD ROUTES
router.get('/faculty/pending', requireAuth, requireRole(['faculty', 'HOD']), attachUserDoc, latecomerController.getFacultyPending);
router.get('/hod/pending', requireAuth, requireRole('HOD'), attachUserDoc, latecomerController.getHODPending);
router.get('/department/approved', requireAuth, requireRole(['faculty', 'HOD']), attachUserDoc, latecomerController.getApprovedByDepartment); 

router.put('/:id/faculty-action',
    requireAuth,
    requireRole('faculty'),
    attachUserDoc,
    [
        param('id').isMongoId().withMessage('Invalid entry ID'),
        body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
        body('remarks').optional().trim().escape()
    ],
    latecomerController.facultyAction
);

router.put('/:id/hod-action',
    requireAuth,
    requireRole('HOD'),
    attachUserDoc,
    [
        param('id').isMongoId().withMessage('Invalid entry ID'),
        body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
        body('remarks').optional().trim().escape()
    ],
    latecomerController.hodAction
);


// STUDENT ROUTES
router.post('/', 
  requireAuth, 
  requireRole('student'), 
  attachUserDoc, 
  [
    body('reason').notEmpty().withMessage('Reason is required').trim().escape(),
    body('facultyId').isMongoId().withMessage('A faculty member must be assigned.'),
    body('requiresHODApproval').default(false).isBoolean(),
    body('date').optional().isISO8601(),
    body('reasonCategory').optional().isString().trim().escape(),
  ],
  latecomerController.createLateEntry
);

router.get('/mine', requireAuth, requireRole('student', 'faculty'), latecomerController.getStudentEntries);

router.get('/check-hod-need', requireAuth, requireRole('student'), latecomerController.checkHODNeedController);

router.get('/rejected-for-student', requireAuth, requireRole('student'), latecomerController.getStudentRejectedEntries);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid entry ID')],
  requireAuth,
  requireRole('student', 'faculty', 'security'),
  latecomerController.getLateEntryById
);

router.put('/:id',
  requireAuth,
  requireRole('student'),
  [
    param('id').isMongoId().withMessage('Invalid entry ID'),
    body('reason').notEmpty().withMessage('Reason is required').trim().escape(),
    body('date').isISO8601().withMessage('Date must be a valid ISO 8601 date'),
    body('status').optional().isIn(['Resubmitted']).withMessage('Status can only be Resubmitted')
  ],
  latecomerController.resubmitEntry
);

// New route for general update of a late entry (for students to edit their own non-final entries)
router.put('/:id/update',
  requireAuth,
  requireRole('student'),
  [
    param('id').isMongoId().withMessage('Invalid entry ID'),
    body('reason').notEmpty().withMessage('Reason is required').trim().escape(),
    body('facultyId').isMongoId().withMessage('A faculty member must be assigned.'),
    body('reasonCategory').optional().isString().trim().escape(),
  ],
  latecomerController.updateLateEntry
);

// New route for faculty to get all their assigned late entries with optional status filter
router.get('/faculty/all',
  requireAuth,
  requireRole(['faculty', 'HOD']),
  attachUserDoc,
  (req, res, next) => {
    if (req.user.role === 'HOD') {
      return latecomerController.getFacultyStats(req, res);
    }
    next();
  },
  latecomerController.getFacultyLateEntries
);

// Route for faculty to get dashboard stats
router.get('/faculty/stats',
  requireAuth,
  requireRole(['faculty', 'HOD']),
  attachUserDoc,
  latecomerController.getFacultyStats
);

module.exports = router;