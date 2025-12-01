const mongoose = require('mongoose');

const LibraryPassSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Librarian/Admin
        required: false
    },
    passImage: {
        type: String, // URL to the generated PNG Card
        required: false
    }
});

module.exports = mongoose.model('LibraryPass', LibraryPassSchema);