const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireAuth, requireRole } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');
const LateEntry = require('../models/LateEntry');
const Student = require('../models/student');
const AuditLog = require('../models/AuditLog');

// POST /api/latecomers
// Body: { reason, entryTime? }
// Role: student
router.post('/', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { reason, entryTime } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const doc = await LateEntry.create({
      student: req.user.id,                   // comes from JWT
      reason,
      entryTime: entryTime ? new Date(entryTime) : new Date(),
      status: 'Pending',
    });

    res.status(201).json({ success: true, lateEntry: doc });
  } catch (err) {
    console.error('Late entry create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/latecomers/pending
// Role: faculty
router.get('/pending', requireAuth, requireRole('faculty'), async (req, res) => {
  try {
    const results = await LateEntry.find({ status: 'Pending' })
      .populate('student', 'name studentId photo')
      .sort({ entryTime: -1 });

    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

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
      .isIn(['Approved', 'Declined'])
      .withMessage('Status must be either Approved or Declined'),
    body('remarks').optional().trim().escape(),
    body('status').custom(async (value, { req }) => {
      const entry = await LateEntry.findById(req.params.id);
      if (entry && entry.status !== 'Pending') {
        return Promise.reject('Entry has already been processed');
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

      const entry = await LateEntry.findById(id);
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
          processedBy: req.user.id,
          processedAt: new Date(),
        },
        { new: true }
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

      res.status(200).json({
        success: true,
        message: 'Entry updated successfully',
        data: updatedEntry
      });

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

// GET /api/latecomers/mine
// Role: student
router.get('/mine', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const entries = await LateEntry.find({ student: req.user.id }).sort({ entryTime: -1 });
    res.json({ success: true, entries });
  } catch (err) {
    console.error('Fetch mine error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

