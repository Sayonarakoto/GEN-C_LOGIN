const mongoose = require("mongoose");

/**
 * Student Schema - Enterprise College Management System Data Model
 * Uses snake_case database field names and includes created_at and updated_at timestamps.
 */
const studentSchema = new mongoose.Schema(
  {
    student_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    temp_password: {
      type: String,
      default: null,
    },
    reset_password_token: {
      type: String,
      default: null,
    },
    reset_password_expire: {
      type: Date,
      default: null,
    },
    profile_picture_url: {
      type: String,
      trim: true,
      default: '',
    },
    gate_pass_history: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GatePass',
      },
    ],
    late_entry_history: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LateEntry',
      },
    ],
    special_pass_history: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpecialPass',
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Virtual getters for camelCase backwards compatibility when accessing raw document properties
studentSchema.virtual('studentId').get(function () {
  return this.student_id;
});
studentSchema.virtual('fullName').get(function () {
  return this.full_name;
});
studentSchema.virtual('profilePictureUrl').get(function () {
  return this.profile_picture_url;
});

module.exports = mongoose.model("Student", studentSchema);