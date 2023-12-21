const express = require('express');
const router = express.Router();
const momoController = require('../../controllers/admin/momo.controller');
const tableSort = require('../../middlewares/sort.middleware');

router.post('/get-otp', momoController.getotp);
router.post('/login', momoController.login);
router.post('/history', momoController.history);
router.post('/delete', momoController.delete);
router.get('/list', momoController.list);
router.post('/transfer', momoController.transfer);
router.get('/', tableSort, momoController.index);

module.exports = router;