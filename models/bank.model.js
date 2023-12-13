const mongoose = require('mongoose');

const momoSchema = mongoose.Schema({
    ipAddress: String,
    accountNumber: {
        type: String,
        required: true,
        unique: true
    },
    bankType: String,
    username: String,
    password: String,
    amount: {
        type: Number,
        default: 0
    },
    limitDay: {
        type: Number,
        default: 50000000
    },
    limitMonth: {
        type: Number,
        default: 100000000
    },
    betMin: {
        type: Number,
        default: 10000
    },
    betMax: {
        type: Number,
        default: 500000
    },
    loginAt: Date,
    status: {
        type: String,
        default: 'active'
    },
    loginStatus: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Vietcombank', momoSchema);