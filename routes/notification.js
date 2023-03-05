const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const notifications = require('../controllers/notification');

router.get('/',  notifications.getAll);
// verifyToken,
module.exports = router;