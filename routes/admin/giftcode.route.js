const express = require('express');
const router = express.Router();
const giftcodeController = require('../../controllers/admin/giftcode.controller');
const tableSort = require('../../middlewares/sort.middleware');

router.get('/', tableSort, giftcodeController.index);
router.post('/add', giftcodeController.add);
router.post('/delete', giftcodeController.delete);
router.post('/update', giftcodeController.update);

module.exports = router;