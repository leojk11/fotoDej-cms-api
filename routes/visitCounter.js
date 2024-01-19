const express = require('express');
const router = express.Router();

const visitCounters = require('../controllers/visitCounter');

router.get('/', visitCounters.getAll);

router.post('/', visitCounters.addCounter);

module.exports = router;