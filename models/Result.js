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
    leaderboard: [
        {
            username: {
                type: String
            },
            points: {
                type: Number
            },
            albumName: {
                type: String
            },
            songsWithPoints: [
                {
                    points: {
                        type: Number
                    },
                    title: {
                        type: String,
                    },
                    artist: {
                        type: String,
                    },
                    leadSingle: {
                        type: Boolean,
                    }
                }
            ]
        }
    ]
});

module.exports = Result = mongoose.model('result', ResultSchema);