const express = require('express');
const router = express.Router();
const wheelController = require('../../controllers/admin/wheel.controller');
const tableSort = require('../../middlewares/sort.middleware');

router.get('/', tableSort, wheelController.index);
// router.post('/add', wheelController.add);
// router.post('/update', wheelController.update);
// router.post('/delete', wheelController.delete);

module.exports = router;