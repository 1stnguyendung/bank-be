const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    phone: String,
    amount: Number,
    bonus: Number,
    type: String,
    description: String,
    status: {
        type: String,
        default: 'wait'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('event', eventSchema);