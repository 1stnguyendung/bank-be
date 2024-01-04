const express = require('express');
const router = express.Router();
const installController = require('../../controllers/admin/install.controller');
const { isInstalled } = require('../../middlewares/system.middleware');

router.get('/', isInstalled, installController.index);
router.post('/users', isInstalled, installController.user);
router.post('/token', isInstalled, installController.token);
router.post('/settings', isInstalled, installController.setting);

module.exports = router;