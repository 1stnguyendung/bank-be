"use strict";
const moment = require("moment");
const settingModel = require('../models/setting.model');
const logModel = require('../models/log.model');
const telegramHelper = require('../helpers/telegram.helper');

module.exports = {
    create: async (typeData, content, telegram = true) => {
        if (telegram) {
            let dataSetting = await settingModel.findOne();
            (dataSetting.telegram.token && dataSetting.telegram.chatId) && await telegramHelper.sendText(dataSetting.telegram.token, dataSetting.telegram.chatId, `${typeData} | ${content}`);
        }

        const logContent = await new logModel({ typeData, content: content.replace(/\n/g, '<br>') }).save();
        return socket.emit("logSystem", {
            ...logContent._doc
        }), logContent;
    }
}