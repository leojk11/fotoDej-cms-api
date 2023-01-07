const fs = require('fs');

const FeConfiguration = require('../db/models/feConfiguration');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { generateConf } = require('../helpers/generateModels');
const { successMessages } = require('../helpers/successMessages');

exports.get = (req, res) => {
    FeConfiguration.find()
        .then(configuration => {
            res.status(statusCodes.success).send(generateConf(configuration[0]));
        })
        .catch(error => {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
            });
        })
}

exports.add = (req, res) => {
    const data = { ...req.body };

    if(data.logo === '' || !data.logo) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.logo,
            actual_message: errorMessages.required_field('Logo')
        });
    } else if(data.main_image === '' || !data.main_image) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.main_image,
            actual_message: errorMessages.required_field('Main image')
        });
    } else if(data.main_title === '' || !data.main_title) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.main_title,
            actual_message: errorMessages.required_field('Main title')
        });
    } else if(data.second_title === '' || !data.second_title) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.second_title,
            actual_message: errorMessages.required_field('Second title')
        });
    } else if(data.contact_form_label === '' || !data.contact_form_label) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.contact_form_label,
            actual_message: errorMessages.required_field('Contact form label')
        });
    } else if(data.phone_number === '' || !data.phone_number) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.phone_number,
            actual_message: errorMessages.required_field('Phone number')
        });
    } else if(data.email === '' || !data.email) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.email,
            actual_message: errorMessages.required_field('Email')
        });
    } else if(data.address === '' || !data.address) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.address,
            actual_message: errorMessages.required_field('Address')
        });
    } else {
        FeConfiguration.insertMany(data)
            .then(addResponse => {
                res.status(statusCodes.success).json({
                    message: successMessages.configuration_created_tr,
                    actual_message: successMessages.configuration_created,
                    configuration: addResponse[0]
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

exports.edit = (req, res) => {
    const data = { ...req.body };

    FeConfiguration.find()
        .then(configuration => {
            if(configuration.length > 0) {
                FeConfiguration.updateOne(
                    { _id: configuration[0]._id },
                    { ...data }
                )
                .then(() => {
                    const conf = {
                        ...configuration[0]._doc,
                        ...data
                    };

                    res.status(statusCodes.success).json({
                        message: successMessages.configuration_updated_tr,
                        actual_message: successMessages.configuration_updated,
                        configuration: conf
                    });
                })
            } else {
                res.status(statusCodes.user_error).json({
                    message: errorMessages.configuration_not_present_tr,
                    actual_message: errorMessages.configuration_not_present
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

exports.addPromoImages = (req, res) => {
    const images = req.body.images;

    if (images.length > 6) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.max_images_tr,
            actual_message: errorMessages.max_images
        });
    } else {
        FeConfiguration.find()
            .then(conf => {
                let exImages = JSON.parse(conf[0].promo_images);

                if (exImages.length > 0) {
                    exImages.splice(exImages.length - images.length, images.length);
                } else {
                    exImages = images;
                }

                const toUpdate = { promo_images: JSON.stringify(exImages) };

                FeConfiguration.updateOne(
                    { _id: conf[0]._id },
                    { ...toUpdate }
                )
                .then(() => {
                    res.status(statusCodes.success).json({
                        message: successMessages.promo_images_updated_tr,
                        actual_message: successMessages.promo_images_updated
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
    }
}

exports.deletePromoImage = (req, res) => {
    const image = req.params.image;

    if (image) {
        FeConfiguration.find()
            .then(conf => {
                let exImages = JSON.parse(conf[0].promo_images);
                const chosenImageIndex = exImages.findIndex(img => img === image);

                if (chosenImageIndex >= 0) {
                    exImages.splice(chosenImageIndex, 1);

                    const toUpdate = {
                        promo_images: JSON.stringify(exImages)
                    };

                    FeConfiguration.updateOne(
                        { _id: conf[0]._id },
                        { ...toUpdate }
                    )
                    .then(() => {
                        const path = './images/';

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
                } else {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.image_not_exist_tr,
                        actual_message: errorMessages.image_not_exist
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
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.must_select_image_tr,
            actual_message: errorMessages.must_select_image
        });
    }
}

exports.addPromoVideo = (req, res) => {

}

exports.addMultipleAddresses = (req, res) => {

}

exports.addMultiplePhoneNumbers = (req, res) => {

}

exports.delete = (req, res) => {

}