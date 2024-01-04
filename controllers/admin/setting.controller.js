const settingModel = require("../../models/setting.model");
const userModel = require("../../models/user.model");
const authService = require('../../services/auth.service');

const installController = {
    index: async (req, res, next) => {
        try {
            res.render('admin/settings/system', { title: 'Cài đặt chung' })
        } catch (err) {
            next(err);
        }
    },
    update: async (req, res, next) => {
        try {
            if (!res.locals.profile.permission.editST) {
                return res.json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            for (let data in req.body) {
                if (data.includes('-')) {
                    let key = data.split('-');
                    let value = req.body[data];

                    req.body[key[0]] = {
                        ...req.body[key[0]],
                        ...{
                            [key[1]]: key[1] == 'numberTLS' ? value.replace(/\s+/g, '').split('-').filter(item => item) : (key[1] == 'mainColor' && value == '#000000' ? 'default' : value)
                        }
                    }

                    delete req.body[data];
                }
            }

            await settingModel.findOneAndUpdate({}, { $set: { ...req.body } });

            return res.json({
                success: true,
                message: 'Lưu thành công!'
            })
        } catch (err) {
            console.log(err);
            next(err);
        }
    }
}

module.exports = installController;