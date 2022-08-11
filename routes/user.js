const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const users = require('../controllers/user');

router.get('/', users.getAll);

router.post('/', users.addNew);

module.exports = router;