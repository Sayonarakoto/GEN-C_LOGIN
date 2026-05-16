const User = require('../models/User');
const createError = require('../utils/error');

// @desc    Upload profile picture for librarian
// @route   POST /api/librarian/upload-profile-picture
// @access  Private (Librarian)
exports.uploadProfilePicture = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(createError('No file uploaded.', 400));
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return next(createError('User not found.', 404));
        }

        // Use '/uploads' to match server/index.js static serve
        user.profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
        await user.save();

        res.json({ success: true, filePath: user.profilePictureUrl, message: 'Profile picture uploaded successfully.' });
    } catch (error) {
        console.error('Error uploading librarian profile picture:', error);
        next(error);
    }
};

// @desc    Update librarian profile details
// @route   PUT /api/librarian/profile
// @access  Private (Librarian)
exports.updateProfile = async (req, res, next) => {
    try {
        const { fullName, email, profilePictureUrl } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return next(createError('User not found.', 404));
        }

        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (profilePictureUrl) user.profilePictureUrl = profilePictureUrl;

        await user.save();

        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Error updating librarian profile:', error);
        if (error.code === 11000) {
             return next(createError('Email already in use.', 400));
        }
        next(error);
    }
};
