const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const schedules = require('../controllers/schedule');

router.get('/', verifyToken, schedules.getAll);
router.get('/:id', verifyToken, schedules.getSingle);

router.get('/user/:id', verifyToken, schedules.getForUser);

router.post('/', verifyToken, schedules.addNew);

router.patch('/:id', verifyToken, schedules.edit);

module.exports = router;
