const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'profile-pictures'),
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit
  // Removed fileFilter function
}).single('profileImage');

// Removed checkFileType function

module.exports = upload;
