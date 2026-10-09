const { generateToken } = require('../config/jwt');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Faculty = require('../models/Faculty');
const Student = require('../models/student');
const Security = require('../models/security');
const User = require('../models/User');
const createError = require('../utils/error');
const logger = require('../utils/logger');

// Issue a long-lived refresh token carrying the same identity claims as the access token
const signRefreshToken = (claims) => jwt.sign(
  { ...claims, scope: 'refresh' },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d' }
);

// ----------------- REGISTER -----------------
exports.register = async (req, res, next) => {
  try {
    logger.info('Registering faculty:', req.body);

    const { fullName, email, employeeId, department, designation, password, profilePhoto } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !employeeId || !department || !designation || !password) {
        return next(createError('All fields are required.', 400));
    }

    // Check if faculty already exists
    let faculty = await Faculty.findOne({ employeeId });
    if (faculty) {
      return next(createError('Faculty with this Employee ID already exists.', 400));
    }

    // Validate department against a predefined list
    const validDepartments = process.env.VALID_DEPARTMENTS ? process.env.VALID_DEPARTMENTS.split(',') : ["CT", "MECH-A", "MECH-B", "EEE", "CE", "FS", "AUTO"];
    if (!department || !validDepartments.includes(department.toUpperCase())) {
      return next(createError('Invalid department provided.', 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine role based on designation
    const role = designation.toUpperCase() === 'HOD' ? 'HOD' : 'faculty';

    // Create new faculty
    faculty = new Faculty({
      fullName,
      email,
      employeeId,
      department,
      designation,
      password: hashedPassword,
      profilePhoto: profilePhoto, // Save the profile photo URL/path
    });

    await faculty.save();

    // Generate token
    const token = generateToken({
      id: faculty._id,
      role: role,
      fullName: faculty.fullName,
      department: faculty.department
    });

    res.status(201).json({
      success: true,
      message: 'Faculty registered successfully.',
      token,
      faculty: { ...faculty.toObject(), password: undefined, profilePhoto: faculty.profilePhoto }
    });

  } catch (error) {
    next(error);
  }
};

exports.studentRegister = async (req, res, next) => {
    try {
        const { studentId, fullName, email, department, year, password } = req.body;
        if (!studentId || !fullName || !email || !department || !year || !password) {
            return next(createError('All fields are required', 400));
        }
        const existingStudent = await Student.findOne({ studentId });
        if (existingStudent) {
            return next(createError('Student with this ID already exists', 400));
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const student = await Student.create({ studentId, fullName, email, department, year, password: hashedPassword });
        res.status(201).json({ success: true, message: 'Student registered successfully' });
    } catch (error) {
        next(error);
    }
};

exports.securityRegister = async (req, res, next) => {
    try {
        const { name, securityId, passkey } = req.body;
        if (!name || !securityId || !passkey || passkey.length !== 6) {
            return next(createError('Name, Security ID, and a 6-digit passkey are required', 400));
        }
        const existingSecurity = await Security.findOne({ securityId });
        if (existingSecurity) {
            return next(createError('Security user with this ID already exists', 400));
        }
        // passkey is hashed in model pre-save hook
        const security = await Security.create({ name, securityId, passkey });
        res.status(201).json({ success: true, message: 'Security user registered successfully' });
    } catch (error) {
        next(error);
    }
};

// ----------------- LOGIN -----------------
exports.studentLogin = async (req, res, next) => {
  try {
    const { studentId, password } = req.body;
    const student = await Student.findOne({ studentId });

    if (!student) {
      return next(createError('Invalid credentials', 401));
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return next(createError('Invalid credentials', 401));
    }

    // Sanitize profile picture URL (remove /static if present from legacy uploads)
    const profilePictureUrl = student.profilePictureUrl ? student.profilePictureUrl.replace('/static/uploads', '/uploads') : '';

    const token = generateToken({
      id: student._id,
      role: 'student',
      fullName: student.fullName,
      department: student.department,
      year: student.year,
      studentId: student.studentId,
      email: student.email,
      profilePictureUrl: profilePictureUrl
    });

    res.json({
      success: true,
      token,
      user: { id: student._id, role: 'student', studentId: student.studentId, fullName: student.fullName, department: student.department, profilePictureUrl: profilePictureUrl }
    });
  } catch (error) {
    next(error);
  }
};

exports.facultyLogin = async (req, res, next) => {
  try {
    const { employeeId, facultyId, password } = req.body;
    const id = employeeId || facultyId;
    const faculty = await Faculty.findOne({ employeeId: id });

    if (!faculty) {
      return next(createError('Invalid credentials', 401));
    }

    const isMatch = await bcrypt.compare(password, faculty.password);
    if (!isMatch) {
      return next(createError('Invalid credentials', 401));
    }

    const role = faculty.designation.toUpperCase() === 'HOD' ? 'HOD' : 'faculty';
    const token = generateToken({
      id: faculty._id,
      role: role,
      fullName: faculty.fullName,
      department: faculty.department,
      email: faculty.email,         // Add email
      employeeId: faculty.employeeId, // Add employeeId
      designation: faculty.designation, // Include designation for profile UI
      profilePictureUrl: faculty.profilePhoto || '' // Allow rehydration to show profile image
    });

    const facultyData = faculty.toObject();
    delete facultyData.password;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: faculty._id, role: role, ...facultyData },
    });
  } catch (error) {
    next(error);
  }
};

