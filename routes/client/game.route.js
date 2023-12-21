const express = require('express');
const router = express.Router();
const gameController = require('../../controllers/client/game.controller');

router.post('/list', gameController.list);
router.post('/account', gameController.account);
router.post('/history', gameController.history);

module.exports = router;