const path = require('path');
const { pipeline } = require('stream/promises');

const Image = require('../db/models/image');
const SelectedImages = require('../db/models/selectedImages');
const ClientLog = require('../db/models/clientLog');
const Album = require('../db/models/album');
const Logger = require('../db/models/logger');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { successMessages } = require('../helpers/successMessages');
const { generateTime, generateDate } = require('../helpers/timeDate');
const { generateImage, generateSelectedImages } = require('../helpers/generateModels');
const { insertNotificaton } = require('../helpers/notificationTools');
const { generateSuccessLogger, generateErrorLogger } = require('../helpers/logger');
const {
  generalKey,
  albumKey,
  putObject,
  getObject,
  deleteObject,
  deleteObjects,
  isNotFound,
  isNotModified
} = require('../helpers/storage');

const { ClientLogAction } = require('../enums/clientLogAction');
const { NotificationType } = require('../enums/notificationType');

const { parseJwt } = require('../middlewares/common');

// express-fileupload gives a single object for one file and an array for several
const getUploadedFiles = (req) => req.files && req.files.images ? [].concat(req.files.images) : [];

// streams a file from R2 to the client
const streamImage = async (req, res, key) => {
  try {
    const object = await getObject(key, req.headers['if-none-match']);

    res.status(statusCodes.success).set({
      'Content-Type': object.ContentType || 'application/octet-stream',
      'Content-Length': object.ContentLength,
      'ETag': object.ETag,
      'Cache-Control': 'public, max-age=3600'
    });
    await pipeline(object.Body, res);
  } catch (error) {
    // the stream broke after we started answering, nothing else can be sent
    if (res.headersSent) {
      return;
    }

    if (isNotModified(error)) {
      res.status(304).end();
    } else if (isNotFound(error)) {
      await Logger.insertMany(generateErrorLogger(null, req, errorMessages.image_not_exist));
      res.status(statusCodes.user_error).json({
        message: errorMessages.image_not_exist_tr,
        actual_message: errorMessages.image_not_exist
      });
    } else {
      await Logger.insertMany(generateErrorLogger(null, req, error));
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error
      });
    }
  }
}

exports.getImage = async (req, res) => {
  if (req.params.img) {
    await streamImage(req, res, generalKey(req.params.img));
  } else {
    await Logger.insertMany(generateErrorLogger(null, req, errorMessages.provide_image_name));
    res.status(statusCodes.user_error).json({
      message: errorMessages.provide_image_name_tr,
      actual_message: errorMessages.provide_image_name
    });
  }
}

exports.getAlbumImage = async (req, res) => {
  if (req.params.img) {
    await streamImage(req, res, albumKey(req.params.id, req.params.img));
  } else {
    await Logger.insertMany(generateErrorLogger(null, req, errorMessages.provide_image_name));
    res.status(statusCodes.user_error).json({
      message: errorMessages.provide_image_name_tr,
      actual_message: errorMessages.provide_image_name
    });
  }
}

exports.getImagesForAlbum = async (req, res) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const imageSearch = req.query.image;

  const filters = {};

  if (req.params.id) {
    filters.album_id = req.params.id;

    if (imageSearch) {
      filters.name = { $regex: imageSearch, $options: 'i' };
    }

    try {
      const images = await Image.find(filters);

      await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
      res.status(statusCodes.success).json({
        images: images.map(image => generateImage(image)),
        imagesCount: images.length
      });
    } catch (error) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error
      });
    }
  } else {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}

exports.uploadImagesForAlbum = async (req, res) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const id = req.params.id;

  if (id) {
    try {
      const albums = await Album.find({ _id: id });
      if (albums.length === 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Album', id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.album_not_exist_tr,
          actual_message: errorMessages.not_exist('Album', id)
        });
      } else {
        const files = getUploadedFiles(req);
        if (files.length === 0) {
          await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.must_select_image));
          res.status(statusCodes.user_error).json({
            message: errorMessages.must_select_image_tr,
            actual_message: errorMessages.must_select_image
          });
          return;
        }

        for (const file of files) {
          const name = path.basename(file.name);
          const key = albumKey(id, name);

          await putObject(key, file.data, file.mimetype);
          // uploading the same name again replaces the file, so keep a single record
          await Image.updateOne(
            { name, album_id: id },
            { name, album_id: id, key, disabled: false },
            { upsert: true }
          );
        }

        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).json({
          message: successMessages.upload_success_tr,
          actual_message: successMessages.upload_success
        });
      }
    } catch (error) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error
      });
    }
  } else {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}

