const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    chart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chart"
    },
    date: {
        type: String,
        required: true
    },
    calculatedAt: {
        type: Date,
        default: Date.now
    },
    winnings: {
        type: Number
    },
    leaderboard: [
        {
            username: {
                type: String
            },
            points: {
                type: Number
            },
            songsWithPoints: [
                {
                    points: {
                        type: Number
                    },
                    songId: {
                        type: String
                    },
                    title: {
                        type: String,
                    },
                    artist: {
                        type: String,
                    },
                    leadSingle: {
                        type: Boolean,
                    },
                    imageURL: {
                        type: String
                    }
                }
            ]
        }
    ]
});

module.exports = Result = mongoose.model('result', ResultSchema);