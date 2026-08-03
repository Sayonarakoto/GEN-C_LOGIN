const mongoose = require('mongoose');

/**
 * AppMenu Schema - Defines dynamic header and sidebar navigation menus
 */
const AppMenuSchema = new mongoose.Schema(
  {
    menu_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    app_code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'link',
    },
    order_index: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

module.exports = mongoose.model('AppMenu', AppMenuSchema);
