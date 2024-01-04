
const settingModel = require('../models/setting.model')

const gameHelper = {

    game: async() => {

        let settings = await settingModel.findOne().lean();

        let event = [
            { 
                id: 99, 
                name: 'Nhiệm vụ ngày', 
                eventType: 'mission',
                rate: Math.floor(Math.random() * 99999999),
                noti: settings.missionData.noti
            },
            {
                id: 100, 
                name: 'Mã quà tặng', 
                eventType: 'giftcode',
                rate: Math.floor(Math.random() * 99999999),
                noti: settings.giftCode.noti
            }
        ];
        return event
    },
}

module.exports = gameHelper;