const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const clients = require('../controllers/client');

router.get('/', clients.getAll);

router.post('/', clients.addNew);

module.exports = router;