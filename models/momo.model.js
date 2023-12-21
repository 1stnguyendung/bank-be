const mongoose = require('mongoose');

const momoSchema = mongoose.Schema({
    name: String,
    phone: {
        type: String,
        required: true,
        unique: true
    },
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
    number: {
        type: Number,
        default: 180
    },
    betMin: {
        type: Number,
        default: 10000
    },
    betMax: {
        type: Number,
        default: 500000
    },
    rKey: String,
    imei: String,
    SECUREID: String,
    AAID: String,
    TOKEN: String,
    dataDevice: Object,
    setupKey: String,
    phash: String,
    description: String,
    AUTH_TOKEN: String,
    REFRESH_TOKEN: String,
    REQUEST_ENCRYPT_KEY: String,
    sessionKeyTracking: String,
    agentId: String,
    deviceToken: String,
    requestEncryptKey: String,
    sessionKey: String,
    modelId: String,
    tbid: String,
    loginAt: Date,
    status: {
        type: String,
        default: 'active'
    },
    loginStatus: String
}, {
    timestamps: true
})

module.exports = mongoose.model('momo', momoSchema);