const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const modifications = require('../controllers/modification');

router.get('/', verifyToken, modifications.getAll);

module.exports = router;