const { generateToken } = require('../config/jwt');
const bcrypt = require('bcrypt');
const Faculty = require('../models/Faculty');
const Student = require('../models/student');
const Security = require('../models/security');

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

    const token = generateToken({
      id: student._id,
      role: 'student',
      name: student.fullName
    });

    res.json({
      success: true,
      token,
      student: { ...student.toObject(), password: undefined }
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

    const token = generateToken({
      id: faculty._id,
      role: 'faculty',
      name: faculty.fullName
    });

    const facultyData = faculty.toObject();
    delete facultyData.password;

    res.json({
      success: true,
      message: "Login successful",
      token,
      faculty: facultyData,
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

    const token = generateToken({ id: security._id, role: 'security', name: 'Security' });
    console.log('Token generated. Login successful.'); // Added log
    return res.json({ success: true, message: 'Login successful', token });
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
      const ok = await bcrypt.compare(password, student.password);
      if (!ok) {
        console.log('Password mismatch for studentId:', studentId);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log('Student login successful for studentId:', studentId);
      const token = generateToken({ id: student._id, role: 'student', name: student.fullName });
      return res.json({ token, user: { id: student._id, role: 'student', studentId: student.studentId, fullName: student.fullName }});
    }

    if (role === 'faculty') {
      const { employeeId, facultyId, password } = req.body;
      const id = employeeId || facultyId;
      console.log('Attempting faculty login for employeeId:', id);
      const faculty = await Faculty.findOne({ employeeId: id });
      if (!faculty) {
        console.log('Faculty not found for employeeId:', id);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log('Faculty found:', faculty.fullName);
      const ok = await bcrypt.compare(password, faculty.password);
      if (!ok) {
        console.log('Password mismatch for employeeId:', id);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log('Faculty login successful for employeeId:', id);
      const token = generateToken({ id: faculty._id, role: 'faculty', name: faculty.fullName });
      console.log('Generated token for faculty:', token, typeof token);
      const f = faculty.toObject(); delete f.password;
      return res.json({ token, user: { id: faculty._id, role: 'faculty', ...f }});
    }

    if (role === 'security') {
      const { passkey } = req.body;
      // Decide how security users are stored (single or multiple). Assuming one doc:
      const security = await Security.findOne(); // or Security.findOne({ username }) if such field exists
      if (!security) return res.status(401).json({ message: "Security user not found" });
      const ok = await bcrypt.compare(passkey, security.passkey);
      if (!ok) return res.status(401).json({ message: "Invalid passkey" });
      const token = generateToken({ id: security._id, role: 'security' });
      return res.json({ token, user: { id: security._id, role: 'security' }});
    }

    return res.status(400).json({ message: "Unsupported role" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
