const FeConfiguration = require('../db/models/feConfiguration');
const Image = require('../db/models/image');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { generateConf } = require('../helpers/generateModels');

exports.get = (req, res) => {
    FeConfiguration.find()
        .then(configuration => {
            res.status(statusCodes.success).send(generateConf(configuration[0]));
        })
        .catch(error => {
            console.log(error);
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal
            });
        })
}

exports.add = (req, res) => {
    const data = { ...req.body };

    if(data.logo === '' || !data.logo) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Logo')
        });
    } else if(data.main_image === '' || !data.main_image) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Main image')
        });
    } else if(data.main_title === '' || !data.main_title) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Main title')
        });
    } else if(data.second_title === '' || !data.second_title) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Second title')
        });
    } else if(data.contact_form_label === '' || !data.contact_form_label) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Contact form label')
        });
    } else if(data.phone_number === '' || !data.phone_number) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Phone number')
        });
    } else if(data.email === '' || !data.email) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Email')
        });
    } else if(data.address === '' || !data.address) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Address')
        });
    } else {
        FeConfiguration.insertMany(data)
            .then(addResponse => {
                res.status(statusCodes.success).json({
                    message: 'New configuration has been added.',
                    configuration: addResponse[0]
                });
            })
            .catch(error => {
                console.log(error);
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
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
                        message: 'Configuration has been updated.',
                        configuration: conf
                    });
                })
            } else {
                res.status(statusCodes.user_error).json({
                    message: 'Configuration is not preset yet.'
                });
            }
        })
        .catch(error => {
            console.log(error);
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal
            });
        })
}

exports.addPromoImages = (req, res) => {
    const images = req.body.images;
    console.log('images', images);

    if (images.length > 6) {
        res.status(statusCodes.user_error).json({
            message: 'You cannot select more then 6 images.'
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

                const toUpdate = {
                    promo_images: exImages
                };

                FeConfiguration.updateOne(
                    { _id: conf[0]._id },
                    { ...toUpdate }
                )
                .then(() => {
                    res.status(200).json({
                        message: 'Promo images have been updated!'
                    });
                })
                .catch(error => {
                    console.log(error);
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal
                    });
                })
            })
            .catch(error => {
                console.log(error);
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
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
                    exImages = exImages.splice(chosenImageIndex, 1);

                    const toUpdate = {
                        promo_images: exImages
                    };

                    FeConfiguration.updateOne(
                        { _id: conf[0]._id },
                        { ...toUpdate }
                    )
                    .then(() => {
                        // add feature to delete from folder
                        res.status(statusCodes.success).json({
                            message: 'Images has been deleted.'
                        });
                    })
                    .catch(error => {
                        console.log(error);
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal
                        });
                    })
                } else {
                    res.status(400).json({
                        message: `Image ${ image } does not exist!`
                    });
                }
            })
            .catch(error => {
                console.log(error);
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
                });
            })
    } else {
        res.status(400).json({
            message: 'You must select an image!'
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