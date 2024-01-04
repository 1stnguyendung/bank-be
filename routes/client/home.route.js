const express = require('express');
const router = express.Router();
const gameRouter = require('../client/game.route');

const settingModel = require('../../models/setting.model');

router.use(async (req, res, next) => {
    res.locals.settings = await settingModel.findOne().lean();
    res.locals.originalUrl = req._parsedUrl;
    res.locals.adminPath = process.env.adminPath;
    // res.locals.baseURL = `${req.protocol}://${req.hostname}`;
    next();
})

router.use('/game', gameRouter);

module.exports = router;