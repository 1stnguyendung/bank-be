// const giftcodeModel = require('../../models/giftcode.model')
const utils = require('../../helpers/utils.helper')

const giftcodeController = {
    index: async(req, res, next) => {
        try {

            const urlCurl = process.env.urlAdmin + process.env.adminPath;

            res.render('admin/events/giftcode', {
                title: 'Cài đặt giftcode', urlCurl
            });

        } catch (err) {
            next(err);
        }
    },

}

module.exports = giftcodeController;