exports.securityLogin = async (req, res, next) => {
  try {
    const { passkey } = req.body;
    const security = await Security.findOne();
    if (!security) return next(createError('Security user not found', 401));

    const ok = await bcrypt.compare(passkey, security.passkey);
    if (!ok) return next(createError('Invalid passkey', 401));

    const token = generateToken({ id: security._id, role: 'security', fullName: 'Security', department: 'Security' });
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: security._id, role: 'security', fullName: 'Security', department: 'Security' }
    });
  } catch (err) {
    next(err);
  }
};

// Token Refresh
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      logger.info('Refresh failed: invalid or expired refresh token');
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    if (payload.scope !== 'refresh' || !payload.id || !payload.role) {
      return res.status(401).json({ success: false, message: 'Invalid token scope' });
    }

    // Verify the account still exists
    const role = String(payload.role).toLowerCase();
    let exists = false;
    if (role === 'student') {
      exists = !!(await Student.findById(payload.id).select('_id'));
    } else if (role === 'faculty' || role === 'hod') {
      exists = !!(await Faculty.findById(payload.id).select('_id'));
    } else if (role === 'security') {
      exists = !!(await Security.findById(payload.id).select('_id'));
    } else if (role === 'admin' || role === 'librarian') {
      exists = !!(await User.findById(payload.id).select('_id'));
    }
    if (!exists) {
      logger.info('Refresh failed: account no longer exists');
      return res.status(401).json({ success: false, message: 'Account no longer exists' });
    }

    // Re-issue access token (rotate the refresh token too)
    const { scope, iat, exp, ...claims } = payload;
    let token;
    if (role === 'admin' || role === 'librarian') {
      const user = await User.findById(payload.id);
      token = user.getSignedJwtToken();
    } else {
      token = generateToken(claims);
    }
    const newRefreshToken = signRefreshToken(claims);

    return res.json({ success: true, token, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Server error during token refresh' });
  }
};

// Password reset (OTP) lives in controllers/passwordResetController.js and is
// mounted at /api/auth/forgot-password | /verify-reset-otp | /reset-password.

