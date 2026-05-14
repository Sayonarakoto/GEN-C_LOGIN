const User = require('../models/User');

// @desc    Upload profile picture for librarian
// @route   POST /api/librarian/upload-profile-picture
// @access  Private (Librarian)
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Use '/uploads' to match server/index.js static serve
        user.profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
        await user.save();

        res.json({ success: true, filePath: user.profilePictureUrl, message: 'Profile picture uploaded successfully.' });
    } catch (error) {
        console.error('Error uploading librarian profile picture:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update librarian profile details
// @route   PUT /api/librarian/profile
// @access  Private (Librarian)
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email, profilePictureUrl } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (profilePictureUrl) user.profilePictureUrl = profilePictureUrl;

        await user.save();

        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Error updating librarian profile:', error);
        if (error.code === 11000) {
             return res.status(400).json({ success: false, message: 'Email already in use.' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};