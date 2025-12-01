const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    facultyId: {
        type: String,
        required: [true, 'Please provide faculty ID'],
        unique: true,
        trim: true
    },
    fullName: {
        type: String,
        required: [true, 'Please provide a full name']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please use a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false // Do not return the password hash by default
    },
    role: {
        type: String,
        enum: ['librarian', 'admin'],
        default: 'librarian'
    },
    department: {
        type: String,
        default: 'Library'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

// Middleware to hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords for login
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { 
            id: this._id, 
            role: this.role,
            fullName: this.fullName,
            department: this.department,
            facultyId: this.facultyId
        }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: process.env.JWT_EXPIRE || '1h',
        }
    );
};

module.exports = mongoose.model('User', UserSchema);