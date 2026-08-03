const mongoose = require('mongoose');
const logger = require('../../../utils/logger');

module.exports = {
  up: async () => {
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    const now = new Date();

    const students = await collection.find({}).toArray();

    for (const student of students) {
      const updates = {};

      if (!student.student_id && student.studentId) updates.student_id = student.studentId;
      if (!student.full_name && student.fullName) updates.full_name = student.fullName;
      if (!student.profile_picture_url && student.profilePictureUrl) updates.profile_picture_url = student.profilePictureUrl;
      if (!student.created_at) updates.created_at = student.createdAt || now;
      if (!student.updated_at) updates.updated_at = student.updatedAt || now;

      if (Object.keys(updates).length > 0) {
        await collection.updateOne({ _id: student._id }, { $set: updates });
      }
    }

    try {
      await collection.createIndex({ student_id: 1 }, { unique: true, sparse: true });
      await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
      await collection.createIndex({ department: 1 });
    } catch (err) {
      logger.warn({ error: err.message }, 'Index creation warning during migration 001');
    }
  },

  down: async () => {
    logger.info('Reverting 20260804000001_init_student_cms_schema migration...');
  },
};
