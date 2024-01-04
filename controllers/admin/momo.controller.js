const momoHelper = require('../../helpers/momo.helper')
const momoModel = require('../../models/momo.model')
const transferModel = require('../../models/transfer.model')
const utils = require('../../helpers/utils.helper')
const momoService = require('../../services/momo.service')
const logHelper = require('../../helpers/log.helper');

const momoController = {
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

            let pageCount = await momoModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let count = await momoModel.aggregate([{ $group: { _id: null, amount: { $sum: '$money' } } }]);
            let data = await momoModel.find(filters).skip((perPage * page) - perPage).sort(_sort).limit(perPage).lean();

            for (let momo of data) {
                threads.push(momoService.dataInfo(momo, true));
            }

            const urlCurl = process.env.urlAdmin + process.env.adminPath;

            const searchValue = res.locals.originalUrl && res.locals.originalUrl.search;


            let list = await Promise.all(threads);
            res.render('admin/momo', {
                title: 'Quản Lý Momo', urlCurl, list, count: !count.length ? 0 : count[0].amount, perPage, pagination: {
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
            var { phone } = req.body;

            if (!phone) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Vui lòng điền đầy đủ thông tin.'
                });
            }

            var resultCheckUser = await momoHelper.checkUserBeMsg(phone);

            if (await momoModel.findOne({ phone })) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Vui lòng xoá momo ' + phone + ' để thực hiện lấy OTP.'
                });
            }

            // Lay ma otp
            var resultSendOtp = await momoHelper.sendOTPMsg(phone, resultCheckUser.tbid, resultCheckUser.sessionKeyTracking, resultCheckUser.imei);

            if (!resultSendOtp.message) {
                // Tao du lieu momo
                await new momoModel({
                    imei: resultCheckUser.imei,
                    dataDevice: resultCheckUser.dataDevice,
                    tbid: resultCheckUser.tbid,
                    sessionKeyTracking: resultCheckUser.sessionKeyTracking,
                    modelId: resultSendOtp.modelId,
                    rKey: resultSendOtp.rKey,
                    deviceToken: resultSendOtp.deviceToken,
                    phone: phone,
                    loginStatus: 'waitOTP'
                }).save();

            } else {
                return res.json({
                    "statusText": "error",
                    "status": false,
                    "message": resultSendOtp.message
                })
            }

            return res.json({
                "statusText": "success",
                "status": true,
                "message": "Gửi mã OTP thành công!"
            })

        } catch (err) {
            next(err);
        }
    },

    verfiy: async(req, res, next) => {
        try {

            var { phone, password, otp } = req.body;

            if (!phone || !password || !otp) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Vui lòng điền đầy đủ thông tin.'
                });
            }


            // Tim kiem momo
            var momo = await momoModel.find({ phone: phone });

            if (!momo) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Số momo không có trong hệ thống.'
                });
            }

            // Thuc hien reg thiet bi
            var resultRegDevice = await momoHelper.regDeviceMsg(phone, password, otp, momo[0].tbid, momo[0].sessionKeyTracking, momo[0].imei, momo[0].rKey, momo[0].modelId, momo[0].deviceToken);

            if (resultRegDevice.name) {
                await momoModel.findByIdAndUpdate(momo[0].id, { $set: { name: resultRegDevice.name, pHash: resultRegDevice.pHash, setupKey: resultRegDevice.setupKey } })
            } else {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': resultRegDevice.message
                });
            }

            var resultLogin = await momoHelper.loginMsg(phone, password, resultRegDevice.pHash, momo[0].modelId, momo[0].deviceToken, resultRegDevice.setupKey);

            if (resultLogin.accessToken) {
                await momoModel.findByIdAndUpdate(momo[0].id, { 
                    $set: 
                    { 
                        AUTH_TOKEN: resultLogin.accessToken, 
                        sessionKey: resultLogin.sessionKey, 
                        agentId: resultLogin.agentId, 
                        requestEncryptKey: resultLogin.requestEncryptKey ,
                        REFRESH_TOKEN: resultLogin.REFRESH_TOKEN,
                        amount: resultLogin.balance,
                        loginStatus: 'active',
                        pHash: resultRegDevice.pHash,
                        password
                    } 
                })
                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Thêm Momo thành công!'
                });
            } else {
                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Đã sảy ra lỗi khi thêm momo!'
                });
            }

        } catch (err) {
            console.log(err);
        }
    },

    history: async(req, res, next) => {
        try {
            var { token, start_date, end_date } = req.body;

            var momoData = await momoModel.findOne({ imei: token });

            if (!momoData) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Số momo không có trong hệ thống.'
                });
            }

            var resultBrowserTransactions = await momoHelper.browseTransactions(momoData.phone, momoData.AUTH_TOKEN, momoData.agentId, momoData.sessionKey, momoData.tbid, momoData.sessionKeyTracking, start_date, end_date, momoData.requestEncryptKey)


            console.log(resultBrowserTransactions);


        } catch (err) {
            console.log(err);
        }
    },

    delete: async(req, res, next) => {
        try {

            let { phone } = req.body;
            let data = await momoModel.findOneAndDelete({phone});

            if (!data) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Không tìm thấy số ' + phone
                })
            }

            return res.status(200).json({
                'statusText': 'success',
                'status': true,
                'message': 'Xóa thành công số ' + phone
            })

        } catch (err) {
            next(err);
        }
    },

    list: async(req, res, next) => {
        try {
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

            let pageCount = await momoModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let count = await momoModel.aggregate([{ $group: { _id: null, amount: { $sum: '$amount' } } }]);
            let list = await momoModel.find(filters).skip((perPage * page) - perPage).sort(_sort).limit(perPage).lean();
            res.json({
                    title: 'Danh sách MOMO', list, count: !count.length ? 0 : count[0].amount, perPage, pagination: {
                    page,
                    pageCount,
                    limit: pages > 5 ? 5 : pages,
                    // query: utils.checkQuery(res.locals.originalUrl.search, ['page']),
                    // baseURL: res.locals.originalUrl.pathname
                }
            });
        } catch(err) {
            console.log(err)
        }
    },

    transfer: async(req, res, next) => {
        try {
            var { token, receiver, amount, memo } = req.body;

            var momoData = await momoModel.findOne({ imei: token });

            if (!momoData) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Số momo không có trong hệ thống.'
                });
            }

            var resultSendMoney = await momoHelper.sendMoneyMsg(momoData.phone, momoData.password, momoData.AUTH_TOKEN, momoData.agentId, momoData.sessionKey, momoData.tbid, momoData.sessionKeyTracking, momoData.setupKey, momoData.requestEncryptKey, receiver, amount, memo)


            if (resultSendMoney.result === true) {
                await new transferModel({ 
                    transId: resultSendMoney.momoMsg.replyMsgs[0].transId, 
                    phone: momoData.phone,
                    receiver: receiver, 
                    firstMoney: momoData.amount, 
                    lastMoney: (momoData.amount - amount), 
                    amount: amount, 
                    comment: memo 
                }).save();

                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Chuyển tiền đến ' + momoData.phone + ' thành công. (#' + resultSendMoney.momoMsg.replyMsgs[0].transId + ') Người nhận ' + resultSendMoney.momoMsg.replyMsgs[0].tranHisMsg.partnerName,
                    'data': resultSendMoney
                });
            } else {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Chuyển tiền đến ' + momoData.phone + ' thất bại',
                    // 'data': resultSendMoney
                });
            }


        } catch (err) {
            console.log(err);
        }
    },

    refresh: async(req, res, next) => {
        try {
            var { phone } = req.body;

            var momoData = await momoModel.findOne({ phone });

            if (!momoData) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Số momo không có trong hệ thống.'
                });
            }

            // var resultLogin = await momoHelper.loginMsg(phone, momoData.password, momoData.pHash, momoData.modelId, momoData.deviceToken, momoData.setupKey);
            var resultLogin = await momoHelper.refreshToken(phone);

            console.log(resultLogin);

            if (resultLogin.success) {
                    return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Đổi token đăng nhập momo ' + momoData.phone + ' thành công'
                });
            } else {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Đổi token đăng nhập momo ' + momoData.phone + ' thất bại'
                });
            }

            // if (resultLogin.accessToken) {
            //     await momoModel.findByIdAndUpdate(momoData._id, { 
            //         $set: 
            //         { 
            //             AUTH_TOKEN: resultLogin.accessToken, 
            //             sessionKey: resultLogin.sessionKey, 
            //             agentId: resultLogin.agentId, 
            //             requestEncryptKey: resultLogin.requestEncryptKey ,
            //             REFRESH_TOKEN: resultLogin.REFRESH_TOKEN,
            //             amount: resultLogin.balance,
            //             loginStatus: 'active',
            //             loginAt: new Date()
            //         } 
            //     })
            //     return res.status(200).json({
            //         'statusText': 'success',
            //         'status': true,
            //         'message': 'Đổi token đăng nhập momo ' + momoData.phone + ' thành công'
            //     });
            // } else {
            //     return res.status(200).json({
            //         'statusText': 'error',
            //         'status': false,
            //         'message': 'Đổi token đăng nhập momo ' + momoData.phone + ' thất bại'
            //     });
            // }


        } catch (err) {
            console.log(err);
            return res.status(200).json({
                'statusText': 'error',
                'status': false,
                'message': 'Đổi token đăng nhập momo thất bại'
            });
        }
    },

    balance: async(req, res, next) => {
        try {

            let { phone } = req.body;
            let data = await momoModel.findOne({phone});

            if (!data) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Không tìm thấy số ' + phone
                })
            }

            var resultGetBalance = await momoHelper.getBalance(phone);

            if (resultGetBalance.success) {
                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'balance': resultGetBalance.balance,
                    'message': 'Lấy số dư thành công'
                })
            } else {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'balance': resultGetBalance.balance,
                    'message': resultGetBalance.message
                }) 
            }

           

        } catch (err) {
            next(err);
        }
    },

    login: async(req, res, next) => {
        try {
            var { phone } = req.body;

            var momoData = await momoModel.findOne({ phone });

            if (!momoData) {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Số momo không có trong hệ thống.'
                });
            }

            var resultLogin = await momoHelper.loginMsg(phone, momoData.password, momoData.pHash, momoData.modelId, momoData.deviceToken, momoData.setupKey);

            console.log(resultLogin);

            if (resultLogin.accessToken) {
                await momoModel.findByIdAndUpdate(momoData._id, { 
                    $set: 
                    { 
                        AUTH_TOKEN: resultLogin.accessToken, 
                        sessionKey: resultLogin.sessionKey, 
                        agentId: resultLogin.agentId, 
                        requestEncryptKey: resultLogin.requestEncryptKey ,
                        REFRESH_TOKEN: resultLogin.REFRESH_TOKEN,
                        amount: resultLogin.balance,
                        loginStatus: 'active',
                        loginAt: new Date()
                    } 
                })
                return res.status(200).json({
                    'statusText': 'success',
                    'status': true,
                    'message': 'Đăng nhập lại momo ' + momoData.phone + ' thành công'
                });
            } else {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': 'Đăng nhập lại momo ' + momoData.phone + ' thất bại'
                });
            }


        } catch (err) {
            console.log(err);
            return res.status(200).json({
                'statusText': 'error',
                'status': false,
                'message': 'Đăng nhập lại momo thất bại'
            });
        }
    },

}

module.exports = momoController;