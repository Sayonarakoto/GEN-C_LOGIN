const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Student = require("../models/student");
const Faculty = require("../models/Faculty");
const PasswordResetToken = require("../models/PasswordResetToken");
//const RefreshToken = require("../models/RefreshToken");
const { sendResetEmail } = require("../utils/mailer"); // ✅ implement separately

// JWT generator with fallback secret
const generateToken = (payload, expiresIn = "1h") => {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(payload, secret, { expiresIn });
};

// ----------------- STUDENT LOGIN -----------------
exports.studentLogin = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = generateToken({ id: student._id, role: "student" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        department: student.department,
        year: student.year,
        email: student.email,
      },
    });
  } catch (err) {
    console.error("Student login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------- FACULTY LOGIN -----------------
exports.facultyLogin = async (req, res) => {
  try {
    console.log("📩 Incoming login request:", req.body);
    const { employeeId, password } = req.body;

    // 1. Find faculty
    const faculty = await Faculty.findOne({ employeeId });
    if (!faculty) {
      return res.status(401).json({
        success: false,
        message: "Invalid Faculty ID or password",
      });
    }

    // 2. Compare password
    const isValidPassword = await bcrypt.compare(password, faculty.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid Faculty ID or password",
      });
    }

    // 3. Prepare clean response (without password)
    const facultyData = faculty.toObject();
    delete facultyData.password;

    // ✅ No JWT for now — just return success + faculty data
    res.json({
      success: true,
      message: "Login successful",
      faculty: facultyData,
    });
  } catch (err) {
    console.error("Faculty login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ----------------- FORGOT PASSWORD -----------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const student = await Student.findOne({ email });

    // Always return success (avoid leaking valid emails)
    res.json({ message: "If this account exists, a reset link has been sent." });

    if (!student) return;

    await PasswordResetToken.deleteMany({ userId: student._id });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await PasswordResetToken.create({
      userId: student._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });

    const resetUrl = `http://localhost:5173/forget?token=${token}`;
    await sendResetEmail(student.email, resetUrl);
  } catch (err) {
    console.error("Forgot password error:", err);
  }
};

// ----------------- RESET PASSWORD -----------------
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetDoc = await PasswordResetToken.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!resetDoc) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Student.findByIdAndUpdate(resetDoc.userId, { password: hashedPassword });

    await PasswordResetToken.deleteMany({ userId: resetDoc.userId });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ----------------- REFRESH TOKEN -----------------
exports.refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ error: "Refresh token is required." });

  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    const payload = jwt.verify(token, secret);

    const refreshTokenDoc = await RefreshToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });
    if (!refreshTokenDoc) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const newAccessToken = generateToken({ id: payload.id }, "15m");

    // Invalidate old refresh
    await RefreshToken.deleteOne({ token });

    // Generate new refresh
    const newRefreshToken = generateToken({ id: payload.id }, "7d");
    await RefreshToken.create({
      userId: payload.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired refresh token." });
  }
};
