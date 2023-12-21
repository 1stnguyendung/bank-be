const express = require('express');
const router = express.Router();
const giftcodeController = require('../../controllers/admin/giftcode.controller');
const tableSort = require('../../middlewares/sort.middleware');

router.get('/', tableSort, giftcodeController.index);

module.exports = router;