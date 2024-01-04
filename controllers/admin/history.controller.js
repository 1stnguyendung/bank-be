const historyModel = require('../../models/history.model');
const momoModel = require('../../models/momo.model');
const utils = require('../../helpers/utils.helper')
const transferModel = require('../../models/transfer.model');


const installController = {
    game: async (req, res, next) => {
        try {
            let filters = {};
            let perPage = 10;
            let page = req.query.page || 1;
            let _sort = { updatedAt: 'desc' };

            if (req.query?.perPage) {
                perPage = req.query.perPage;
            }

            if (req.query?.status) {
                let vaildStatus = ['wait', 'transfer', 'recharge', 'errorComment', 'limitRefund', 'limitBet', 'refund', 'waitReward', 'waitRefund', 'win', 'won', 'errorMoney', 'limitPhone', 'errorPhone', 'phoneBlock'];

                if (vaildStatus.includes(req.query.status)) {
                    filters.status = req.query.status;

                    res.locals.status = req.query.status;
                }

                if (req.query.status == 'error') {
                    let allError = ['errorComment', 'limitRefund', 'limitBet', 'errorMoney', 'limitPhone', 'errorPhone', 'phoneBlock'];

                    filters.$or = allError.map((item) => {
                        return { status: item }
                    });

                    res.locals.status = req.query.status;
                }
            }

            if (req.query?.io) {
                if (req.query.io == -1 || req.query.io == 1) {
                    filters.io = Number(req.query.io);

                    res.locals.io = req.query.io;
                }
            }

            if (req.query.gameType) {
                filters.gameType = req.query.gameType;

                res.locals.gameType = req.query.gameType;
            }

            if (req.query?.search) {
                let search = req.query.search;
                let arr = [
                    {
                        phone: { $regex: search }
                    },
                    {
                        comment: { $regex: search }
                    },
                    {
                        gameName: { $regex: search }
                    },
                    {
                        gameType: { $regex: search }
                    },
                    {
                        partnerId: { $regex: search }
                    },
                    {
                        targetId: { $regex: search }
                    },
                    {
                        targetName: { $regex: search }
                    }
                ];

                filters.$or ? filters.$or.push(...arr) : filters.$or = arr;

                if (!isNaN(search)) {
                    filters.$or.push(...[
                        { transId: search },
                        { amount: search },
                        { bonus: search },
                        { postBalance: search }
                    ])
                }

                res.locals.search = search;
            }

            if (req.query.hasOwnProperty('_sort')) {
                _sort = {
                    [req.query.column]: req.query._sort
                }
            }

            let pageCount = await historyModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            const urlCurl = process.env.urlAdmin + process.env.adminPath;

            let phones = await momoModel.find({ status: 'active', loginStatus: 'active' }).lean();
            let list = await historyModel.find(filters).skip((perPage * page) - perPage).sort(_sort).limit(perPage).lean();

            res.render('admin/history/game', {
                title: 'Lịch Sử Giao Dịch', urlCurl, list, phones, perPage, pagination: {
                    page,
                    pageCount,
                    limit: pages > 5 ? 5 : pages,
                    query: utils.checkQuery(res.locals.originalUrl.search, ['page']),
                    baseURL: res.locals.originalUrl.pathname
                }
            })
        } catch (err) {
            next(err);
        }
    },
    deleteGame: async(req, res, next) => {
        try {

            var { id } = req.body;
            
            id == 'all' ? await historyModel.deleteMany() : await historyModel.findByIdAndDelete(id);

            if (id === 'all') {
                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Xóa thành công!'
                });
            } else {
                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Xóa #'+id+' thành công!'
                });
            }

        } catch (err) {
            next(err);
        }
    },
    transfer: async(req, res, next) => {
        try {
            let filters = {};
            let perPage = 10;
            let page = req.query.page || 1;
            let _sort = { updatedAt: 'desc' };

            if (req.query?.perPage) {
                perPage = req.query.perPage;
            }

            if (req.query?.phone) {
                filters.phone = req.query.phone;
                res.locals.phone = req.query.phone;
            }


            if (req.query?.search) {
                let search = req.query.search;
                let arr = [
                    {
                        phone: { $regex: search }
                    },
                    {
                        receiver: { $regex: search }
                    },
                    {
                        comment: { $regex: search }
                    }
                ];

                filters.$or ? filters.$or.push(...arr) : filters.$or = arr;

                if (!isNaN(search)) {
                    filters.$or.push(...[
                        { transId: search },
                        { amount: search },
                        { bonus: search },
                    ])
                }

                res.locals.search = search;
            }

            if (req.query.hasOwnProperty('_sort')) {
                _sort = {
                    [req.query.column]: req.query._sort
                }
            }

            let pageCount = await transferModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            const urlCurl = process.env.urlAdmin + process.env.adminPath;

            let phones = await momoModel.find({ status: 'active', loginStatus: 'active' }).lean();
            let list = await transferModel.find(filters).skip((perPage * page) - perPage).sort(_sort).limit(perPage).lean();

            res.render('admin/history/transfer', {
                title: 'Lịch Sử Chuyển Tiền', urlCurl, list, phones, perPage, pagination: {
                    page,
                    pageCount,
                    limit: pages > 5 ? 5 : pages,
                    query: utils.checkQuery(res.locals.originalUrl.search, ['page']),
                    baseURL: res.locals.originalUrl.pathname
                }
            })
        } catch (err) {
            next(err);
        }
    }
}

module.exports = installController;