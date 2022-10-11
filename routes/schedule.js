const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const schedules = require('../controllers/schedule');

router.get('/', verifyToken, schedules.getAll);
router.get('/:id', verifyToken, schedules.getSingle);

router.get('/for/user', verifyToken, schedules.getForUser);

router.post('/', verifyToken, schedules.addNew);

router.patch('/:id', verifyToken, schedules.edit);

router.delete('/:id', verifyToken, schedules.delete);

module.exports = router;
