const mongoose = require('mongoose');

const BorrowingSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    bookTitle: {
        type: String,
        required: true
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Issued', 'Overdue', 'Renewed', 'Returned'],
        default: 'Issued'
    }
});

module.exports = mongoose.model('Borrowing', BorrowingSchema);