const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    coins: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: String,
        default: Date.now()
    },
    contactID: {
        type: String,
        required: true
    },
    fundAccountID: {
        type: String
    }
});

module.exports = User = mongoose.model('user', UserSchema);