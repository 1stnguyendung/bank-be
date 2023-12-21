const moment = require('moment');
const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
    level: Number,
    amount: Number,
    bonus: Number,
}, {
    timestamps: true
})

module.exports = mongoose.model('mission', missionSchema);