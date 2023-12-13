const express = require('express');
const router = express.Router();
const momoRoute = require('../admin/momo.route');
const vcbRoute = require('../admin/vietcombank.route');

router.use('/momo', momoRoute);
router.use('/vcb', vcbRoute);

module.exports = router;