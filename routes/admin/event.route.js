const express = require('express');
const router = express.Router();
const eventController = require('../../controllers/admin/event.controller.js');
const tableSort = require('../../middlewares/sort.middleware');

router.get('/', tableSort, eventController.index);
router.post('/delete', eventController.delete);

module.exports = router;