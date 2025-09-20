const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const Faculty = require('../models/Faculty');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only .jpg and .png files are allowed!'), false);
    }
    cb(null, true);
  }
});

// ===================== REGISTER =====================
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { fullName, email, employeeId, department, designation, password } = req.body;
    const profilePhoto = req.file ? req.file.filename : null;

    // Check if faculty already exists
    const existingFaculty = await Faculty.findOne({ 
      $or: [{ email }, { employeeId }] 
    });

    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: 'Faculty member already exists with this email or employee ID'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new faculty
    const faculty = new Faculty({
      fullName,
      email,
      employeeId,
      department,
      designation,
      password: hashedPassword,
      profilePhoto
    });

    await faculty.save();

    res.status(201).json({
      success: true,
      message: 'Faculty registered successfully'
    });

  } catch (error) {
    console.error('Faculty registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering faculty'
    });
  }
});
// ===================== PROFILE (protected) =====================
router.get('/profile', protect, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id).select('-password');
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    res.json({
      success: true,
      faculty
    });
  } catch (error) {
    console.error('Get faculty profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty profile'
    });
  }
});

// Update faculty profile
router.put('/profile', protect, upload.single('profilePhoto'), async (req, res) => {
  try {
    const { fullName, email, department, designation } = req.body;
    const updateData = {
      fullName,
      email,
      department,
      designation
    };

    if (req.file) {
      updateData.profilePhoto = req.file.filename;
    }

    const faculty = await Faculty.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      faculty,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update faculty profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating faculty profile'
    });
  }
});

// Get faculty by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id).select('-password');
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    res.json({
      success: true,
      faculty
    });
  } catch (error) {
    console.error('Get faculty by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty'
    });
  }
});

module.exports = router;
