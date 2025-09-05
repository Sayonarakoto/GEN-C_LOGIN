const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const securitySchema = new mongoose.Schema({
  passkey: {
    type: String,
    required: [true, 'Passkey is required'],
  },
});
// This pre-save hook will hash the passkey before it is saved to the database.
// This is a crucial security practice to protect sensitive user data.
securitySchema.pre('save', async function(next) {
  // Only hash the passkey if it has been modified (or is new)
  if (!this.isModified('passkey')) {
    return next();
  }
  try {
    // Generate a salt with a work factor of 10
    const salt = await bcrypt.genSalt(10);
    // Hash the plain-text passkey with the salt
    this.passkey = await bcrypt.hash(this.passkey, salt);
    next();
  } catch (error) {
    next(error); // Pass any errors to the next middleware
  }
});

module.exports = mongoose.model('Security', securitySchema);