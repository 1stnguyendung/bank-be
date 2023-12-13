const vcbHelper = require('../../helpers/vietcombank.helper')
const bankModel = require('../../models/bank.model')

const vietcombankController = {
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


}

module.exports = vietcombankController;