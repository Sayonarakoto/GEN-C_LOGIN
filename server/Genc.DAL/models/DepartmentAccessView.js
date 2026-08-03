const mongoose = require('mongoose');

/**
 * Mongoose Model bound to MongoDB Native Virtual View 'department_access_views'
 */
const DepartmentAccessViewSchema = new mongoose.Schema(
  {
    documentId: mongoose.Schema.Types.ObjectId,
    student_id: String,
    full_name: String,
    email: String,
    department: String,
    year: String,
    profile_picture_url: String,
    created_at: Date,
  },
  {
    collection: 'department_access_views',
    autoCreate: false, // Read-only MongoDB View
  }
);

module.exports = mongoose.model('DepartmentAccessView', DepartmentAccessViewSchema);
