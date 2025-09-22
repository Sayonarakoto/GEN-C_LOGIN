const multer = require('multer');
const XLSX = require('xlsx');
// const bcrypt = require('bcrypt'); // Removed: No longer hashing password here
const Student = require('../models/student'); // Use the merged student model
const fs = require('fs').promises; // For file deletion

// Multer setup for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'), false);
    }
  },
});

// Helper to generate a plain-text temporary password based on fullName
function generateTemporaryPassword(fullName) {
  return fullName.toString().replace(/\s+/g, "") + "123";
}

// Upload Excel → parse → save/update in MongoDB
const uploadStudents = async (req, res) => {
  let uploadedFilePath = null;
  const uploaded = [];
  const errors = [];

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    uploadedFilePath = req.file.path;

    const workbook = XLSX.readFile(uploadedFilePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const upsertPromises = rows.map(async (row) => {
      const studentId = row['Student ID'] ? String(row['Student ID']) : null;
      const fullName = row['Full Name'] || '';
      const email = row.Email || '';
      const department = row.Department || '';
      const year = row.Year ? String(row.Year) : '';

      // Validation
      if (!studentId || !fullName || !email || !department || !year) {
        errors.push({ row, reason: 'Missing required field (Student ID, Full Name, Email, Department, Year).' });
        return null; // Skip this row
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.push({ row, reason: 'Invalid email format.' });
        return null; // Skip this row
      }

      // Check for existing student by studentId
      const existingStudentById = await Student.findOne({ studentId });

      // Check for duplicate email if it's a new student or updating an existing one with a different studentId
      if (!existingStudentById || existingStudentById.studentId !== studentId) {
        const existingStudentByEmail = await Student.findOne({ email });
        if (existingStudentByEmail && existingStudentByEmail.studentId !== studentId) {
          errors.push({ row, reason: `Duplicate email detected for: ${email}. Already associated with Student ID: ${existingStudentByEmail.studentId}.` });
          return null; // Skip this row
        }
      }

      const studentData = {
        studentId: studentId,
        fullName: fullName,
        email: email,
        department: department,
        year: year,
      };

      let updateOperation = { $set: studentData };
      let newTemporaryPassword = generateTemporaryPassword(fullName); // Generate plain-text password

      // If it's a new document (upsert will create it), set the plain-text temporary password
      if (!existingStudentById) {
        updateOperation.$setOnInsert = { tempPassword: newTemporaryPassword };
      } else {
        // For existing students, update tempPassword if needed, but don't touch passwordHash
        updateOperation.$set.tempPassword = newTemporaryPassword;
      }


      try {
        const student = await Student.findOneAndUpdate(
          { studentId: studentId },
          updateOperation,
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true } // setDefaultsOnInsert ensures default values are applied on new docs
        );
        uploaded.push(student);
        return student;
      } catch (dbError) {
        let reason = "Database error.";
        if (dbError.code === 11000) { // MongoDB duplicate key error
          reason = `Duplicate entry: A student with this Student ID or Email already exists.`;
        } else {
          reason = dbError.message;
        }
        errors.push({ row, reason });
        return null;
      }
    });

    await Promise.all(upsertPromises);

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Some records failed to upload.',
            uploaded: uploaded, // Still send successfully uploaded students
            errors: errors,
        });
    }

    res.status(200).json({
      success: true,
      message: 'File processed successfully.',
      uploaded: uploaded,
      errors: [],
    });

  } catch (err) {
    console.error('Error during file upload:', err);
    res.status(500).json({ success: false, message: 'Server error during file processing.', error: err.message });
  } finally {
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
        console.log(`Deleted uploaded file: ${uploadedFilePath}`);
      } catch (unlinkErr) {
        console.error(`Error deleting uploaded file ${uploadedFilePath}:`, unlinkErr);
      }
    }
  }
};

// Get all students with pagination, sorting, and filtering
const getAllStudents = async (req, res) => {
  try {
    // Validate and sanitize input parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10)); // Cap at 100
    const allowedSortFields = ['studentId', 'fullName', 'email', 'department', 'year', 'createdAt'];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'studentId';
    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    
    // Sanitize search parameters (prevent regex injection)
    const sanitizeRegex = (str) => str ? str.replace(/[.*+?^${}()|[\\\]]/g, '\\$&') : null;
    const fullName = sanitizeRegex(req.query.fullName);
    const studentId = sanitizeRegex(req.query.studentId);
    const email = sanitizeRegex(req.query.email);
    const department = sanitizeRegex(req.query.department);
    const year = sanitizeRegex(req.query.year);

    const query = {};
    if (fullName) {
      query.fullName = { $regex: fullName, $options: 'i' }; // Case-insensitive search
    }
    if (studentId) {
      query.studentId = { $regex: studentId, $options: 'i' }; // Case-insensitive search
    }
    if (email) {
      query.email = { $regex: email, $options: 'i' }; // Case-insensitive search
    }
    if (department) {
      query.department = { $regex: department, $options: 'i' }; // Case-insensitive search
    }
    if (year) {
      query.year = { $regex: year, $options: 'i' }; // Case-insensitive search
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const students = await Student.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalStudents = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalStudents / limit),
      totalStudents,
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ success: false, message: 'Error fetching students', error: err.message });
  }
};

module.exports = { upload, uploadStudents, getAllStudents };
