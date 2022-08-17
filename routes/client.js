const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const clients = require('../controllers/client');

router.get('/', clients.getAll);
router.get('/:id', clients.getSingle);

router.post('/', clients.addNew);

router.put('/:id', clients.edit);

router.patch('/recover/:id', clients.recover);

router.delete('/:id', clients.softDelete);
router.delete('/delete/:id', clients.delete);

module.exports = router;