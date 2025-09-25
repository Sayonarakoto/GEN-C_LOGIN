const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  password: { type: String, required: true }, // The permanent password field
  tempPassword: { type: String }, // Temporary password for initial login

  // New fields for password reset functionality
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

module.exports = mongoose.model("Student", studentSchema);