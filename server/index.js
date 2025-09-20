const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require("dotenv").config({ path: '../.env' });

const authRoutes = require('./routes/auth');
const StudentRoutes = require('./routes/Student');
const FacultyRoutes = require('./routes/faculty');
const lateEntriesRouter = require('./routes/lateEntries');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// DB connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/paperlessCampus")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB connection error:", err));

// Routes
app.use('/auth', authRoutes);
app.use('/student', StudentRoutes);
app.use('/api/faculty', FacultyRoutes);
app.use('/api/lateentries', lateEntriesRouter);

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
