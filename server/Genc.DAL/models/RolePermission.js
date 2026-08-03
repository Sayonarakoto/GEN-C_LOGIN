const mongoose = require('mongoose');

/**
 * RolePermission Schema - Maps user roles to allowed apps, menus, and permissions
 */
const RolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    allowed_apps: [
      {
        type: String,
        uppercase: true,
      },
    ],
    allowed_menus: [
      {
        type: String,
        uppercase: true,
      },
    ],
    permissions: [
      {
        type: String,
        uppercase: true,
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

module.exports = mongoose.model('RolePermission', RolePermissionSchema);
