const express = require('express');
const router = express.Router();
const vcbController = require('../../controllers/admin/vietcombank.controller');

router.post('/get-otp', vcbController.getotp);
router.post('/import-otp', vcbController.verify);
router.post('/history', vcbController.history);

module.exports = router;