// uploads images that are served by name only (logo, main image, promo images, ...)
exports.uploadImagesV2 = async (req, res) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const albumId = req.params.albumId;

  const files = getUploadedFiles(req);

  if (files.length === 0) {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.must_select_image));
    res.status(statusCodes.user_error).json({
      message: errorMessages.must_select_image_tr,
      actual_message: errorMessages.must_select_image
    });
  } else {
    try {
      for (const file of files) {
        const name = path.basename(file.name);
        const key = generalKey(name);

        await putObject(key, file.data, file.mimetype);
        await Image.updateOne(
          { name, album_id: albumId },
          { name, album_id: albumId, key, disabled: false },
          { upsert: true }
        );
      }

      await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
      res.status(statusCodes.success).json({
        message: successMessages.upload_success_tr,
        actual_message: successMessages.upload_success
      });
    } catch (error) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error
      });
    }
  }
}

exports.getSelectedImagesForAlbum = async (req, res) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const albumId = req.params.id;

  if (albumId) {
    try {
      const selectedImages = await SelectedImages.find({ album_id: albumId });

      await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
      res.status(statusCodes.success).send(selectedImages.map(image => generateSelectedImages(image))[0]);
    } catch (error) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error
      });
    }
  } else {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}

exports.selectImages = async (req, res) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const albumId = req.params.id;
  const images = req.body.images;

  if (albumId) {
    if (images) {
      try {
        const selectedImages = await SelectedImages.find({ album_id: albumId });
        if (selectedImages.length === 0) {
          await SelectedImages.insertMany({ album_id: albumId, images });

          await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
          res.status(statusCodes.success).json({
            message: successMessages.images_selected_tr,
            actual_message: successMessages.images_selected
          });
        } else {
          await SelectedImages.updateOne(
            { album_id: albumId },
            { images }
          );
          const updatedSelectedImages = SelectedImages.find({ album_id: albumId });

          const logData = {
            action: ClientLogAction.LOGIN,
            client_id: loggedInUser.id,
            client: loggedInUser,
            date: generateDate(),
            time: generateTime()
          };
          await ClientLog.insertMany(logData);
          await insertNotificaton(
            NotificationType.SELECTED_IMAGES,
            loggedInUser,
            new Date(),
            null,
            albumId
          );

          await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
          res.status(statusCodes.success).json({
            message: successMessages.selected_images_updated_tr,
            actual_message: successMessages.selected_images_updated,
            selected_images: updatedSelectedImages[0]
          });
        }
      } catch (error) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error
        });
      }
    } else {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.please_enter('image name')));
      res.status(statusCodes.user_error).json({
        message: errorMessages.enter_image_name_tr,
        actual_message: errorMessages.please_enter('image name')
      });
    }
  } else {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}

const setImagesDisabled = async (req, res, disabled) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const albumId = req.params.id;
  const images = req.body.images;

  if (albumId) {
    if (images) {
      try {
        await Image.updateMany({ name: { $in: images }, album_id: albumId }, { disabled });

        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).json({
          message: disabled ? successMessages.images_disabled_tr : successMessages.images_enabled_tr,
          actual_message: disabled ? successMessages.images_disabled : successMessages.images_enabled
        });
      } catch (error) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error
        });
      }
    } else {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.please_enter('image name')));
      res.status(statusCodes.user_error).json({
        message: errorMessages.enter_image_name_tr,
        actual_message: errorMessages.please_enter('image name')
      });
    }
  } else {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}

exports.enableImages = (req, res) => setImagesDisabled(req, res, false);

exports.disableImages = (req, res) => setImagesDisabled(req, res, true);

exports.deleteSingleImage = async (req, res) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const name = req.params.image;

  if (name) {
    try {
      const image = await Image.find({ name: name });
      
      if (!image) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Image', name)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.image_not_exist_tr,
          actual_message: errorMessages.not_exist('Image', name)
        });
      } else {
        await deleteObject(image.key || generalKey(image.name));
        await Image.deleteOne({ _id: image._id });

        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).json({
          message: successMessages.image_deleted_tr,
          actual_message: successMessages.image_deleted
        });
      }
    } catch (error) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error
      });
    }
  } else {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}

exports.deleteMultiple = async (req, res) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const albumId = req.params.id;
  const images = req.body.images;

  if (albumId) {
    if (images) {
      try {
        const docs = await Image.find({ album_id: albumId, name: { $in: images } });

        await deleteObjects(docs.map(doc => doc.key || albumKey(albumId, doc.name)));
        await Image.deleteMany({ _id: { $in: docs.map(doc => doc._id) } });

        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).json({
          message: successMessages.image_deleted_tr,
          actual_message: successMessages.image_deleted
        });
      } catch (error) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error
        });
      }
    } else {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.please_enter('image name')));
      res.status(statusCodes.user_error).json({
        message: errorMessages.enter_image_name_tr,
        actual_message: errorMessages.please_enter('image name')
      });
    }
  } else {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}
