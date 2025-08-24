const express = require("express");
const bcrypt = require("bcrypt");
const Student = require("../models/student");

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("The auth router is working!");
});

// Student login
router.post("/signin", async (req, res) => {
  try {
    const { uid, password } = req.body; // Changed from studentId to uid
    
    // Find student by uid
    const student = await Student.findOne({ uid });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Success
    res.json({
      message: "Login successful",
      student: {
        uid: student.uid,
        fullName: student.fullName,
        email: student.email,
        department: student.department,
        year: student.year,
      },
    });
  } catch (error) {
    console.error("❌ Error logging in:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
