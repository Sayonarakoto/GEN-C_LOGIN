const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Faculty = require('../models/Faculty');
const { protectFacultyRoute } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads'); // ✅ fix path
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only .jpg and .png files are allowed!'), false);
    }
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File size limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Multer error handler
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Max 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// ===================== REGISTER =====================
router.post('/register', upload.single('profilePhoto'), handleMulterError, async (req, res) => {
  const { fullName, email, employeeId, department, designation, password } = req.body;

  try {
    let existing = await Faculty.findOne({ $or: [{ email }, { employeeId }] });
    if (existing) {
      return res.status(400).json({ message: 'Faculty already exists with this email or ID' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const faculty = new Faculty({
      fullName,
      email,
      employeeId,
      department,
      designation,
      password: hashedPassword,
      profilePhoto: req.file ? req.file.path : null
    });

    await faculty.save();

    // Generate token
    const token = jwt.sign({ id: faculty._id, role: 'faculty' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'Faculty registered successfully',
      token,
      faculty: {
        id: faculty._id,
        fullName: faculty.fullName,
        email: faculty.email,
        employeeId: faculty.employeeId,
        department: faculty.department,
        designation: faculty.designation,
        profilePhoto: faculty.profilePhoto
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
// ===================== PROFILE (protected) =====================
router.get('/profile', protectFacultyRoute, async (req, res) => {
  try {
    res.json({
      success: true,
      faculty: req.faculty
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

module.exports = router;
