const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const clientLogs = require('../controllers/clientLog');

router.get('/', verifyToken, clientLogs.getAll);
router.get('/client/:id', verifyToken, clientLogs.getForClient);
router.get('/client/latest/:id', verifyToken, clientLogs.getRecentForClient);

router.post('/', verifyToken, clientLogs.insetInternalTests);

module.exports = router;