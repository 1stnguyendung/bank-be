const express = require('express');
const router = express.Router();
const historyController = require('../../controllers/admin/history.controller');
const tableSort = require('../../middlewares/sort.middleware');

router.get('/game', tableSort, historyController.game);
router.post('/game/delete', historyController.deleteGame);
router.get('/transfer', tableSort, historyController.transfer);

module.exports = router;