const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, attachUserDoc } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');
const LateEntry = require('../models/LateEntry');
const AuditLog = require('../models/AuditLog');

// POST /api/latecomers
// Body: { reason, entryTime? }
// Role: student
router.post('/', requireAuth, requireRole('student'), attachUserDoc, async (req, res) => {
  try {
    const { reason, entryTime } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    // Get studentDepartment from req.student
    const studentDepartment = req.student.department;
    if (!studentDepartment) {
      return res.status(400).json({ message: 'Student department not found' });
    }

    const doc = await LateEntry.create({
      studentId: req.user.id,                   // comes from JWT
      studentDepartment: studentDepartment,     // Added studentDepartment
      reason,
      date: entryTime ? new Date(entryTime) : new Date(),
      status: 'Pending',
    });

    res.status(201).json({ success: true, lateEntry: doc });
  } catch (err) {
    console.error('Late entry create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/latecomers
// Role: faculty
router.get('/', requireAuth, requireRole('faculty'), attachUserDoc, async (req, res) => {
  console.log('GET /api/latecomers route hit!');
  console.log('Query parameters:', req.query);
  try {
    let query = {};
    if (req.query.status) {
      const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Resubmitted'];
      const statuses = req.query.status.split(',');
      const validStatuses = statuses.filter(status => allowedStatuses.includes(status));
      if (validStatuses.length === 0) {
        return res.status(400).json({ message: 'Invalid status values provided' });
      }
      query.status = { $in: validStatuses };
    }

    // --- Start of new filtering logic ---
    const facultyDepartment = req.faculty.department; // Get department from req.faculty
    const userRole = req.user.role;

    // Check if the user is logged in and has a department (for Faculty role)
    if (userRole === 'faculty' && !facultyDepartment) {
        return res.status(403).json({ message: 'User is not assigned to a department.' });
    }

    if (userRole === 'faculty') {
        // Faculty can only see entries from their department
        query.studentDepartment = facultyDepartment;
    }
    // If userRole is 'HOD', no additional department filter is applied,
    // meaning HODs can see all entries (or all from their college/area if implemented)
    // --- End of new filtering logic ---

    const results = await LateEntry.find(query)
      .populate('studentId', 'fullName studentId department')
      .sort({ entryTime: -1 });

    console.log('Populated results for /api/latecomers:', results);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching late entries:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// GET /api/latecomers/mine
// Role: student, faculty
router.get('/mine', requireAuth, requireRole('student', 'faculty'), async (req, res) => {
  try {
    console.log('Fetching late entries for student ID:', req.user.id);
    const entries = await LateEntry.find({ studentId: req.user.id }).sort({ entryTime: -1 });
    console.log('Found entries:', entries);
    res.json({ success: true, entries });
  } catch (err) {
    console.error('Fetch mine error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/latecomers/rejected-for-student
// Role: student
router.get('/rejected-for-student', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const rejectedEntries = await LateEntry.find({ studentId: req.user.id, status: 'Rejected' })
      .populate('studentId', 'fullName studentId department')
      .sort({ lastActionAt: -1 });

    res.status(200).json({ success: true, entries: rejectedEntries });
  } catch (err) {
    console.error('Error fetching rejected entries for student:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// GET /api/latecomers/:id
// Role: student, faculty, security
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid entry ID')],
  requireAuth,
  requireRole('student', 'faculty', 'security'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const lateEntry = await LateEntry.findById(id).populate('studentId', 'fullName studentId department');

      if (!lateEntry) {
        return res.status(404).json({ message: 'Late entry not found' });
      }

      // Optional: Add authorization check to ensure user can view this entry
      // For example, a student can only view their own entries
      if (req.user.role === 'student' && (!lateEntry.studentId || lateEntry.studentId._id.toString() !== req.user.id)) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own late entries' });
      }

      res.status(200).json({ success: true, lateEntry });
    } catch (err) {
      console.error('Error fetching single late entry:', err);
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }
);

// PUT /api/latecomers/:id/status
// Body: { status: 'Approved' | 'Declined', remarks?: string }
// Role: faculty
router.put(
  '/:id/status',
  requireAuth,
  requireRole('faculty'),
  [
    param('id').isMongoId().withMessage('Invalid entry ID'),
    body('status')
      .isIn(['Approved', 'Rejected'])
      .withMessage('Status must be either Approved or Rejected'),
    body('remarks').optional().trim().escape(),
    body('status').custom(async (value, { req }) => {
      const entry = await LateEntry.findById(req.params.id);
      if (entry && entry.status !== 'Pending' && entry.status !== 'Resubmitted') {
        return Promise.reject('Entry has already been processed or is not awaiting review');
      }
    }),
  ],
  async (req, res, next) => {
    console.log('--- Update Status Request Received ---');
    console.log('Request Params:', req.params);
    console.log('Request Body:', req.body);
    console.log('Authenticated User:', req.user);
    console.log('-------------------------------------');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      const entry = await LateEntry.findById(id); // Removed session: null
      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Late entry not found',
          code: 'ENTRY_NOT_FOUND'
        });
      }

      const updatedEntry = await LateEntry.findByIdAndUpdate(
        id,
        { 
          status,
          remarks: remarks || '',
        },
        { new: true } // Removed session: null and processedBy/processedAt
      );

      await AuditLog.create([
        {
          action: 'UPDATE_LATE_ENTRY_STATUS',
          entityType: 'LateEntry',
          entityId: id,
          userId: req.user.id,
          changes: { status, remarks },
        }
      ]);

      res.status(200).json({ success: true, message: 'Entry updated successfully', data: updatedEntry });

    } catch (error) {
      console.error('Error updating late entry status:', {
        error: error.message,
        stack: error.stack,
        entryId: req.params.id,
        userId: req.user?.id
      });
      next(error);
    }
  }
);

// PUT /api/latecomers/:id
// Body: { reason, date, status } // status is optional, defaults to Resubmitted
// Role: student
router.put('/:id',
  requireAuth,
  requireRole('student'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid entry ID'),
    body('reason')
      .notEmpty()
      .withMessage('Reason is required'),
    body('date')
      .isISO8601()
      .withMessage('Date must be a valid ISO 8601 date'),
    body('status')
      .optional()
      .isIn(['Resubmitted'])
      .withMessage('Status can only be Resubmitted')
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { reason, date, status } = req.body;

      // Add authorization check before update
      const existingEntry = await LateEntry.findById(id);
      if (!existingEntry) {
        return res.status(404).json({ message: 'Late entry not found' });
      }

      if (existingEntry.studentId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You can only resubmit your own entries' });
      }

      const updatedEntry = await LateEntry.findByIdAndUpdate(
        id,
        {
          reason,
          date,
          status: status || 'Resubmitted', // Default to Resubmitted if not provided
          resubmittedAt: new Date(),
          $inc: { resubmissionCount: 1 },
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({ success: true, lateEntry: updatedEntry });
    } catch (err) {
      console.error('Error resubmitting late entry:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;