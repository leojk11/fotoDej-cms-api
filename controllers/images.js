const fs = require('fs');

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

const { ClientLogAction } = require('../enums/clientLogAction');
const { NotificationType } = require('../enums/notificationType');

const { parseJwt } = require('../middlewares/common');

const Jimp = require('jimp');

exports.getImage = async (req, res) => {
    if(req.params.img) {
        const image = req.params.img;
        res.status(statusCodes.success)
            .sendFile('./images/' + image, { root: '.' }, async (error) => {
                if(error) {
                    await Logger.insertMany(generateErrorLogger(null, req, errorMessages.image_not_exist));
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.image_not_exist_tr,
                        actual_message: errorMessages.image_not_exist
                    });
                }
            });
    } else {
        await Logger.insertMany(generateErrorLogger(null, req, errorMessages.provide_image_name));
        res.status(statusCodes.user_error).json({
            message: errorMessages.provide_image_name_tr,
            actual_message: errorMessages.provide_image_name
        });
    }
}

exports.getAlbumImage = async (req, res) => {
    const albumId = req.params.id;

    if(req.params.img) {
        try {
            const image = req.params.img;
            const localPath = `./images/${ albumId }/${ image }`;
            const splittedImage = image.split('.');
            const newPath = `./images/${ albumId }/${ splittedImage[0] }_resize.${ splittedImage[1] }`;
            
            // if (!fs.existsSync(newPath)) {
                // Jimp.read(localPath, async (err, image) => {
                //     if (err) {
                //         await Logger.insertMany(generateErrorLogger(null, req, errorMessages.image_not_exist));
                //         res.status(statusCodes.user_error).json({
                //             message: errorMessages.image_not_exist_tr,
                //             actual_message: errorMessages.image_not_exist
                //         });
                //     } else {
                //         image.resize(300, 300)
                //         .writeAsync(newPath).then(async () => {
                //             await Logger.insertMany(generateSuccessLogger(null, req));
                //             res.sendFile(newPath, { root: '.' });
                //         }).catch(async error => {
                //             await Logger.insertMany(generateErrorLogger(null, req, error));
                //             res.status(statusCodes.server_error).json({
                //                 message: errorMessages.internal_tr,
                //                 actual_message: errorMessages.internal,
                //                 error
                //             });
                //         })
                //     }

                // });
            // } else {
                res.sendFile(localPath, { root: '.' }, async (error) => {
                    if (error) {
                        await Logger.insertMany(generateErrorLogger(null, req, errorMessages.image_not_exist));
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.image_not_exist_tr,
                            actual_message: errorMessages.image_not_exist
                        });
                    }
                });
            // }
        } catch (error) {
            await Logger.insertMany(generateErrorLogger(null, req, error));
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
            });
        }
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

    const imagesPath = './images/';
    const id = req.params.id;
    const dir = `${ imagesPath }/${ id }`;

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
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const file = req.files.images;
                const imageData = {
                    name: file.name,
                    album_id: id,
                    disabled: false
                };

                await Image.insertMany(imageData);
                file.mv(`${ dir }/` + file.name).then();

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

exports.uploadImagesV2 = async (req, res) => {
    const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

    const albumId = req.params.albumId;

    const imagesPath = './images/';

    if (!req.files) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.must_select_image));
        res.status(statusCodes.user_error).json({
            message: errorMessages.must_select_image_tr,
            actual_message: errorMessages.must_select_image
        });
    } else {
        try {
            const file = req.files.images;
            const bufferedImage = Buffer.from(file.data).toString('base64');

            const imageData = {
                name: file.name,
                album_id: albumId,
                disabled: false,
                bufferData: bufferedImage
            };

            await Image.insertMany(imageData);
            file.mv(`${ imagesPath }` + file.name).then();

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

exports.enableImages = async (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const albumId = req.params.id;
    const images = req.body.images;

    if (albumId) {
        if (images) {
            try {
                const countToUpdate = images.length;
                let updatedCount = 0;

                for (const image of images) {
                    await Image.updateOne({ name: image, album_id: albumId }, { disabled: false });
                    updatedCount++;

                    if (updatedCount === countToUpdate) {
                        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                        res.status(statusCodes.success).json({
                            message: successMessages.images_enabled_tr,
                            actual_message: successMessages.images_enabled
                        });
                    }
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

exports.disableImages = async (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const albumId = req.params.id;
    const images = req.body.images;

    if (albumId) {
        if (images) {
            try {
                const countToUpdate = images.length;
                let updatedCount = 0;

                for (const image of images) {
                    await Image.updateOne({ name: image, album_id: albumId }, { disabled: false });
                    updatedCount++;

                    if (updatedCount === countToUpdate) {
                        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                        res.status(statusCodes.success).json({
                            message: successMessages.images_disabled_tr,
                            actual_message: successMessages.images_disabled
                        });
                    }
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

exports.deleteSingleImage = async (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const image = req.params.image;
    const path = `./images/`;

    if (image) {
        try {
            const images = await Image.find({ name: image })
            if (images.length === 0) {
                await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Image', image)));
                res.status(statusCodes.user_error).json({
                    message: errorMessages.image_not_exist_tr,
                    actual_message: errorMessages.not_exist('Image', image)
                });
            } else {
                await Image.deleteOne({ name: image });
                await Logger.insertMany(generateSuccessLogger(loggedInUser, 'before fs.unlinkSync(path + image)'));
                fs.unlinkSync(path + image);
                await Logger.insertMany(generateSuccessLogger(loggedInUser, 'after fs.unlinkSync(path + image)'));
                
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

    const path = `./images/${ albumId }/`;

    if (albumId) {
        if (images) {
            try {
                const countToDelete = images.length;
                let deletedCount = 0;

                for (const image of images) {
                    await Image.deleteOne({ name: image, album_id: albumId });
                    fs.unlinkSync(path + image);
                    deletedCount++;

                    if (deletedCount === countToDelete) {
                        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                        res.status(statusCodes.success).json({
                            message: successMessages.image_deleted_tr,
                            actual_message: successMessages.image_deleted
                        });

                        const albumImages = await Image.find({ album_id: albumId });
                        if (albumImages.length === 0) {
                            fs.rmSync(path, { recursive: true, force: true });
                        }
                    }
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
