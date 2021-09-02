const mongoose = require('mongoose');

const ChartSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    prizePool: {
        type: Number,
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    }
});

module.exports = Chart = mongoose.model('chart', ChartSchema);