const User = require('../models/User');

// @desc    Register a new librarian
// @route   POST /api/librarian/register
// @access  Public
exports.register = async (req, res, next) => {
    const { facultyId, email, password, fullName } = req.body;

    try {
        // Create user
        const user = await User.create({
            facultyId,
            email,
            password,
            fullName,
            role: 'librarian' // Ensure role is set
        });

        res.status(201).json({
            success: true,
            message: 'Librarian registered successfully'
        });
    } catch (error) {
        // Handle validation errors or other issues
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Login a librarian
// @route   POST /api/librarian/login
// @access  Public
exports.login = async (req, res, next) => {
    const { facultyId, password } = req.body;

    // Validate input
    if (!facultyId || !password) {
        return res.status(400).json({ success: false, message: 'Please provide a faculty ID and password' });
    }

    try {
        // Check for user
        const user = await User.findOne({ facultyId }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = user.getSignedJwtToken();
        
        // Return user and token
        const userData = {
            id: user._id,
            role: user.role,
            fullName: user.fullName,
            department: user.department,
            facultyId: user.facultyId
        };

        res.status(200).json({
            success: true,
            token,
            user: userData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


exports.forgotPassword = (req, res, next) => {
    // Logic: 1.3 Forgot Password (Email Reset)
    res.status(200).json({ success: true, message: 'Forgot password placeholder' });
};