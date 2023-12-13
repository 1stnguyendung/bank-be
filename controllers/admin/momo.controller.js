const momoHelper = require('../../helpers/momo.helper')
const momoModel = require('../../models/momo.model')

const momoController = {
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

    login: async(req, res, next) => {
        try {

            var { phone, passowrd, otp } = req.body;

            if (!phone || !passowrd || !otp) {
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
            var resultRegDevice = await momoHelper.regDeviceMsg(phone, passowrd, otp, momo[0].tbid, momo[0].sessionKeyTracking, momo[0].imei, momo[0].rKey, momo[0].modelId, momo[0].deviceToken);

            if (resultRegDevice.name) {
                await momoModel.findByIdAndUpdate(momo[0].id, { $set: { name: resultRegDevice.name, pHash: resultRegDevice.pHash, setupKey: resultRegDevice.setupKey } })
            } else {
                return res.status(200).json({
                    'statusText': 'error',
                    'status': false,
                    'message': resultRegDevice.message
                });
            }

            var resultLogin = await momoHelper.loginMsg(phone, passowrd, resultRegDevice.pHash, momo[0].modelId, momo[0].deviceToken, resultRegDevice.setupKey);

            if (resultLogin.accessToken) {
                await momoModel.findByIdAndUpdate(momo[0].id, { $set: { AUTH_TOKEN: resultLogin.accessToken, sessionKey: resultLogin.sessionKey, agentId: resultLogin.agentId, requestEncryptKey: resultLogin.requestEncryptKey } })
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
    }
}

module.exports = momoController;