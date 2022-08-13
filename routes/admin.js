const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const admins = require('../controllers/admin');

router.get('/', admins.getAll);

router.post('/', admins.addNew);

module.exports = router;