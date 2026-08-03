const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, unique: true },
  department: {
    type: String,
    required: true,
    set: (value) => value.toUpperCase()
  },
  password:{type:String,required:true},
  designation: {
    type: String,
    enum: ['FACULTY', 'HOD'],
    required: true,
    set: (value) => value.toUpperCase()
  },
  profilePhoto: { type: String }, // Store image filename or URL if uploading file separately
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String },
}, { timestamps: true });

const Faculty = mongoose.model('Faculty', FacultySchema);

module.exports = Faculty;
