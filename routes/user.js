const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const users = require('../controllers/user');

router.get('/', users.getAll);
router.get('/:id', users.getSingle);

router.post('/', users.addNew);

router.delete('/:id', users.softDelete);
router.delete('/delete/:id', users.delete);

module.exports = router;