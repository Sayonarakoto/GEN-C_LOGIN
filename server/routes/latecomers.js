const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const LateEntry = require('../models/LateEntry');
const Student = require('../models/student');

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
    console.log('Fetching pending requests...');
    console.log('Authenticated user:', req.user); // Log the authenticated user
    
    const results = await LateEntry.aggregate([
      { $match: { status: 'Pending' } },
      { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      // Optionally filter by department:
      // { $match: { 'student.department': req.faculty.department } },
      { $sort: { entryTime: -1 } },
    ]);

    console.log('Found pending requests:', results.length);
    console.log('Requests data:', results);
    
    res.status(200).json({ success: true, entries: results });
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// PUT /api/latecomers/:id/status
// Body: { status: 'Approved' | 'Declined' }
// Role: faculty
router.put('/:id/status', requireAuth, requireRole('faculty'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await LateEntry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Late entry not found' });
    res.json({ success: true, lateEntry: updated });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

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