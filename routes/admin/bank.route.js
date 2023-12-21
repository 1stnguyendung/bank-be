const express = require('express');
const router = express.Router();
const bankController = require('../../controllers/admin/bank.controller');
const tableSort = require('../../middlewares/sort.middleware');

router.post('/get-otp', bankController.getotp);
router.post('/import-otp', bankController.verify);
router.post('/history', bankController.history);
router.get('/', tableSort, bankController.index);
router.post('/add', tableSort, bankController.add);
router.post('/delete', tableSort, bankController.delete);
router.post('/balance', tableSort, bankController.balance);

module.exports = router;