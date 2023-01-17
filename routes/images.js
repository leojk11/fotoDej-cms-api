const express = require('express');
const router = express.Router();

// const middlewares = require('../middlewares/common');
// currently left unprotected

const images = require('../controllers/images');

router.get('/:img', images.getImage);
router.get('/album/:id', images.getImagesForAlbum);
router.get('/album/:id/selected', images.getSelectedImagesForAlbum);

router.post('/:albumId', images.uploadImagesV2);
router.post('/album/:id/select', images.selectImages);

router.patch('/:id/disable', images.disableImages);

router.delete('/:id/images', images.deleteMultiple);
router.delete('/:id/:image', images.delete);

module.exports = router;
