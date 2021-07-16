const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    chart: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    leaderboard: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            },
            username: {
                type: String
            },
            points: {
                type: Number
            }
        }
    ]
});

module.exports = Result = mongoose.model('result', ResultSchema);