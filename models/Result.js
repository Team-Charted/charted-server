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
                    // credits:{
                    //     type: Number,
                    // }
                }
            ]
        }
    ]
});

module.exports = Result = mongoose.model('result', ResultSchema);