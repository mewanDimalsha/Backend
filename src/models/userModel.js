const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    userId: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'user'],
        default: 'user',
    },
}, { 
    timestamps: true,
    versionKey: false // Remove __v field
});

// Ensure the collection name is explicitly set
const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
