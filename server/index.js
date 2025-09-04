const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require("dotenv").config();   // ✅ Needed to load .env

const authRoutes = require('./routes/auth');
const StudentRoutes = require('./routes/Student');
const FacultyRoutes= require('./routes/faculty')
const mailRoutes = require("./utils/mailer"); // ❌ Problem: this is not a router, it’s just utils
const path = require('path');
const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// DB connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/paperlessCampus")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB connection error:", err));

// routes
app.use('/auth', authRoutes);
app.use('/student', StudentRoutes);
app.use('/api',FacultyRoutes);
// start server
app.listen(3001, () => {
  console.log("🚀 Server is running on http://localhost:3001");
});
