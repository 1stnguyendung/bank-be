const express = require('express');
const router = express.Router();
const settingController = require('../../controllers/admin/setting.controller');

router.get('/website', settingController.index);
router.post('/website', settingController.update);

module.exports = router;