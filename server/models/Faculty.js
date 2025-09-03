const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  profilePhoto: { type: String }, // Store image filename or URL if uploading file separately
}, { timestamps: true });

const Faculty = mongoose.model('Faculty', FacultySchema);

module.exports = Faculty;
