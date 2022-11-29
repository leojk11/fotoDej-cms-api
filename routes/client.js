const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const clients = require('../controllers/client');

router.get('/', verifyToken, clients.getAll);
router.get('/deleted', verifyToken, clients.getSoftDeletedClients);
router.get('/:id', verifyToken, clients.getSingle);

router.post('/', verifyToken, clients.addNew);
router.post('/:id', verifyToken, clients.invite);

router.put('/:id', verifyToken, clients.edit);

router.patch('/recover/:id', verifyToken, clients.recover);
router.patch('/reset/first_password/:id', clients.resetFirstPassword);

router.delete('/:id', verifyToken, clients.softDelete);
router.delete('/delete/:id', verifyToken, clients.delete);

module.exports = router;