const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('./utils/logger');
require("dotenv").config({ path: '../.env' });

const authRoutes = require('./routes/auth');
const FacultyRoutes = require('./routes/faculty');
const studentRoutes = require('./routes/student'); // New student routes
const specialPassRoutes = require('./routes/specialPasses');
const hodSpecialPassRoutes = require('./routes/hodSpecialPasses'); // New HOD Special Passes routes
const hodGatePassRoutes = require('./routes/hodGatePass'); // Corrected HOD Gate Pass routes
const gatepassRoutes = require('./routes/gatepass'); // Import gatepass routes
const auditRoutes = require('./routes/audit'); // New Audit route
const libraryRoutes = require('./routes/libraryRoutes');

const latecomerRoutes = require('./routes/latecomers');
const securityRoutes = require('./routes/Security');
const statsRoutes = require('./routes/stats');
const { requireAuth } = require('./middleware/auth'); // Import your auth middleware
const { upload, uploadStudents, getAllStudents } = require('./controllers/excelUploadController'); // Import from new controller
const { forgotPassword, resetPassword } = require('./controllers/passwordResetController'); // Import from new controller

const app = express();

const server = require('http').createServer(app);
const socketManager = require('./socket');
socketManager.init(server);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "connect-src": ["'self'", "https://gen-c-login.onrender.com", "wss://gen-c-login.onrender.com"],
      // Default directives
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:"],
    },
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.path.startsWith('/socket.io'),
});
app.use(limiter);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://gen-c-group1.vercel.app'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use((req, res, next) => {
  req.io = socketManager.getIo();
  req.userSocketMap = socketManager.getUserSocketMap();
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// DB connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/paperlessCampus", {
  connectTimeoutMS: 5000, // Give up initial connection after 5 seconds
})
  .then(() => logger.info("✅ MongoDB connected"))
  .catch(err => logger.error("❌ DB connection error:", err));

// API Routes - Grouped and placed before static file serving
app.post('/api/upload', requireAuth, upload.single('file'), uploadStudents);
app.get('/api/students', requireAuth, getAllStudents);
app.post('/api/forgot-password', forgotPassword);
app.post('/api/reset-password/:token', resetPassword);
app.use('/api/auth', authRoutes);
app.use('/api/faculty', FacultyRoutes);
app.use('/api/students', studentRoutes); // Register student routes - Changed from /api/student
app.use('/api/special-passes', specialPassRoutes);
app.use('/api/hod/special-passes', hodSpecialPassRoutes); // Register HOD Special Passes routes
app.use('/api/audit', auditRoutes); // Register Audit routes
app.use('/api/gatepass/hod', hodGatePassRoutes); // Register HOD Gate Pass routes
app.use('/api/gatepass', gatepassRoutes);
app.use('/api/latecomers', latecomerRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/librarian', require('./routes/librarian')); // Register librarian routes
app.use('/api/qr-gatepass', require('./routes/qrGatePass'));

// Serve static files from the React app
// app.use('/GEN-C_LOGIN', express.static(path.join(__dirname, '..', 'dist'))); // Commented out for development

// For any other requests, serve the index.html of the React app
// app.get(/.*/, (req, res, next) => { // Commented out for development
//   // Check if the request is for an API route. If so, let it fall through
//   // to the 404 handler, otherwise serve the index.html.
//   if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/auth') || req.originalUrl.startsWith('/static/uploads')) { // Added /static/uploads
//     // Let the 404 handler below manage this. 
//     // This is optional but can make the intent clearer.
//     return next();
//   }
//   res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
// });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong!';

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Max file size is 10MB.',
    });
  }
  
  return res.status(statusCode).json({
    success: false,
    message: message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`
  });
});
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
});

server.timeout = 30000; // Set server timeout to 30 seconds
