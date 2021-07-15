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
    password: {
        type: String,
        required: true
    },
    coins: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    billboardHot100: [
        {
            title: {
                type: String,
            },
            artist: {
                type: String,
            },
            leadSingle: {
                type: Boolean,
            }
            // credits:{
            //     type: Number,
            // }
        }
    ]
});

module.exports = User = mongoose.model('user', UserSchema);