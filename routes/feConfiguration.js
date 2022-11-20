const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const configuration = require('../controllers/feConfiguration');

router.get('/', configuration.get);

router.post('/', verifyToken, configuration.add);

router.patch('/', verifyToken, configuration.edit);
router.patch('/images/promo', verifyToken, configuration.addPromoImages);

router.delete('/', verifyToken, configuration.delete);

module.exports = router;