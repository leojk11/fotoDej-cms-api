const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const notifications = require('../controllers/notification');

router.get('/', verifyToken, notifications.getAll);

router.patch('/read/:id', verifyToken, notifications.markAsRead);

module.exports = router;