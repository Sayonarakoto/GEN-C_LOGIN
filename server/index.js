const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');   // import auth routes
const StudentRoutes=require('./routes/Student')
const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// DB connection
mongoose.connect("mongodb://localhost:27017/paperlessCampus")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB connection error:", err));

// routes
app.use('/auth', authRoutes);  // all auth endpoints start with /auth
app.use('/Student',StudentRoutes)
// start server
app.listen(3001, () => {
  console.log("🚀 Server is running on http://localhost:3001");
});
