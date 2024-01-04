const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    amount: String,
    playCount: Number,
    limit: Number,
    players: Array,
    status: {
        type: String,
        default: 'active'
    },
    expiredAt: Date
}, {
    timestamps: true
})

module.exports = mongoose.model('gift', giftSchema);