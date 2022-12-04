const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const invites = require('../controllers/invite');

router.get('/', verifyToken, invites.getAll);
router.get('/:id', verifyToken, invites.getSingle)

module.exports = router;