const missionModel = require('../../models/mission.model')
const utils = require('../../helpers/utils.helper')

const missionController = {
    index: async(req, res, next) => {
        try {

            let threads = [];
            let filters = {};
            let perPage = 10;
            let page = req.query.page || 1;
            let _sort = { level: 'asc' };

            if (req.query?.perPage) {
                perPage = req.query.perPage;
            }

            if (req.query?.search) {
                let search = req.query.search;

                filters.$or = [
                    {
                        phone: { $regex: search }
                    },
                    {
                        name: { $regex: search }
                    }
                ]

                if (!isNaN(search)) {
                    filters.$or.push(...[
                        { amount: search },
                        { betMax: search },
                        { betMin: search },
                        { number: search },
                        { limitDay: search },
                        { limitMonth: search }
                    ])
                }

                res.locals.search = search;
            }

            if (req.query?.status) {
                let vaildStatus = ['active', 'limit', 'pending', 'error'];

                vaildStatus.includes(req.query.status) && (filters.status = req.query.status) && (res.locals.status = req.query.status)
            }

            if (req.query?.loginStatus) {
                let loginVaild = ['refreshError', 'waitLogin', 'errorLogin', 'active', 'waitOTP', 'waitSend', 'error'];

                loginVaild.includes(req.query.loginStatus) && (filters.loginStatus = req.query.loginStatus) && (res.locals.loginStatus = req.query.loginStatus)
            }

            if (req.query.hasOwnProperty('_sort')) {
                _sort = {
                    [req.query.column]: req.query._sort
                }
            }

            let pageCount = await missionModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let count = await missionModel.aggregate([{ $group: { _id: null, amount: { $sum: '$money' } } }]);
            let data = await missionModel.find(filters).skip((perPage * page) - perPage).sort(_sort).limit(perPage).lean();

            const urlCurl = process.env.urlAdmin + process.env.adminPath;

            const searchValue = res.locals.originalUrl && res.locals.originalUrl.search;


            let list = await Promise.all(data);

            res.render('admin/events/mission', {
                title: 'Quản Lý Nhiệm Vụ Ngày', urlCurl, list, count: !count.length ? 0 : count[0].amount, perPage, pagination: {
                    page,
                    pageCount,
                    limit: pages > 5 ? 5 : pages,
                    query: utils.checkQuery(searchValue, ['page']),
                    baseURL: res.locals.originalUrl && res.locals.originalUrl.pathname
                }
            });

        } catch (err) {
            next(err);
        }
    },

    add: async(req, res, next) => {
        try {
            var { min, gift, level } = req.body;


            if (!min || !gift, !level ) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Vui lòng điền đầy đủ thông tin!'
                });
            }

            // Kiem tra tai khoan co trong du lieu ko
            if (await missionModel.findOne({ level, amount: min })) {

                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Điều kiện đã có trong hệ thống!'
                });
            } else {
                var newMission = await new missionModel({
                    level,
                    amount: min,
                    bonus: gift,
                }).save();

                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Thêm điều kiện phần thưởng nhiệm vụ ngày thành công!'
                });
            }

        } catch (e) {
            console.log(e);
        }
    },

    update: async(req, res, next) => {
        try {
            var { id, min, gift, level } = req.body;


            if (!min || !gift || !level || !id ) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Vui lòng điền đầy đủ thông tin!'
                });
            }

            // Kiem tra tai khoan co trong du lieu ko
            if (!await missionModel.findByIdAndUpdate(id, { $set: { level: level, amount: min, bonus: gift } })) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Không tìm thấy #' + id
                });
            }

            return res.status(200).json({
                'statusText': 'success',
                'status': true,
                'message': 'Lưu thành công #' + id
            });


        } catch (e) {
            console.log(e);
        }
    },

    delete: async(req, res, next) => {
        try {

            let { id } = req.body;
            let data = await missionModel.findOneAndDelete({id});

            if (!data) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Không tìm thấy #' + id
                })
            }

            return res.status(200).json({
                'statusText': 'success',
                'status': true,
                'message': 'Xóa thành công #' + id
            })

        } catch (err) {
            next(err);
        }
    },
}

module.exports = missionController;