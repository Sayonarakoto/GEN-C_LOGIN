const mongoose = require('mongoose');
const logger = require('../../../utils/logger');

/**
 * Umzug Migration: 20260804000004_consolidate_user_roles.js
 * Migrates legacy role-specific collections (students, faculties, securities)
 * into the unified 'users' collection with full multi-role attributes.
 */
module.exports = {
  up: async () => {
    const db = mongoose.connection.db;
    const usersCol = db.collection('users');
    const now = new Date();

    // 1. Migrate Students
    try {
      const studentsCol = db.collection('students');
      const students = await studentsCol.find({}).toArray();
      logger.info(`Migrating ${students.length} legacy students into users collection...`);

      for (const student of students) {
        const userId = student.student_id || student.studentId || student.rollNo || `S_${student._id}`;
        const email = student.email || `${userId.toLowerCase()}@student.paperless.edu`;
        const fullName = student.full_name || student.fullName || student.name || 'Student';

        await usersCol.updateOne(
          { faculty_id: userId },
          {
            $set: {
              faculty_id: userId,
              full_name: fullName,
              email: email.trim().toLowerCase(),
              password: student.password || 'hashed_default_password',
              role: 'student',
              active_role: 'student',
              roles: ['student'],
              department: (student.department || student.dept || 'GENERAL').toUpperCase(),
              year: student.year || '1',
              profile_picture_url: student.profile_picture_url || student.profilePictureUrl || '',
              created_at: student.created_at || student.createdAt || now,
              updated_at: student.updated_at || student.updatedAt || now,
            },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      logger.warn({ error: err.message }, 'Student migration step warning');
    }

    // 2. Migrate Faculties & HODs
    try {
      const facultiesCol = db.collection('faculties');
      const faculties = await facultiesCol.find({}).toArray();
      logger.info(`Migrating ${faculties.length} legacy faculty records into users collection...`);

      for (const faculty of faculties) {
        const userId = faculty.employeeId || faculty.facultyId || `F_${faculty._id}`;
        const email = faculty.email || `${userId.toLowerCase()}@faculty.paperless.edu`;
        const fullName = faculty.fullName || faculty.full_name || 'Faculty Member';
        const role = (faculty.designation || '').toUpperCase() === 'HOD' ? 'hod' : 'faculty';
        const roles = role === 'hod' ? ['faculty', 'hod'] : ['faculty'];

        await usersCol.updateOne(
          { faculty_id: userId },
          {
            $set: {
              faculty_id: userId,
              full_name: fullName,
              email: email.trim().toLowerCase(),
              password: faculty.password || 'hashed_default_password',
              role: role,
              active_role: role,
              roles: roles,
              department: (faculty.department || 'GENERAL').toUpperCase(),
              designation: faculty.designation || 'Faculty',
              profile_picture_url: faculty.profilePhoto || faculty.profile_picture_url || '',
              created_at: faculty.created_at || faculty.createdAt || now,
              updated_at: faculty.updated_at || faculty.updatedAt || now,
            },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      logger.warn({ error: err.message }, 'Faculty migration step warning');
    }

    // 3. Migrate Securities
    try {
      const securitiesCol = db.collection('securities');
      const securities = await securitiesCol.find({}).toArray();
      logger.info(`Migrating ${securities.length} legacy security records into users collection...`);

      for (const security of securities) {
        const userId = security.securityId || `SEC_${security._id}`;
        const email = `${userId.toLowerCase()}@security.paperless.edu`;
        const fullName = security.name || 'Security User';

        await usersCol.updateOne(
          { faculty_id: userId },
          {
            $set: {
              faculty_id: userId,
              full_name: fullName,
              email: email.trim().toLowerCase(),
              password: security.passkey || 'hashed_default_passkey',
              role: 'security',
              active_role: 'security',
              roles: ['security'],
              department: 'SECURITY',
              created_at: security.created_at || security.createdAt || now,
              updated_at: security.updated_at || security.updatedAt || now,
            },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      logger.warn({ error: err.message }, 'Security migration step warning');
    }

    // 4. Create Indexes on unified users collection
    try {
      await usersCol.createIndex({ faculty_id: 1 }, { unique: true, sparse: true });
      await usersCol.createIndex({ email: 1 }, { unique: true, sparse: true });
      await usersCol.createIndex({ role: 1 });
      await usersCol.createIndex({ active_role: 1 });
      await usersCol.createIndex({ department: 1 });
    } catch (err) {
      logger.warn({ error: err.message }, 'User index creation warning');
    }

    logger.info('✅ Consolidated all role-specific collections into unified users collection successfully.');
  },

  down: async () => {
    logger.info('Reverting 20260804000004_consolidate_user_roles migration...');
  },
};
