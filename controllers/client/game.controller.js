const bankModel = require('../../models/bank.model')
const gameHelper = require('../../helpers/game.helper')
const historyModel = require('../../models/history.model')
const eventHelper = require('../../helpers/event.helper')
const missionModel = require('../../models/mission.model')
const moment = require('moment');
const momoModel = require('../../models/momo.model')
const eventModel = require('../../models/event.model')
const settingModel = require('../../models/setting.model')
const giftModel = require('../../models/gift.model')

const gameController = {
    list: async(req, res, next) => {
        try {
            var game = await gameHelper.game();
            var event = await eventHelper.game();
            res.json({ game: game, event: event})
        } catch (err) {
            next(err);
        }
    },
    account: async(req, res, next) => {
        try {
        
            let data = await bankModel.find({ status: 'active' }).select('accountNumber bankType betMin betMax limitDay limitMonth name').lean();
            
            res.json({
                account: data,
            })


        } catch (err) {
            next(err);
        }
    },
    history: async(req, res, next) => {
        try {
        
            let data = await historyModel.find({ status: 'win' }).select('transId phone amount bonus comment gameType createdAt updatedAt').sort({"_id":-1}).limit(10).lean();
            
            res.json({
                history: data,
            })


        } catch (err) {
            next(err);
        }
    },
    mission: async(req, res, next) => {
        try {
        
            let data = await missionModel.find().select('level amount bonus').sort({"level":"asc"}).lean();
            
            res.json({
                mission: data,
            })


        } catch (err) {
            next(err);
        }
    },
    checkMission: async(req, res, next) => {
        try {
        
            if (!req.body.phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!',
                })
            }

            let phone = req.body.phone;
            let dataDay = await historyModel.aggregate([{ $match: { phone: phone, createdAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() }, $and: [{ $or: [{ status: 'win' }, { status: 'won' }] }] } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]);

            if (!dataDay.length) {
                return res.json({
                    success: false,
                    message: 'Hôm nay bạn chưa chơi mini game trên hệ thống!'
                })
            }

            let infoHistory = await historyModel.findOne({ phone, 'status': 'win', partnerName: { $ne: null } });

            let missionData = await missionModel.find().lean();

            // Kiem tra da co lich su nhan nhiem vu ngay 
            let countMission = await eventModel.aggregate([{ $match: { phone, type: 'mission', createdAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() }, }}, { $group: { _id: null, count: { $sum: 1 } } }]);

            // Tao lich su mission
            // await new eventModel({
            //     phone,
            //     type: 'mission',
            //     amount: dataDay[0].amount,
            //     bonus: missionData[0].amount,
            //     status: 'wait'
            // }).save();

            let countMissionCheck = countMission.length ? countMission[0].count : 0;

            if (missionData.length <= countMissionCheck) {
                return res.json({
                    success: false,
                    message: 'Bạn đã hoàn thành hết nhiệm vụ ngày hôm nay!',
                })
            }


            // Kiem tra dang o level nao
            if (dataDay[0].amount < missionData[countMissionCheck].amount) {
                // Lấy dữ liệu người dùng
                let amountThieu = missionData[countMissionCheck].amount - dataDay[0].amount;
                return res.json({
                    success: true,
                    message: 'Bạn cần chơi thêm ' + Intl.NumberFormat('en-US').format(amountThieu) + ' nữa để đặt mốc ' + Intl.NumberFormat('en-US').format(missionData[countMissionCheck].amount),
                    data: {
                        partnerId: !infoHistory ?  'Khong Xac dinh' : infoHistory.partnerName,
                        min: missionData[countMissionCheck].amount,
                        count: dataDay[0].amount,
                        bonus: missionData[countMissionCheck].bonus,
                    }
                })
            }

            return res.json({
                success: true,
                message: 'Bạn đã hoàn thành nhiệm vụ',
                data: {
                    partnerId: !infoHistory ?  'Khong Xac dinh' : infoHistory.partnerName,
                    min: missionData[countMissionCheck].amount,
                    count: dataDay[0].amount,
                    bonus: missionData[countMissionCheck].bonus,
                }
            })

        } catch (err) {
            next(err);
        }
    },
    collectMission: async(req, res, next) => {
        try {
        
            if (!req.body.phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!',
                })
            }

            if (!req.body.type) {
                return res.json({
                    success: false,
                    message: 'Vui lòng chọn phần thưởng!',
                })
            }

            let phone = req.body.phone;
            let type = req.body.type
            let dataDay = await historyModel.aggregate([{ $match: { phone: phone, createdAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() }, $and: [{ $or: [{ status: 'win' }, { status: 'won' }] }] } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]);

            if (!dataDay.length) {
                return res.json({
                    success: false,
                    message: 'Hôm nay bạn chưa chơi mini game trên hệ thống!'
                })
            }

            let infoHistory = await historyModel.findOne({ phone, 'status': 'win', partnerName: { $ne: null } });

            
            let missionData = await missionModel.find().lean();

            // Kiem tra da co lich su nhan nhiem vu ngay 
            let countMission = await eventModel.aggregate([{ $match: { phone, type: 'mission', createdAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() }, }}, { $group: { _id: null, count: { $sum: 1 } } }]);
            
            let countMissionCheck = countMission.length ? countMission[0].count : 0;

            if (missionData.length <= countMissionCheck) {
                return res.json({
                    success: false,
                    message: 'Bạn đã hoàn thành hết nhiệm vụ ngày hôm nay!',
                })
            }

            // Kiem tra dang o level nao
            if (dataDay[0].amount < missionData[countMissionCheck].amount) {
                // Lấy dữ liệu người dùng
                let amountThieu = missionData[countMissionCheck].amount - dataDay[0].amount;
                return res.json({
                    success: true,
                    message: 'Bạn cần chơi thêm ' + Intl.NumberFormat('en-US').format(amountThieu) + ' nữa để đặt mốc ' + Intl.NumberFormat('en-US').format(missionData[countMissionCheck].amount),
                    data: {
                        partnerId: infoHistory.partnerName ? infoHistory.partnerName : 'Khong Xac dinh',
                        min: missionData[countMissionCheck].amount,
                        count: dataDay[0].amount,
                        bonus: missionData[countMissionCheck].bonus,
                    }
                })
            }

            if (type === 'money') {
                // Tao lich su mission
                await new eventModel({
                    phone,
                    type: 'mission',
                    amount: dataDay[0].amount,
                    bonus: missionData[countMissionCheck].bonus,
                    status: 'wait'
                }).save();

                return res.json({
                    success: false,
                    message: 'Hệ thống đã gửi quà cho bạn! Vui lòng đợi một chút.',
                })
            }

        } catch (err) {
            next(err);
        }
    },
    giftcode: async(req, res, next) => {
        try {

            
            res.json({
                status: true,
            })
            

        } catch (err) {
            next(err);
        }
    },
    checkGiftcode: async(req, res, next) => {
        try {

            if (!req.body.code) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập mã quà tặng!',
                })
            }
        
            if (!req.body.phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!',
                })
            }

            let phone = req.body.phone;
            let dataDay = await historyModel.aggregate([{ $match: { phone: phone, createdAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() }, $and: [{ $or: [{ status: 'win' }, { status: 'won' }] }] } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]);

            if (!dataDay.length) {
                return res.json({
                    success: false,
                    message: 'Hôm nay bạn chưa chơi mini game trên hệ thống!'
                })
            }

            // Kiem tra da dung giftcode chua
            let checkCode = await giftModel.findOne({ code, status: 'active' });

            if (!checkCode) {
                return res.json({
                    success: false,
                    message: 'Mã code đã hết hạn hoặc không hợp lệ!'
                })
            }

            if (checkCode.players.length >= checkCode.limit) {
                await giftModel.findOneAndUpdate({ code }, { $set: { status: 'limit' } });
                return res.json({
                    success: false,
                    message: 'Mã code đã hết lượt sử dụng!'
                })
            }

            let countPlay = await historyModel.aggregate([{ $match: { phone: phone, gameType: { $exists: true, $ne: null } } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]);
            countPlay = countPlay[0].amount || 0;

            if (checkCode.playCount && checkCode.playCount > countPlay) {
                return res.json({
                    success: false,
                    message: `Bạn phải chơi đủ ${Intl.NumberFormat('en-US').format(checkCode.playCount)}đ thì mới đủ điều kiện sử dụng!`
                })
            }

            let timeExpired = Math.abs((moment(checkCode.expiredAt).valueOf() - moment().valueOf()) / 1000).toFixed(0) - Math.abs((moment(checkCode.createdAt).valueOf() - moment().valueOf()) / 1000).toFixed(0);

            if (timeExpired < 1) {
                await giftModel.findOneAndUpdate({ code: code }, { $set: { status: "expired" } });
                return res.json({
                    success: false,
                    message: "Mã code đã hết hạn sử dụng!"
                });
            }

            if (checkCode.players.find(e => e.phone = phone)) {
                return res.json({
                    success: false,
                    message: "Mã code đã được sử dụng!"
                })
            }

            if (req.session.giftCode == code) {
                return res.json({
                    success: false,
                    message: "Hệ thống đang xử lý, vui lòng thử lại sau ít phút!"
                })
            }

            req.session.giftCode = code;

            // Luu qua va tra thuong

            setTimeout(() => req.session.destroy(), 120 * 1000);

            return res.json({
                success: true,
                message: "Nhận quà thành công!"
            })

        } catch (err) {
            next(err);
        }
    },
}

module.exports = gameController;