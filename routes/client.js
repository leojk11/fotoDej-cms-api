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

router.patch('/profile_image/change/:id', verifyToken, clients.changeProfileImage);
router.patch('/recover/:id', verifyToken, clients.recover);
router.patch('/account_status/:id/:status', verifyToken, clients.changeAccoutStatus);

router.patch('/reset/first_password/:id', clients.resetFirstPassword); // reset password on login

router.delete('/:id', verifyToken, clients.softDelete);
router.delete('/delete/:id', verifyToken, clients.delete);

module.exports = router;