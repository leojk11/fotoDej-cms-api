const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const admins = require('../controllers/admin');

router.get('/', verifyToken, admins.getAll);
router.get('/:id', verifyToken, admins.getSingle);

router.post('/', verifyToken, admins.addNew);

router.patch('/:id', verifyToken, admins.edit);

router.delete('/:id', verifyToken, admins.delete);

module.exports = router;