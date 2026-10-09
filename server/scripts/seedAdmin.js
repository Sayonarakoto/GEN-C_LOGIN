// Seed or update the admin user.
// Usage: node scripts/seedAdmin.js [facultyIdOrEmail] [password] [fullName] [email]
//        (falls back to ADMIN_FACULTY_ID / ADMIN_PASSWORD / ADMIN_FULL_NAME / ADMIN_EMAIL env vars)
const path = require('path');
require('dotenv').config({
  path: [
    path.join(__dirname, '../../.env.test'),
    path.join(__dirname, '../../.env'),
  ],
});
const mongoose = require('mongoose');
const User = require('../models/User');

const facultyId = process.argv[2] || process.env.ADMIN_FACULTY_ID;
const password = process.argv[3] || process.env.ADMIN_PASSWORD;
const fullName = process.argv[4] || process.env.ADMIN_FULL_NAME || 'Administrator';
const email = process.argv[5] || process.env.ADMIN_EMAIL;

if (!facultyId || !password || !email) {
  console.error('Usage: node scripts/seedAdmin.js <facultyId> <password> <fullName> <email>');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ $or: [{ facultyId }, { email }] }).select('+password');
    if (user) {
      user.facultyId = facultyId;
      user.email = email;
      user.fullName = fullName;
      user.password = password; // pre-save hook re-hashes when modified
      user.role = 'admin';
      await user.save();
      console.log(`Updated existing user ${user._id} -> role admin`);
    } else {
      user = await User.create({ facultyId, email, password, fullName, role: 'admin', department: 'Administration' });
      console.log(`Created admin user ${user._id}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();
