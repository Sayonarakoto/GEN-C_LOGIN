const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  department: { type: String, required: true },
  year: { type: String, required: true },
  tempPassword: { type: String, required: true }, // New field for plain-text temporary password
  passwordHash: { type: String, required: false }, // Renamed from 'password', will store hashed password later
  passwordResetToken: String,
  passwordResetExpires: Date,
});

module.exports = mongoose.model("Student", studentSchema);