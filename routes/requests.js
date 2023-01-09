const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const requests = require('../controllers/request');

router.get('/', verifyToken, requests.getAll);
router.get('/:id', verifyToken, requests.getSingle);

router.post('/', requests.addNew);

module.exports = router;
