const bankModel = require('../../models/bank.model')
const gameHelper = require('../../helpers/game.helper')
const historyModel = require('../../models/history.model')

const gameController = {

    list: async(req, res, next) => {
        try {
            var game = await gameHelper.game();
            res.json({ game: game})
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
}

module.exports = gameController;