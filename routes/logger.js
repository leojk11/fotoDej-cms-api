const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const logger = require('../controllers/logger');

router.get('/', verifyToken, logger.getAll);

module.exports = router;