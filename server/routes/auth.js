const express = require('express');
const bcrypt = require('bcrypt');
const Student = require('../models/student');

const router = express.Router();

// @route   POST /auth/signin
// @desc    Register a new student
router.post('/signin', async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    // hash password
    const hashpass = await bcrypt.hash(req.body.password, 10);

    // create student in DB
    const student = await Student.create({
      uid: req.body.uid,
      password: hashpass
    });

    res.json({ message: "✅ Student created successfully", student });
  } catch (err) {
    console.error("❌ Error creating student:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
