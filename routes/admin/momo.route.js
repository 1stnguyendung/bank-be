const express = require('express');
const router = express.Router();
const momoController = require('../../controllers/admin/momo.controller');

router.post('/get-otp', momoController.getotp);
router.post('/login', momoController.login);
router.post('/history', momoController.history);

module.exports = router;