const giftcodeModel = require('../../models/gift.model')
const utils = require('../../helpers/utils.helper')


function generateRandomString(length) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomString = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        randomString += charset.charAt(randomIndex);
    }

    return randomString;
}

const giftcodeController = {
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
                        code: { $regex: search }
                    }
                ]

                res.locals.search = search;
            }

            if (req.query?.status) {
                let vaildStatus = ['active', 'pending'];

                vaildStatus.includes(req.query.status) && (filters.status = req.query.status) && (res.locals.status = req.query.status)
            }

            if (req.query.hasOwnProperty('_sort')) {
                _sort = {
                    [req.query.column]: req.query._sort
                }
            }

            let pageCount = await giftcodeModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let count = await giftcodeModel.aggregate([{ $group: { _id: null, amount: { $sum: '$money' } } }]);
            let data = await giftcodeModel.find(filters).skip((perPage * page) - perPage).sort(_sort).limit(perPage).lean();

            const urlCurl = process.env.urlAdmin + process.env.adminPath;

            const searchValue = res.locals.originalUrl && res.locals.originalUrl.search;


            let list = await Promise.all(data);

            res.render('admin/events/giftcode', {
                title: 'Quản Lý Giftcode', urlCurl, list, count: !count.length ? 0 : count[0].amount, perPage, pagination: {
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
            var { type, code, amount, count, min } = req.body;

            if (!type || !amount || !count || !min) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Vui lòng điền đầy đủ thông tin!'
                });
            }

            if (type == 'ONE') {
                if (!code) {
                    return res.status(200).json({
                        'statusText': 'error',
                        'status': false,
                        'message': 'Vui lòng điền đầy đủ thông tin!'
                    });
                }

                if (await giftcodeModel.findOne({ code })) {

                    return res.status(200).json({
                        'statusText': 'error',
                        'status': false,
                        'message': 'Điều kiện đã có trong hệ thống!'
                    });

                } else {
                    var newGift = await new giftcodeModel({
                        code,
                        amount,
                        limit: count,
                        playCount: min,
                    }).save();

                    return res.status(200).json({
                        'statusText': 'success',
                        'status': true,
                        'message': 'Thêm giftcode thành công!'
                    });
                }
            }

            if (type == 'MANY') {
                var countCode = 0;
                for (let i = 0; i < count; i++) {
                    var code = generateRandomString(8);
                    if (await giftcodeModel.findOne({ code })) {
                        return res.status(200).json({
                            'statusText': 'error',
                            'status': false,
                            'message': 'Điều kiện đã có trong hệ thống!'
                        });
                    } else {
                        countCode++;
                        var newGift = await new giftcodeModel({
                            code: code,
                            amount,
                            limit: 1,
                            playCount: min,
                        }).save();  
                    }
                }

                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Thêm '+countCode+' giftcode thành công!'
                })
            }

        } catch (e) {
            console.log(e);
        }
    },

    update: async(req, res, next) => {
        try {
            var { id } = req.body;

            if (!id) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Vui lòng điền đầy đủ thông tin!'
                });
            }

            // Kiem tra tai khoan co trong du lieu ko
            if (!await giftcodeModel.findByIdAndUpdate(id, { $set: { ...req.body } })) {
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
            let data = await giftcodeModel.findOneAndDelete({id});

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

module.exports = giftcodeController;