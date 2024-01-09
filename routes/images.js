const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/common');

const images = require('../controllers/images');

router.get('/:img', images.getImage);
router.get('/album_image/:id/:img', images.getAlbumImage);
router.get('/album/:id', images.getImagesForAlbum);
router.get('/album/:id/selected', images.getSelectedImagesForAlbum);
router.get('/base64/:image', images.getImageBase64);

router.post('/:albumId', images.uploadImagesV2);
router.post('/album/:id', verifyToken, images.uploadImagesForAlbum);
router.post('/album/:id/select', images.selectImages);

router.patch('/:id/disable', images.disableImages);
router.patch('/:id/enable', images.enableImages);

router.delete('/:image', images.deleteSingleImage);
router.delete('/:id/images', images.deleteMultiple);

module.exports = router;
