const eventModel = require('../../models/event.model');
const utils = require('../../helpers/utils.helper')

const eventController = {
    index: async(req, res, next) => {
        try {
            let threads = [];
            let filters = {};
            let perPage = 10;
            let page = req.query.page || 1;
            let _sort = { updatedAt: 'desc' };

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
                let vaildStatus = ['wait', 'success', 'error'];

                vaildStatus.includes(req.query.status) && (filters.status = req.query.status) && (res.locals.status = req.query.status)
            }

            if (req.query?.type) {
                let typeVaild = ['mission'];

                typeVaild.includes(req.query.type) && (filters.type = req.query.type) && (res.locals.type = req.query.type)
            }

            if (req.query.hasOwnProperty('_sort')) {
                _sort = {
                    [req.query.column]: req.query._sort
                }
            }

            let pageCount = await eventModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let data = await eventModel.find(filters).skip((perPage * page) - perPage).sort(_sort).limit(perPage).lean();

            let [amountMission] = await Promise.all([eventModel.aggregate([{ $match: { type: 'mission' } }, { $group: { _id: null, bonus: { $sum: '$bonus' } } }])]);

            amountMission = amountMission.length ? amountMission[0].bonus : 0;

            const urlCurl = process.env.urlAdmin + process.env.adminPath;

            const searchValue = res.locals.originalUrl && res.locals.originalUrl.search;

            let list = await Promise.all(data);

            res.render('admin/events/index', {
                title: 'Quản Lý Event', urlCurl, list, amountMission, perPage, pagination: {
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
    delete: async(req, res, next) => {
        try {

            let { id } = req.body;
            let data = await eventModel.findOneAndDelete({id});

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

module.exports = eventController;