const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require("dotenv").config({ path: '../.env' });

const authRoutes = require('./routes/auth');
const FacultyRoutes = require('./routes/faculty');
const lateEntriesRouter = require('./routes/lateEntries');
const latecomerRoutes = require('./routes/latecomers');
const { upload, uploadStudents, getAllStudents } = require('./controllers/excelUploadController'); // Import from new controller
const { forgotPassword, resetPassword } = require('./controllers/passwordResetController'); // Import from new controller

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app
app.use('/GEN-C_LOGIN/', express.static(path.join(__dirname, '..', 'dist')));

// For any other requests, serve the index.html of the React app
app.get('/GEN-C_LOGIN/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Add debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// DB connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/paperlessCampus")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB connection error:", err));

// Routes for Excel Upload and Student Retrieval
app.post('/api/upload', upload.single('file'), uploadStudents);
const authMiddleware = require('./middleware/auth'); // Import your auth middleware
app.post('/api/upload', authMiddleware, upload.single('file'), uploadStudents);
app.get('/api/students', authMiddleware, getAllStudents);
// Routes for Password Reset
app.post('/api/forgot-password', forgotPassword);
app.post('/api/reset-password/:token', resetPassword);

// Other Routes
app.use('/auth', authRoutes);
app.use('/api/faculty', FacultyRoutes);
app.use('/api/lateentries', lateEntriesRouter);
app.use('/api/latecomers', latecomerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`
  });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});