const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * User Schema - Enterprise Multi-Role Identity System
 */
const UserSchema = new mongoose.Schema(
  {
    faculty_id: {
      type: String,
      required: [true, 'Please provide user/faculty ID'],
      unique: true,
      trim: true,
      index: true,
    },
    full_name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      lowercase: true,
      default: 'student',
    },
    active_role: {
      type: String,
      lowercase: true,
      default: 'student',
    },
    roles: [
      {
        type: String,
        lowercase: true,
      },
    ],
    department: {
      type: String,
      uppercase: true,
      default: 'GENERAL',
    },
    assigned_departments: [
      {
        type: String,
        uppercase: true,
      },
    ],
    profile_picture_url: {
      type: String,
      default: '',
    },
    reset_password_token: String,
    reset_password_expire: Date,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Virtual getters for camelCase compatibility
UserSchema.virtual('facultyId').get(function () {
  return this.faculty_id;
});
UserSchema.virtual('fullName').get(function () {
  return this.full_name;
});
UserSchema.virtual('activeRole').get(function () {
  return this.active_role || this.role;
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // Synchronize roles and active_role
  if (!this.roles || this.roles.length === 0) {
    this.roles = [this.role];
  }
  if (!this.active_role) {
    this.active_role = this.role;
  }
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getSignedJwtToken = function () {
  const currentRole = (this.active_role || this.role || 'student').toLowerCase();
  const currentRoles = this.roles && this.roles.length > 0 ? this.roles : [currentRole];

  return jwt.sign(
    {
      id: this._id,
      role: currentRole,
      activeRole: currentRole,
      roles: currentRoles,
      fullName: this.full_name,
      department: this.department,
      facultyId: this.faculty_id,
      email: this.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '1d',
    }
  );
};

module.exports = mongoose.model('User', UserSchema);