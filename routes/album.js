const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const albums = require('../controllers/album');

router.get('/', verifyToken, albums.getAll);
router.get('/deleted', verifyToken, albums.getAllSoftDeleted);
router.get('/assinged/:id', verifyToken, albums.getAllAssignedTo);
router.get('/assigned_by/:id', verifyToken, albums.getAllAssignedBy);
router.get('/created_by/:id', verifyToken, albums.getAllCreatedBy);
router.get('/:id', verifyToken, albums.getSingle);

router.post('/', verifyToken, albums.addNew);

router.patch('/:id', verifyToken, albums.edit);
router.patch('/:id/:status', verifyToken, albums.statusChange);

router.patch('/:id/images', verifyToken, albums.images);
router.patch('/:id/selected_images', verifyToken, albums.selectedImages);
router.patch('/:id/assign', verifyToken, albums.assignUser);

router.delete('/:id', verifyToken, albums.delete);

module.exports = router;
