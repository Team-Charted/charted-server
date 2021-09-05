const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    razorpayID: {
        type: String
        // required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = Transaction = mongoose.model('transaction', TransactionSchema);