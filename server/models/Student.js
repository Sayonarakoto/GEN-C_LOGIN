const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    rollNo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    dept: {
        type: String,
        required: true
    },
    bioPhoto: {
        type: String, // URL or file path to the photo
        required: false
    }
});

module.exports = mongoose.model('Student', StudentSchema);