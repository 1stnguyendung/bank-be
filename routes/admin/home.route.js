const express = require('express');
const moment = require('moment');
const router = express.Router();
const momoRoute = require('../admin/momo.route');
const bankRoute = require('./bank.route');
const logModel = require('../../models/log.model')
const missionRoute = require('./mission.route');

router.use('/momo', momoRoute);
router.use('/bank', bankRoute);
router.use('/mission', missionRoute);


router.get(['/', '/home', '/dashboard'], async (req, res, next) => {
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

        const urlCurl = process.env.urlAdmin + process.env.adminPath;

        let logs = await logModel.find().sort({ time: 'desc' }).limit(30).lean();
        // let revenueData = {
        //     ...await revenueService.revenueBet(_revenueTime, typeDate, _phone, gameType),
        //     ...await revenueService.revenueMoney(_revenueTime, typeDate, _phone, gameType)
        // }

        res.render('admin/home', { title: 'Quản Trị Hệ Thống', urlCurl })
    } catch (err) {
        next(err);
    }
});

router.get(['/history/game'], async (req, res, next) => {
    try {

        res.render('admin/historyGame', { title: 'Quản Trị Hệ Thống' })
    } catch (err) {
        next(err);
    }
});

router.get(['/history/event'], async (req, res, next) => {
    try {

        res.render('admin/historyEvent', { title: 'Lịch sử EVENT' })
    } catch (err) {
        next(err);
    }
});

router.get(['/history/received'], async (req, res, next) => {
    try {

        res.render('admin/historyReceive', { title: 'Lịch sử nhận tiền' })
    } catch (err) {
        next(err);
    }
});

router.get(['/history/transfer'], async (req, res, next) => {
    try {

        res.render('admin/historyTransfer', { title: 'Lịch sử chuyển tiền' })
    } catch (err) {
        next(err);
    }
});

router.get(['/setting/game'], async (req, res, next) => {
    try {

        res.render('admin/settingGame', { title: 'Cài đặt trò chơi' })
    } catch (err) {
        next(err);
    }
});
router.get(['/event'], async (req, res, next) => {
    try {

        res.render('admin/settingEvent', { title: 'Cài đặt EVENT' })
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
router.get(['/setting/website'], async (req, res, next) => {
    try {

        res.render('admin/settingWebsite', { title: 'Cài đặt chung' })
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