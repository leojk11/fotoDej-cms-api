const express = require('express');
const router = express.Router();

// const middlewares = require('../middlewares/common');
// currently left unprotected

const images = require('../controllers/images');

router.get('/:img', images.getImage);

router.post('/:albumId', images.uploadImagesV2);

router.delete('/', images.delete);

module.exports = router;
