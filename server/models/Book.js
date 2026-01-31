const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String },
    isbn: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls if ISBN is missing
    category: { type: String },
    totalCopies: { type: Number, default: 1 },
    availableCopies: { type: Number, default: 0 }, // 0 because the first one is immediately borrowed
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Track which student "found" this book
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', BookSchema);
