const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const securitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  securityId: {
    type: String,
    required: [true, 'Security ID is required'],
    unique: true,
  },
  passkey: {
    type: String,
    required: [true, 'Passkey is required'],
    minlength: 6,
    maxlength: 6,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Pre-save hook to hash the 6-digit passkey
securitySchema.pre('save', async function(next) {
  if (!this.isModified('passkey')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.passkey = await bcrypt.hash(this.passkey, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Security', securitySchema);
