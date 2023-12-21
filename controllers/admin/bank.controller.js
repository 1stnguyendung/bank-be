const vcbHelper = require('../../helpers/bank.helper')
const bankModel = require('../../models/bank.model')
const utils = require('../../helpers/utils.helper')

const bankController = {
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

            let pageCount = await bankModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let count = await bankModel.aggregate([{ $group: { _id: null, amount: { $sum: '$money' } } }]);
            let data = await bankModel.find(filters).skip((perPage * page) - perPage).sort(_sort).limit(perPage).lean();

            // for (let momo of data) {
            //     threads.push(momoService.dataInfo(momo, true));
            // }

            const urlCurl = process.env.urlAdmin + process.env.adminPath;

            const searchValue = res.locals.originalUrl && res.locals.originalUrl.search;


            let list = await Promise.all(data);

            res.render('admin/bank', {
                title: 'Quản Lý Bank', urlCurl, list, count: !count.length ? 0 : count[0].amount, perPage, pagination: {
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

    getotp: async(req, res, next) => {
        try {
            var { ip_address, username, password, accountNumber, limitDay, limitMonth, betMin, betMax } = req.body;

            // Kiem tra tai khoan co trong du lieu ko
            const resutlGetOtpMsg = await vcbHelper.getOtpMsg(ip_address, username, password, accountNumber);

            // Xu ly ket qua get otp msg
            if (resutlGetOtpMsg.success === true) {

                var newBank = await new bankModel({
                    bankType: 'VCB',
                    ipAddress: ip_address,
                    username: username,
                    password: password,
                    accountNumber: accountNumber,
                    limitDay,
                    limitMonth,
                    betMin,
                    betMax,
                }).save();

                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Gửi mã OTP thành công!'
                });
            } else {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Gửi mã OTP thất bại!'
                });
            }

        } catch (e) {
            console.log(e);
        }
    },

    verify: async(req, res, next) => {
        try {
            var { ip_address, username, password, accountNumber, otp } = req.body;

            var vcb = await bankModel.find({ accountNumber: accountNumber, bankType: "VCB" });

            // Kiem tra tai khoan co trong du lieu ko
            const resutlImportOtpMsg = await vcbHelper.importOtpMsg(ip_address, username, password, accountNumber, otp);

            // Xu ly ket qua get otp msg
            if (resutlImportOtpMsg.success === true) {
                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Xác minh mã OTP thành công!'
                });

                // Thuc hien them bank
                // await bankModel.findByIdAndUpdate(vcb[0].id, { $set: { name: resultRegDevice.name, pHash: resultRegDevice.pHash, setupKey: resultRegDevice.setupKey } })


            } else {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Xác minh mã OTP thất bại!'
                });
            }

        } catch (e) {
            console.log(e);
        }
    },

    history: async(req, res, next) => {
        var { ip_address, username, password, accountNumber, begin, end } = req.body;

        // Kiem tra tai khoan co trong du lieu ko
        const resutlHistoryMsg = await vcbHelper.historyMsg(ip_address, username, password, accountNumber, begin, end);

        console.log(resutlHistoryMsg);

        // Xu ly ket qua get otp msg
        if (resutlHistoryMsg.transactions) {
            return res.status(200).json({
                'statusText': 'success',
                'status': true,
                'data': resutlHistoryMsg,
                'message': 'Gửi mã OTP thành công!'
            });
        } else {
            return res.status(200).json({
                'statusText': 'error',
                'status': false,
                'message': 'Gửi mã OTP thất bại!'
            });
        }
    },

    add: async(req, res, next) => {
        try {
            var { ipAddress, username, password, accountNumber, bankType, name } = req.body;


            if (!ipAddress || !username || !password || !accountNumber || !bankType) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Vui lòng điền đầy đủ thông tin!'
                });
            }

            // Kiem tra tai khoan co trong du lieu ko
            if (await bankModel.findOne({ username, accountNumber, bankType  })) {

                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Tài khoản đã có trong hệ thống!'
                });
            } else {
                var newBank = await new bankModel({
                    bankType,
                    ipAddress,
                    username,
                    password,
                    name,
                    accountNumber,
                }).save();

                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Thêm ngân hàng thành công!'
                });
            }

        } catch (e) {
            console.log(e);
        }
    },

    delete: async(req, res, next) => {
        try {

            let { id } = req.body;
            let data = await bankModel.findOneAndDelete({id});

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

    balance: async(req, res, next) => {
        try {

            let { accountNumber } = req.body;
            let data = await bankModel.find({accountNumber});

            if (!data) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Không tìm thấy #' + accountNumber
                })
            }

            // Kiem tra tai khoan co trong du lieu ko
            const resultGetBalance = await vcbHelper.getBalanceMsg(data[0].ipAddress, data[0].username, data[0].password, data[0].accountNumber);

            // ACB
            if (data[0].bankType == 'ACB') {

                if (resultGetBalance.messageStatus === 'success') {
                    
                    await bankModel.findByIdAndUpdate(data[0].id, { $set: { amount: resultGetBalance.data[0].totalBalance } })

                    return res.status(200).json({
                        'statusText': 'success',
                        'status': true,
                        'balance': resultGetBalance.data[0].totalBalance,
                        'message': 'Lấy số dư thành công!'
                    });

                } else {
                    return res.status(200).json({
                        'statusText': 'error',
                        'status': false,
                        'ip_address': data[0].ipAddress,
                        'message': 'Kiểm tra mã số dư thất bại!'
                    });
                }
            }

            // VCB
            if (data[0].bankType == 'VCB') {
                // Xu ly ket qua get otp msg
                if (resultGetBalance.des === 'success') {
                    
                    await bankModel.findByIdAndUpdate(data[0].id, { $set: { amount: resultGetBalance.accountDetail.currentBalance.replace(/,/g, '') } })

                    return res.status(200).json({
                        'statusText': 'success',
                        'status': true,
                        'balance': resultGetBalance.accountDetail.currentBalance.replace(/,/g, ''),
                        'message': 'Lấy số dư thành công!'
                    });

                } else {
                    return res.status(200).json({
                        'statusText': 'error',
                        'status': false,
                        'ip_address': data[0].ipAddress,
                        'message': 'Kiểm tra mã số dư thất bại!'
                    });
                }
            }
            
        } catch (err) {
            next(err);
        }
    },

}

module.exports = bankController;