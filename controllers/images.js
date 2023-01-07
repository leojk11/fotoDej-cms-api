const fs = require('fs');

const Image = require('../db/models/image');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { successMessages } = require('../helpers/successMessages');

const { generateImage } = require('../helpers/generateModels');

exports.getImage = (req, res) => {
    if(req.params.img) {
        const image = req.params.img;
        res.status(statusCodes.success)
            .sendFile('./images/' + image, { root: '.' }, (error) => {
                if(error) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.image_not_exist_tr,
                        actual_message: errorMessages.image_not_exist
                    });
                }
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.provide_image_name_tr,
            actual_message: errorMessages.provide_image_name
        });
    }
}

exports.getImagesForAlbum = (req, res) => {
    if (req.params.id) {
        Image.find({ album_id: req.params.id })
            .then(images => {
                const imagesToSend = [];

                for(const image of images) {
                    imagesToSend.push(generateImage(image))
                }

                res.status(statusCodes.success).json({
                    images: imagesToSend,
                    imagesCount: images.length
                });
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal_tr,
                    actual_message: errorMessages.internal,
                    error
                });
            })
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.uploadImagesV2 = (req, res) => {
  if (!req.files) {
    res.status(statusCodes.user_error).json({
        message: errorMessages.must_select_image_tr,
        actual_message: errorMessages.must_select_image
    });
  } else {
    const file = req.files.images;

    const imageData = {
        name: file.name,
        album_id: req.params.albumId
    };

    Image.insertMany(imageData)
        .then(() => {
            try {
                file.mv('./images/' + file.name).then();
            }
            catch (error) {
                return res.send({
                    success: false,
                    message: errorMessages.upload_error_tr,
                    actual_message: errorMessages.upload_error,
                    error
                });
            }

            res.status(statusCodes.success).json({ 
                message: successMessages.upload_success_tr,
                actual_message: successMessages.upload_success
            });
        })
        .catch(error => {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
            });
        })
  }
}

exports.delete = (req, res) => {
  const path = './images/';

  const albumId = req.params.id;
  const image = req.params.image;

  if (albumId) {
      if (image) {
        try {
            Image.deleteOne({ name: image, album_id: albumId })
                .then(() => {
                    fs.unlinkSync(path + image);

                    res.status(statusCodes.success).json({
                        message: successMessages.image_deleted_tr,
                        actual_message: successMessages.image_deleted
                    });
                })
                .catch(error => {
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal_tr,
                        actual_message: errorMessages.internal,
                        error
                    });
                })
        } catch (error) {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
            });
        }
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.enter_image_name_tr,
            actual_message: errorMessages.please_enter('image name')
        });
    }
  } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
  }
}
