const fs = require('fs');

const Image = require('../db/models/image');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');

const { generateImage } = require('../helpers/generateModels');

exports.getImage = (req, res) => {
    if(req.params.img) {
        const image = req.params.img;
        res.status(statusCodes.success)
            .sendFile('./images/' + image, { root: '.' }, (error) => {
                if(error) {
                    res.status(statusCodes.user_error).json({
                        message: `Image ${ image } has not been found.`
                    })
                }
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: 'Please provide image name.'
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
            .catch(() => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
                });
            })
    } else {
        res.status(statusCodes.user_error).json({
           message: errorMessages.id_missing
        });
    }
}

exports.uploadImagesV2 = (req, res) => {
  if (!req.files) {
    res.status(statusCodes.user_error).json({
      message: 'Please select at least 1 image!'
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
            catch (e) {
                console.log(e);
                return res.send({
                    success: false,
                    message: 'upload error',
                    error: e
                });
            }

            res.status(statusCodes.success).json({ 
                success: true,
                message: 'uploaded successfully' 
            });
        })
        .catch(() => {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal
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
                        message: `${ image } has been deleted.`
                    });
                })
                .catch(() => {
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal
                    });
                })
          } catch (error) {
              res.status(statusCodes.internal).json({
                  message: errorMessages.internal,
                  error
              });
          }
      } else {
          res.status(statusCodes.user_error).json({
             message: errorMessages.please_enter('Image name')
          });
      }
  } else {
      res.status(statusCodes.user_error).json({
          message: errorMessages.id_missing
      });
  }
}
