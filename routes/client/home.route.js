const express = require('express');
const router = express.Router();
const gameRouter = require('../client/game.route');

router.use('/game', gameRouter);

module.exports = router;