const mongoose = require('mongoose');

const LibraryPassSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'requesterModel'
    },
    requesterModel: {
        type: String,
        required: true,
        enum: ['Student', 'Faculty']
    },
    passType: { // Added from user request context, e.g. 'Reference', 'Borrow'
        type: String,
        required: true,
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
    },
    idProofPath: {
        type: String,
        required: false
    },
    // Fields for Book Borrow Requests (Crowdsourcing)
    bookTitle: { type: String },
    bookAuthor: { type: String },
    bookISBN: { type: String },
    bookCategory: { type: String },
    borrowDuration: { type: Number, default: 14 } // Default 14 days
});

module.exports = mongoose.model('LibraryPass', LibraryPassSchema);