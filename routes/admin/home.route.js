const express = require('express');
const moment = require('moment');
const router = express.Router();
const momoRoute = require('../admin/momo.route');
const bankRoute = require('./bank.route');
const logModel = require('../../models/log.model')
const missionRoute = require('./mission.route');
const giftRoute = require('./giftcode.route');
const installController = require('../../controllers/admin/install.controller')
const installRoute = require('./install.route');
const { isAdmin, loggedIn } = require('../../middlewares/auth.middleware');
const authRoute = require('./auth.route');
const settingRoute = require('./setting.route');
const revenueService = require('../../services/revenue.service');
const historyRoute = require('./history.route');
const wheelRoute = require('./wheel.route');
const eventRoute = require('./event.route');
const momoModel = require('../../models/momo.model');
const bankModel = require('../../models/bank.model');

router.use('/momo', momoRoute);
router.use('/bank', loggedIn, bankRoute);
router.use('/mission', loggedIn, missionRoute);
router.use('/giftcode', loggedIn, giftRoute);
router.use('/install', installRoute);
router.use('/setting', loggedIn, settingRoute);
router.use('/history', loggedIn, historyRoute);
router.use('/wheel', loggedIn, wheelRoute);
router.use('/event', loggedIn, eventRoute);

router.use(authRoute);


router.get(['/', '/home', '/dashboard'], loggedIn, async (req, res, next) => {
    try {
        let _phone, gameType;
        let _revenueTime = moment().format('YYYY-MM-DD');
        let typeDate = 'day';

        req.query?._phone && /(((\+|)84)|0)(3|5|7|8|9)+([0-9]{8})\b/.test(req.query._phone) && (_phone = req.query._phone);
        req.query?.gameType && (gameType = req.query.gameType);

        if (req.query?.typeDate) {
            let vaild = ['day', 'month', 'all'];
            vaild.includes(req.query.typeDate) && (typeDate = req.query.typeDate);
        }

        if (req.query?._revenueTime) {
            let regexTime = [
                {
                    type: 'day',
                    regex: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
                    format: 'YYYY-MM-DD'
                }, {
                    type: 'month',
                    regex: /^\d{4}-(0[1-9]|1[0-2])$/,
                    format: 'YYYY-MM'
                },
                {
                    type: 'all',
                    regex: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
                    format: 'YYYY-MM-DD'
                }
            ];

            let dataTime = regexTime.find(e => e.type == typeDate);
            req.query._revenueTime.match(dataTime.regex) && (_revenueTime = moment(req.query._revenueTime).format(dataTime.format))
        }

        let logs = await logModel.find().sort({ createdAt: 'desc' }).limit(30).lean();
        let revenueData = {
            ...await revenueService.revenueBet(_revenueTime, typeDate, _phone, gameType),
            ...await revenueService.revenueMoney(_revenueTime, typeDate, _phone, gameType)
        }

        let filterAmountMomo = [{ $match: { status: 'active' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]
        let filterAmountBank = [{ $match: { status: 'active' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]

        let [amountMomo, amountBank] = await Promise.all([momoModel.aggregate(filterAmountMomo), bankModel.aggregate(filterAmountBank)]);

        amountMomo = amountMomo.length ? amountMomo[0].amount : 0;
        amountBank = amountBank.length ? amountBank[0].amount : 0;

        res.render('admin/home', { title: 'Quản Trị Hệ Thống', revenueData, _revenueTime, typeDate, logs, amountBank, amountMomo })
    } catch (err) {
        next(err);
    }
});

// router.get(['/history/game'], async (req, res, next) => {
//     try {

//         res.render('admin/historyGame', { title: 'Quản Trị Hệ Thống' })
//     } catch (err) {
//         next(err);
//     }
// });

// router.get(['/history/event'], async (req, res, next) => {
//     try {

//         res.render('admin/historyEvent', { title: 'Lịch sử EVENT' })
//     } catch (err) {
//         next(err);
//     }
// });

// router.get(['/history/received'], async (req, res, next) => {
//     try {

//         res.render('admin/historyReceive', { title: 'Lịch sử nhận tiền' })
//     } catch (err) {
//         next(err);
//     }
// });

// router.get(['/history/transfer'], async (req, res, next) => {
//     try {

//         res.render('admin/historyTransfer', { title: 'Lịch sử chuyển tiền' })
//     } catch (err) {
//         next(err);
//     }
// });

router.get(['/setting/game'], async (req, res, next) => {
    try {

        res.render('admin/settingGame', { title: 'Cài đặt trò chơi' })
    } catch (err) {
        next(err);
    }
});
router.get(['/setting/reward'], async (req, res, next) => {
    try {

        res.render('admin/settingReward', { title: 'Cài đặt trả thưởng' })
    } catch (err) {
        next(err);
    }
});


router.get(['/manager/user'], async (req, res, next) => {
    try {

        res.render('admin/userList', { title: 'Thành viên hệ thống' })
    } catch (err) {
        next(err);
    }
});

router.get(['/statics/user'], async (req, res, next) => {
    try {

        res.render('admin/tkUser', { title: 'Thống kê thành viên' })
    } catch (err) {
        next(err);
    }
});



module.exports = router;