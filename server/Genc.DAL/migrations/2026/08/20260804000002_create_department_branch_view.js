const mongoose = require('mongoose');
const logger = require('../../../utils/logger');

/**
 * Umzug Migration: 20260804000002_create_department_branch_view.js
 * Creates MongoDB Native Virtual View 'department_access_views' from the unified 'users' collection.
 */
module.exports = {
  up: async () => {
    const db = mongoose.connection.db;

    // Check if view already exists
    const collections = await db.listCollections({ name: 'department_access_views' }).toArray();
    if (collections.length > 0) {
      logger.info('MongoDB View department_access_views already exists. Dropping before recreate...');
      await db.collection('department_access_views').drop();
    }

    // Create MongoDB Native View from unified 'users' collection
    await db.createCollection('department_access_views', {
      viewOn: 'users',
      pipeline: [
        {
          $project: {
            documentId: '$_id',
            student_id: '$faculty_id',
            full_name: '$full_name',
            email: '$email',
            department: '$department',
            role: '$role',
            active_role: '$active_role',
            year: '$year',
            profile_picture_url: '$profile_picture_url',
            created_at: '$created_at',
          },
        },
      ],
    });

    logger.info('✅ Created MongoDB Native View department_access_views from unified users collection successfully.');
  },

  down: async () => {
    const db = mongoose.connection.db;
    try {
      await db.collection('department_access_views').drop();
      logger.info('Dropped MongoDB View department_access_views.');
    } catch (err) {
      // View may not exist
    }
  },
};
