const { generateToken } = require('../config/jwt');
const bcrypt = require('bcryptjs');
const Faculty = require('../models/Faculty');
const Student = require('../models/student');
const Security = require('../models/security');
const User = require('../models/User');

// ----------------- REGISTER -----------------
exports.register = async (req, res) => {
  try {
    const { fullName, email, employeeId, department, designation, password } = req.body;
    const profilePhotoPath = req.file ? `/uploads/profile-pictures/${req.file.filename}` : null; // Save web-accessible path

    // Check if faculty already exists
    let faculty = await Faculty.findOne({ employeeId });
    if (faculty) {
      return res.status(400).json({ success: false, message: 'Faculty with this Employee ID already exists.' });
    }

    // Validate department against a predefined list
    const validDepartments = ["ct", "mech-a", "mech-b", "eee", "ce", "fs", "auto"];
    if (!validDepartments.includes(department.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Invalid department provided.' });
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
      profilePhoto: profilePhotoPath, // Save the profile photo path
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
    console.error('Faculty registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

exports.studentRegister = async (req, res) => {
    try {
        const { studentId, fullName, email, department, year, password } = req.body;
        if (!studentId || !fullName || !email || !department || !year || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        const existingStudent = await Student.findOne({ studentId });
        if (existingStudent) {
            return res.status(400).json({ success: false, message: 'Student with this ID already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const student = await Student.create({ studentId, fullName, email, department, year, password: hashedPassword });
        res.status(201).json({ success: true, message: 'Student registered successfully' });
    } catch (error) {
        console.error('Student registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

exports.securityRegister = async (req, res) => {
    try {
        const { name, securityId, passkey } = req.body;
        if (!name || !securityId || !passkey || passkey.length !== 6) {
            return res.status(400).json({ success: false, message: 'Name, Security ID, and a 6-digit passkey are required' });
        }
        const existingSecurity = await Security.findOne({ securityId });
        if (existingSecurity) {
            return res.status(400).json({ success: false, message: 'Security user with this ID already exists' });
        }
        // passkey is hashed in model pre-save hook
        const security = await Security.create({ name, securityId, passkey });
        res.status(201).json({ success: true, message: 'Security user registered successfully' });
    } catch (error) {
        console.error('Security registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

// ----------------- LOGIN -----------------
exports.studentLogin = async (req, res) => {
  try {
    const { studentId, password } = req.body;
    const student = await Student.findOne({ studentId });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
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
    console.error('Student login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

exports.facultyLogin = async (req, res) => {
  try {
    const { employeeId, facultyId, password } = req.body;
    const id = employeeId || facultyId;
    const faculty = await Faculty.findOne({ employeeId: id });

    if (!faculty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, faculty.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const role = faculty.designation.toUpperCase() === 'HOD' ? 'HOD' : 'faculty';
    const token = generateToken({
      id: faculty._id,
      role: role,
      fullName: faculty.fullName,
      department: faculty.department,
      email: faculty.email,         // Add email
      employeeId: faculty.employeeId, // Add employeeId
      designation: faculty.designation // ADD THIS LINE
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
    console.error('Faculty login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

exports.securityLogin = async (req, res) => {
  try {
    console.log('Security login attempt started.'); // Added log
    const { passkey } = req.body;
    console.log('Passkey received:', passkey ? 'yes' : 'no'); // Added log
    // If you have a single security doc:
    const security = await Security.findOne();
    console.log('Security user found:', security ? 'yes' : 'no'); // Added log
    if (!security) return res.status(401).json({ success: false, message: 'Security user not found' });

    console.log('Comparing passkey...'); // Added log
    const ok = await bcrypt.compare(passkey, security.passkey);
    console.log('Passkey comparison result:', ok); // Added log
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid passkey' });

    const token = generateToken({ id: security._id, role: 'security', fullName: 'Security', department: 'Security' });
    console.log('Token generated. Login successful.'); // Added log
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: security._id, role: 'security', fullName: 'Security', department: 'Security' }
    });
  } catch (err) {
    console.error('Security login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Token Refresh
exports.refreshToken = async (req, res) => {
  try {
    // Implementation for token refresh
    // ... add your token refresh logic here
    res.status(501).json({ message: 'Token refresh not implemented' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
};

// Password Reset Request
exports.forgotPassword = async (req, res) => {
  try {
    // Implementation for password reset request
    // ... add your forgot password logic here
    res.status(501).json({ message: 'Forgot password not implemented' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// Password Reset
exports.resetPassword = async (req, res) => {
  try {
    // Implementation for password reset
    // ... add your password reset logic here
    res.status(501).json({ message: 'Password reset not implemented' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

exports.unifiedLogin = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: "Role is required" });

    if (role === 'student') {
      const { studentId, password } = req.body;
      console.log('Attempting student login for studentId:', studentId);
      const student = await Student.findOne({ studentId });
      if (!student) {
        console.log('Student not found for studentId:', studentId);
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
      const token = generateToken({
        id: student._id,
        role: 'student',
        fullName: student.fullName,
        department: student.department,
        year: student.year,
        studentId: student.studentId,
        email: student.email,
        profilePictureUrl: student.profilePictureUrl
      });
      const studentData = student.toObject();
      delete studentData.password;

      return res.json({ token, user: studentData });
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
      const token = generateToken({ id: faculty._id, role: role, fullName: faculty.fullName, department: faculty.department, email: faculty.email, employeeId: faculty.employeeId, designation: faculty.designation }); // ADD designation
      const f = faculty.toObject(); delete f.password;
      return res.json({ token, user: { id: faculty._id, role: role, ...f }});
    }

    if (role === 'security') {
      const { passkey } = req.body;
      // Decide how security users are stored (single or multiple). Assuming one doc:
      const security = await Security.findOne(); // or Security.findOne({ username }) if such field exists
      if (!security) return res.status(401).json({ message: "Security user not found" });
      const ok = await bcrypt.compare(passkey, security.passkey);
      if (!ok) return res.status(401).json({ message: "Invalid passkey" });
      const token = generateToken({ id: security._id, role: 'security', fullName: 'Security', department: 'Security' });
      return res.json({ token, user: { id: security._id, role: 'security', fullName: 'Security', department: 'Security' }});
    }

    return res.status(400).json({ message: "Unsupported role" });
  } catch (err) {
    console.error("Login error:", err);
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
        // Handle validation errors or other issues
        res.status(400).json({ success: false, message: error.message });
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
        res.status(200).json({
            success: true,
            token,
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