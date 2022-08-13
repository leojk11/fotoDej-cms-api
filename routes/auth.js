const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const auth = require('../controllers/auth');

router.post('/admin', auth.adminLogin);
router.post('/user', auth.userLogin);

module.exports = router;