const express = require('express');
const router = express.Router();
const gameController = require('../../controllers/client/game.controller');
const { isActive } = require('../../middlewares/system.middleware');

router.post('/list', gameController.list);
router.post('/account', isActive, gameController.account);
router.post('/history', isActive, gameController.history);
router.post('/mission', isActive, gameController.mission);
router.post('/check-mission', isActive, gameController.checkMission);
router.post('/collect-mission', isActive, gameController.collectMission);
router.post('/giftcode', isActive, gameController.giftcode);
router.post('/check-giftcode', isActive, gameController.checkGiftcode);

module.exports = router;