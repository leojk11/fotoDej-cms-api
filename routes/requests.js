const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const requests = require('../controllers/request');

router.get('/', verifyToken, requests.getAll);
router.get('/pending', verifyToken, requests.getPending);
router.get('/:id', verifyToken, requests.getSingle);

router.post('/', requests.addNew);

router.patch('/:id/contacted', verifyToken, requests.markAsContacted);

module.exports = router;
