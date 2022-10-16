const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const videos = require('../controllers/videos');

router.get('/:video', videos.get);

router.post('/', videos.upload);

module.exports = router;
