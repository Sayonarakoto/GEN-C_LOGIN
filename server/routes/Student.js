const express = require("express");
const router = express.Router();
const Student = require("../models/student");
const bcrypt = require("bcrypt");

// Add student (by faculty)
router.post("/StudentForm", async (req, res) => {
  try {
    console.log("📩 /student/StudentForm hit");
    console.log("Request body:", req.body);

    const { studentId, fullName, email, department, year, password } = req.body;

    if (!studentId || !fullName || !password) {
      return res.status(400).json({ message: "All required fields (studentId, fullName, password) are needed." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new Student({
      studentId,
      fullName,
      email,
      department,
      year,
      password: hashedPassword,
    });

    await newStudent.save();
    console.log("✅ Student saved:", newStudent);

    res.status(201).json({ message: "Student added successfully", student: newStudent });
  } catch (error) {
    console.error("❌ Error adding student:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;
