const mongoose = require('mongoose');

/**
 * AppDefinition Schema - Defines application modules/dashboards in the DB
 */
const AppDefinitionSchema = new mongoose.Schema(
  {
    app_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    app_name: {
      type: String,
      required: true,
      trim: true,
    },
    route_path: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'dashboard',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

module.exports = mongoose.model('AppDefinition', AppDefinitionSchema);
