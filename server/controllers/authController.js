const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Student = require('../models/student');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendResetEmail } = require('../utils/mailer');  // ✅ fix import

// signup
exports.signup = async (req, res) => {
  try {
    const { studentId, fullName, department, year, email, password } = req.body;

    const existing = await Student.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new Student({
      studentId, fullName, department, year, email, password: hashedPassword
    });
    await newStudent.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// login
// A controller file (e.g., controllers/authController.js)
// This function now holds the login logic and is ready to be exported
exports.signin = async (req, res) => {
  try {
    const { studentId, password } = req.body; 
    
    // Find student by studentId
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Create a JWT token for the user
    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // Success - send the token and user data
    res.json({
      message: "Login successful",
      token: token,
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        department: student.department,
        year: student.year,
      },
    });
  } catch (error) {
    console.error("❌ Error logging in:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const student = await Student.findOne({ email });

    res.json({ message: "If this account exists, a reset link has been sent." });

    if (!student) return;

    await PasswordResetToken.deleteMany({ userId: student._id });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await PasswordResetToken.create({
      userId: student._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 3600000) // ✅ Date object
    });

    const resetUrl = `http://localhost:5173/forget?token=${token}`;
    await sendResetEmail(student.email, resetUrl); // ✅ correct util function
  } catch (err) {
    console.error(err);
  }
};

// reset password
exports.refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ error: "Refresh token is required." });
  }

  try {
    // 1. Verify the refresh token without ignoring expiration
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. Check the database to see if the refresh token exists and is not expired
    const refreshTokenDoc = await RefreshToken.findOne({ 
      token: token,
      expiresAt: { $gt: new Date() } 
    });

    if (!refreshTokenDoc) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // 3. Generate a new access token
    const newAccessToken = jwt.sign({ id: payload.id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // (Optional but recommended) Invalidate the old refresh token by deleting it
    await RefreshToken.deleteOne({ token: token });

    // (Optional but recommended) Generate a new refresh token for the next use
    const newRefreshToken = jwt.sign({ id: payload.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const newRefreshTokenDoc = new RefreshToken({
      userId: payload.id,
      token: newRefreshToken,
      expiresAt: addDays(new Date(), 7) 
    });
    await newRefreshTokenDoc.save();

    // 4. Send back the new access and refresh tokens
    res.json({ token: newAccessToken, refreshToken: newRefreshToken });

  } catch (err) {
    // If jwt.verify fails, it will throw an error
    res.status(401).json({ error: "Invalid or expired refresh token." });
  }
};