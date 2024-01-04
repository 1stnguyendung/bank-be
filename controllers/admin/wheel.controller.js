const utils = require('../../helpers/utils.helper')

const wheelController = {
    index: async(req, res, next) => {
        try {

            const urlCurl = process.env.urlAdmin + process.env.adminPath;

            res.render('admin/events/wheel', {
                title: 'Cài đặt vòng quay may mắn', urlCurl
            });

        } catch (err) {
            next(err);
        }
    },
}

module.exports = wheelController;