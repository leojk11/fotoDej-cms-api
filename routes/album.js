const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const albums = require('../controllers/album');


module.exports = router;