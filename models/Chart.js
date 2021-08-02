const mongoose = require('mongoose');

const ChartSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cost: {
        type: Number
    },
    type: {
        type: String,
        required: true
    },
    nextDate: {
        type: String,
        required: true
    }
});

module.exports = Chart = mongoose.model('chart', ChartSchema);