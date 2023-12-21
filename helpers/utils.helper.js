"use strict";
const cron = require('node-cron');
const moment = require("moment");
const crypto = require('crypto');

exports.checkQuery = (search, data) => {
    let query = new URLSearchParams(search);

    for (let key in data) {
        query.delete(data[key]);
    }

    return query.toString();
}