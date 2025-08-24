const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  department: { 
    type: String, 
    required: true, 
    enum: ["FS", "AUTOMOBLIE", "MECH-A","MECH-B", "CE", "EEE", "CT", "Other"] 
  },
  year: { 
    type: String, 
    required: true, 
    enum: ["1st", "2nd", "3rd"] 
  },
  email: { 
    type: String, 
    required: false, 
    unique: true, 
    sparse: true, // ✅ allows multiple nulls
    match: [/^\S+@\S+\.\S+$/, "Invalid email"] 
  },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Student", studentSchema);