exports.unifiedLogin = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: "Role is required" });

    if (role === 'student') {
      const { studentId, password } = req.body;
      logger.info('Attempting student login for studentId:', studentId);
      const student = await Student.findOne({ studentId });
      if (!student) {
        logger.info('Student not found for studentId:', studentId);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log('Student found:', student.fullName);

      let isMatch = false;
      // Check if temporary password exists and matches
      if (student.tempPassword) {
        const isTempMatch = await bcrypt.compare(password, student.tempPassword);
        if (isTempMatch) {
          // Upgrade temporary password to permanent
          student.password = await bcrypt.hash(password, 10);
          student.tempPassword = null; // Or undefined
          await student.save();
          isMatch = true;
        }
      }

      // If not matched with temp password, try permanent password
      if (!isMatch) {
        isMatch = await bcrypt.compare(password, student.password);
      }

      if (!isMatch) {
        console.log('Password mismatch for studentId:', studentId);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log('Student login successful for studentId:', studentId);
      const claims = {
        id: student._id,
        role: 'student',
        fullName: student.fullName,
        department: student.department,
        year: student.year,
        studentId: student.studentId,
        email: student.email,
        profilePictureUrl: student.profilePictureUrl
      };
      const token = generateToken(claims);
      const refreshToken = signRefreshToken(claims);
      const studentData = student.toObject();
      delete studentData.password;
      delete studentData.tempPassword;

      return res.json({ token, refreshToken, user: studentData });
    }

    if (role === 'faculty') {
      const { employeeId, facultyId, password } = req.body;
      const id = employeeId || facultyId;
      const faculty = await Faculty.findOne({ employeeId: id });
      if (!faculty) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const ok = await bcrypt.compare(password, faculty.password);
      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const role = faculty.designation.toUpperCase() === 'HOD' ? 'HOD' : 'faculty';
      const claims = {
        id: faculty._id,
        role: role,
        fullName: faculty.fullName,
        department: faculty.department,
        email: faculty.email,
        employeeId: faculty.employeeId,
        designation: faculty.designation,
        profilePictureUrl: faculty.profilePhoto || '',
      };
      const token = generateToken(claims);
      const refreshToken = signRefreshToken(claims);
      const f = faculty.toObject(); delete f.password;
      return res.json({ token, refreshToken, user: { id: faculty._id, role: role, ...f }});
    }

    if (role === 'security') {
      const { passkey } = req.body;
      // Decide how security users are stored (single or multiple). Assuming one doc:
      const security = await Security.findOne(); // or Security.findOne({ username }) if such field exists
      if (!security) return res.status(401).json({ message: "Security user not found" });
      const ok = await bcrypt.compare(passkey, security.passkey);
      if (!ok) return res.status(401).json({ message: "Invalid passkey" });
      const claims = { id: security._id, role: 'security', fullName: 'Security', department: 'Security' };
      const token = generateToken(claims);
      const refreshToken = signRefreshToken(claims);
      return res.json({ token, refreshToken, user: { id: security._id, role: 'security', fullName: 'Security', department: 'Security' }});
    }

    if (role === 'admin') {
      const { identifier, facultyId, adminId, password } = req.body;
      const id = identifier || adminId || facultyId;
      if (!id || !password) {
        return res.status(400).json({ message: "Admin ID and password are required" });
      }
      const user = await User.findOne({ role: 'admin', $or: [{ facultyId: id }, { email: id }] }).select('+password');
      if (!user) {
        logger.info('Admin login failed: no admin user for identifier');
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const ok = await user.matchPassword(password);
      if (!ok) {
        logger.info('Admin login failed: bad password');
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = user.getSignedJwtToken();
      const refreshToken = signRefreshToken({
        id: user._id,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
        facultyId: user.facultyId,
        email: user.email
      });
      return res.json({
        token,
        refreshToken,
        user: {
          id: user._id,
          role: user.role,
          fullName: user.fullName,
          department: user.department,
          facultyId: user.facultyId,
          email: user.email,
          profilePictureUrl: user.profilePictureUrl || ''
        }
      });
    }

    return res.status(400).json({ message: "Unsupported role" });
  } catch (err) {
    logger.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------- LIBRARIAN AUTH -----------------

exports.librarianRegister = async (req, res, next) => {
    const { facultyId, email, password, fullName } = req.body;
    const profilePictureUrl = req.file ? `/uploads/profile-pictures/${req.file.filename}` : null;

    try {
        // Create user
        const user = await User.create({
            facultyId,
            email,
            password,
            fullName,
            role: 'librarian', // Ensure role is set, using lowercase to match schema
            profilePictureUrl
        });

        res.status(201).json({
            success: true,
            message: 'Librarian registered successfully'
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'That email address is already registered. Please use a different one.',
                code: 'DUPLICATE',
            });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Please check the details you entered.',
                code: 'VALIDATION_ERROR',
            });
        }
        logger.error('Librarian registration error:', error);
        return next(error);
    }
};

exports.librarianLogin = async (req, res, next) => {
    const { facultyId, password } = req.body;

    // Validate input
    if (!facultyId || !password) {
        return res.status(400).json({ success: false, message: 'Please provide a faculty ID and password' });
    }

    try {
        // Check for user
        const user = await User.findOne({ facultyId, role: 'librarian' }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password); // Assumes matchPassword method exists on User model

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = user.getSignedJwtToken(); // Assumes getSignedJwtToken method exists on User model

        // Sanitize profile picture URL
        let profilePictureUrl = user.profilePictureUrl;
        if (profilePictureUrl) {
            profilePictureUrl = profilePictureUrl.replace('/static/uploads', '/uploads').replace(/\\/g, '/');
        }
        
        // Return user and token
        const refreshClaims = {
            id: user._id,
            role: user.role,
            fullName: user.fullName,
            department: user.department,
            facultyId: user.facultyId,
            email: user.email
        };
        res.status(200).json({
            success: true,
            token,
            refreshToken: signRefreshToken(refreshClaims),
            user: {
                id: user._id,
                role: user.role,
                fullName: user.fullName,
                department: user.department,
                facultyId: user.facultyId,
                email: user.email,
                profilePictureUrl: profilePictureUrl
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
