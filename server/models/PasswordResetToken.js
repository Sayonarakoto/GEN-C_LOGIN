const mongoose = require('mongoose');

const resetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  tokenHash: { type: String, required: true },   // sha256(token)
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: true });

resetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // optional TTL if you store expiry as Date (Mongo TTL requires extra handling)

module.exports = mongoose.model('PasswordResetToken', resetSchema);
