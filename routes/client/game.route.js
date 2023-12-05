const express = require('express');
const router = express.Router();
const gameController = require('../../controllers/client/game.controller');

router.post('/list', gameController.list);

module.exports = router;