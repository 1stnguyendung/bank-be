const express = require('express');
const router = express.Router();
const missionController = require('../../controllers/admin/mission.controller');
const tableSort = require('../../middlewares/sort.middleware');

router.get('/', tableSort, missionController.index);

module.exports = router;