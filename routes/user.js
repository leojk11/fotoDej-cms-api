const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const users = require('../controllers/user');

router.get('/', verifyToken, users.getAll);
router.get('/:id', verifyToken,users.getSingle);

router.post('/', verifyToken, users.addNew);

router.put('/:id', verifyToken, users.edit);

router.patch('/recover/:id', verifyToken, users.recover);

router.delete('/:id', verifyToken, users.softDelete);
router.delete('/delete/:id', verifyToken, users.delete);

module.exports = router;