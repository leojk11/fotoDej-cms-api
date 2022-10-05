const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const schedules = require('../controllers/schedule');

// router.get('/', verifyToken, modifications.getAll);

module.exports = router;
