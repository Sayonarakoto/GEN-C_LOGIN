const express = require('express');
const multer = require('multer');
const path = require('path');
const Faculty = require('../models/Faculty'); // Adjust path as needed

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});
const upload = multer({ storage: storage });

router.post('/register', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { fullName, email, employeeId, department, designation } = req.body;
    const profilePhoto = req.file ? req.file.filename : null;

    const newFaculty = new Faculty({
      fullName,
      email,
      employeeId,
      department,
      designation,
      profilePhoto,
    });

    await newFaculty.save();
    res.status(201).json({ message: 'Registration successful!' });
  } catch (err) {
    console.error(err);
    // Check for the specific duplicate key error code from MongoDB
    if (err.code === 11000) {
      // Find out which field caused the error
      const key = Object.keys(err.keyPattern)[0];
      const errorMessage = `Registration failed: A user with that ${key} already exists.`;
      return res.status(409).json({ message: errorMessage, error: err.message });
    }
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

module.exports = router;
