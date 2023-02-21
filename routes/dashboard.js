const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const dashboard = require('../controllers/dashboard');

router.get('/', verifyToken, dashboard.getDashboard);

module.exports = router;