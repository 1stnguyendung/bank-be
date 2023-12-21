// const missionModel = require('../../models/mission.model')
const utils = require('../../helpers/utils.helper')

const missionController = {
    index: async(req, res, next) => {
        try {

            const urlCurl = process.env.urlAdmin + process.env.adminPath;

            res.render('admin/events/mission', {
                title: 'Cài đặt nhiệm vụ ngày', urlCurl
            });

        } catch (err) {
            next(err);
        }
    },

}

module.exports = missionController;