const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const organizations = require('../controllers/organization');

router.get('/', verifyToken, organizations.getAll);
router.get('/:id', verifyToken, organizations.getSingle);

module.exports = router;