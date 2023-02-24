const fs = require('fs');

const Image = require('../db/models/image');
const SelectedImages = require('../db/models/selectedImages');
const ClientLog = require('../db/models/clientLog');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { successMessages } = require('../helpers/successMessages');
const { generateTime, generateDate } = require('../helpers/timeDate');
const { generateImage, generateSelectedImages } = require('../helpers/generateModels');

const { ClientLogAction } = require('../enums/clientLogAction');

const { parseJwt } = require('../middlewares/common');

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
    const imageSearch = req.query.image;
    const filters = {};

    if (req.params.id) {
        filters.album_id = req.params.id;

        if (imageSearch) {
            filters.name = { $regex: imageSearch, $options: 'i' };
        }
        Image.find(filters)
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
        album_id: req.params.albumId,
        disabled: false
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

exports.getSelectedImagesForAlbum = (req, res) => {
    const albumId = req.params.id;

    if (albumId) {
        SelectedImages.find({ album_id: albumId })
            .then(selectedImages => {
                const selectedToSend = [];

                for (const selectedImage of selectedImages) {
                    selectedToSend.push(generateSelectedImages(selectedImage));
                }

                res.status(statusCodes.success).send(selectedToSend[0]);
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

exports.selectImages = (req, res) => {

    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const albumId = req.params.id;
    const images = req.body.images;

    if (albumId) {
        if (images) {
            SelectedImages.find({ album_id: albumId })
                .then(selectedImages => {
                    if (selectedImages.length > 0) {
                        SelectedImages.updateOne(
                            { album_id: albumId },
                            { images }
                        )
                        .then(() => {
                            SelectedImages.find({ _id: selectedImages[0]._id })
                                .then(updatedImages => {
                                    const logData = {
                                        action: ClientLogAction.LOGIN,
                                        client_id: loggedInUser.id,
                                        client: loggedInUser,
                                        date: generateDate(),
                                        time: generateTime()
                                    };

                                    ClientLog.insertMany(logData)
                                        .then(() => {
                                            res.status(statusCodes.success).json({
                                                message: successMessages.selected_images_updated_tr,
                                                actual_message: successMessages.selected_images_updated,
                                                selected_images: updatedImages[0]
                                            });
                                        })
                                        .catch(error => {
                                            res.status(statusCodes.server_error).json({
                                                message: errorMessages.internal_tr,
                                                actual_message: errorMessages.internal,
                                                error
                                            });
                                        })
                                })
                                .catch(error => {
                                    res.status(statusCodes.server_error).json({
                                        message: errorMessages.internal_tr,
                                        actual_message: errorMessages.internal,
                                        error
                                    });
                                })

                        })
                        .catch(error => {
                            res.status(statusCodes.server_error).json({
                                message: errorMessages.internal_tr,
                                actual_message: errorMessages.internal,
                                error
                            });
                        })
                    } else {
                        SelectedImages.insertMany({ album_id: albumId, images })
                            .then(() => {
                                res.status(statusCodes.success).json({
                                    message: successMessages.images_selected_tr,
                                    actual_message: successMessages.images_selected
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

exports.enableImages = (req, res) => {
    const albumId = req.params.id;
    const images = req.body.images;

    if (albumId) {
        if (images) {
          try {
            const countToUpdate = images.length;
            let updatedCount = 0;

            for (const image of images) {
                Image.updateOne({ name: image, album_id: albumId }, { disabled: false })
                    .then(() => {
                        updatedCount++;

                        if (updatedCount === countToUpdate) {
                            res.status(statusCodes.success).json({
                                message: successMessages.images_enabled_tr,
                                actual_message: successMessages.images_enabled
                            });
                        }
                    })
                    .catch(error => {
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal_tr,
                            actual_message: errorMessages.internal,
                            error
                        });
                    })
            }
          } catch (error) {
            console.log(error);
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

exports.disableImages = (req, res) => {
    const albumId = req.params.id;
    const images = req.body.images;

    if (albumId) {
        if (images) {
          try {
            const countToUpdate = images.length;
            let updatedCount = 0;

            for (const image of images) {
                Image.updateOne({ name: image, album_id: albumId }, { disabled: true })
                    .then(() => {
                        updatedCount++;

                        if (updatedCount === countToUpdate) {
                            res.status(statusCodes.success).json({
                                message: successMessages.images_disabled_tr,
                                actual_message: successMessages.images_disabled
                            });
                        }
                    })
                    .catch(error => {
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal_tr,
                            actual_message: errorMessages.internal,
                            error
                        });
                    })
            }
          } catch (error) {
            console.log(error);
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

exports.deleteMultiple = (req, res) => {
    const path = './images/';

    const albumId = req.params.id;
    const images = req.body.images;

    if (albumId) {
        if (images) {
          try {
            const countToDelete = images.length;
            let deletedCount = 0;

            for (const image of images) {
                Image.deleteOne({ name: image, album_id: albumId })
                    .then(() => {
                        fs.unlinkSync(path + image);
                        deletedCount++;

                        if (deletedCount === countToDelete) {
                            res.status(statusCodes.success).json({
                                message: successMessages.image_deleted_tr,
                                actual_message: successMessages.image_deleted
                            });
                        }
                    })
                    .catch(error => {
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal_tr,
                            actual_message: errorMessages.internal,
                            error
                        });
                    })
            }
          } catch (error) {
            console.log(error);
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
