// server/routes/lateEntries.js
const express = require('express');
const router = express.Router();
const { verifyJWT, checkRole } = require('../middleware/auth');
const LateEntry = require('../models/LateEntry');
const Student = require('../models/student');

router.post('/', verifyJWT, checkRole('security'), async (req, res) => {
  try {
    const { studentId, reason, recordedAt, gate } = req.body;
    
    // Validate required fields
    if (!studentId || !reason || !gate) {
      return res.status(400).json({ message: 'Missing required fields: studentId, reason, gate' });
    }
    
    // Validate date if provided
    if (recordedAt && isNaN(new Date(recordedAt))) {
      return res.status(400).json({ message: 'Invalid date format for recordedAt' });
    }
    
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const doc = await LateEntry.create({
      student: student._1,
      reason,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      gate,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, lateEntry: doc });
  } catch (error) {
    console.error('Error creating late entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/mine', verifyJWT, checkRole('student'), async (req, res) => {
  const entries = await LateEntry.find({ student: req.user.id }).sort({ recordedAt: -1 });
  res.json({ success: true, entries });
});

router.get('/', verifyJWT, checkRole('faculty'), async (req, res) => {
  const { department, from, to, status, page = 1, limit = 20 } = req.query;
  const match = {};
  if (status) match.status = status;
  if (from || to) {
    match.recordedAt = {};
    if (from) match.recordedAt.$gte = new Date(from);
    if (to) match.recordedAt.$lte = new Date(to);
  }
  const pipeline = [
    { $match: match },
    { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
  ];
  if (department) pipeline.push({ $match: { 'student.department': department } });
  pipeline.push({ $sort: { recordedAt: -1 } });
  pipeline.push({ $skip: (Number(page) - 1) * Number(limit) });
  pipeline.push({ $limit: Number(limit) });
  const results = await LateEntry.aggregate(pipeline);
  res.json({ success: true, entries: results });
});

router.patch('/:id/status', verifyJWT, checkRole('faculty'), async (req, res) => {
  const { status, remarks } = req.body;
  const updated = await LateEntry.findByIdAndUpdate(req.params.id, { status, remarks }, { new: true });
  res.json({ success: true, lateEntry: updated });
});

module.exports = router;
