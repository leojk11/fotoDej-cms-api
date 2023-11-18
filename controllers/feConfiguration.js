const fs = require('fs');

const FeConfiguration = require('../db/models/feConfiguration');
const Logger = require('../db/models/logger');
const Image = require('../db/models/image');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { generateConf } = require('../helpers/generateModels');
const { successMessages } = require('../helpers/successMessages');
const { generateSuccessLogger, generateErrorLogger } = require('../helpers/logger');

const { parseJwt } = require('../middlewares/common');

exports.get = async(req, res) => {
    try {
        const configuration = await FeConfiguration.find();

        await Logger.insertMany(generateSuccessLogger(null, req));
        res.status(statusCodes.success).send(generateConf(configuration[0]));
    } catch (error) {
        await Logger.insertMany(generateErrorLogger(null, req, error));
        res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error
        });
    }
}

exports.add = async(req, res) => {
    const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

    const data = { ...req.body };

    if(data.logo === '' || !data.logo) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('Logo')));
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.logo,
            actual_message: errorMessages.required_field('Logo')
        });
    } else if(data.main_image === '' || !data.main_image) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('Main image')));
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.main_image,
            actual_message: errorMessages.required_field('Main image')
        });
    } else if(data.main_title === '' || !data.main_title) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('Main title')));
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.main_title,
            actual_message: errorMessages.required_field('Main title')
        });
    } else if(data.second_title === '' || !data.second_title) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('Second title')));
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.second_title,
            actual_message: errorMessages.required_field('Second title')
        });
    } else if(data.contact_form_label === '' || !data.contact_form_label) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('Contact form label')));
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.contact_form_label,
            actual_message: errorMessages.required_field('Contact form label')
        });
    } else if(data.phone_number === '' || !data.phone_number) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('Phone number')));
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.phone_number,
            actual_message: errorMessages.required_field('Phone number')
        });
    } else if(data.email === '' || !data.email) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('Email')));
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.email,
            actual_message: errorMessages.required_field('Email')
        });
    } else if(data.address === '' || !data.address) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('Address')));
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.address,
            actual_message: errorMessages.required_field('Address')
        });
    } else {
        try {
            const addedConfiguration = await FeConfiguration.insertMany(data);

            await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
            res.status(statusCodes.success).json({
                message: successMessages.configuration_created_tr,
                actual_message: successMessages.configuration_created,
                configuration: addedConfiguration[0]
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

exports.edit = async(req, res) => {
    const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

    const data = { ...req.body };

    try {
        const configuration = await FeConfiguration.find();
        if (configuration.length === 0) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.configuration_not_present));
            res.status(statusCodes.user_error).json({
                message: errorMessages.configuration_not_present_tr,
                actual_message: errorMessages.configuration_not_present
            });
        } else {
            await FeConfiguration.updateOne({ _id: configuration[0]._id }, { ...data });
            const updatedConfiguration = await FeConfiguration.findById(configuration[0]._id);

            await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
            res.status(statusCodes.success).json({
                message: successMessages.configuration_updated_tr,
                actual_message: successMessages.configuration_updated,
                configuration: generateConf(updatedConfiguration)
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
}

exports.addPromoImages = async(req, res) => {
    const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

    const images = req.body.images;

    try {
        const configuration = await FeConfiguration.find();
        if (configuration.length === 0) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.configuration_not_present));
            res.status(statusCodes.user_error).json({
                message: errorMessages.configuration_not_present_tr,
                actual_message: errorMessages.configuration_not_present
            });
        } else {
            let exImages = JSON.parse(configuration[0].promo_images);

            if (exImages.length > 0) {
                exImages.splice(exImages.length - images.length, images.length);
            } else {
                exImages = images;
            }

            const toUpdate = { promo_images: JSON.stringify(exImages) };

            await FeConfiguration.updateOne({ _id: configuration[0]._id }, { ...toUpdate });
            const updatedConfiguration = await FeConfiguration.findById(configuration[0]._id);

            await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
            res.status(statusCodes.success).json({
                message: successMessages.promo_images_updated_tr,
                actual_message: successMessages.promo_images_updated,
                configuration: generateConf(updatedConfiguration)
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
}

exports.clearPromoImages = async(req, res) => {
    const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

    const path = './images/';

    try {
        const configuration = await FeConfiguration.find();
        if (configuration.length === 0) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.configuration_not_present));
            res.status(statusCodes.user_error).json({
                message: errorMessages.configuration_not_present_tr,
                actual_message: errorMessages.configuration_not_present
            });
        } else {
            if (configuration[0].promo_images) {
                for await (const image of JSON.parse(configuration[0].promo_images)) {
                    await Image.deleteOne({ name: image });
                    
                    if (fs.existsSync(path + image)) {
                        fs.unlinkSync(path + image);
                    }
                }
            }

            await FeConfiguration.updateOne({ _id: configuration[0]._id }, { promo_images: null });
            const updatedConfiguration = await FeConfiguration.findById(configuration[0]._id);

            await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
            res.status(statusCodes.success).json({
                message: successMessages.promo_images_updated_tr,
                actual_message: successMessages.promo_images_updated,
                configuration: generateConf(updatedConfiguration)
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
}

exports.addPromoVideo = (req, res) => {

}

exports.addMultipleAddresses = (req, res) => {

}

exports.addMultiplePhoneNumbers = (req, res) => {

}

exports.delete = (req, res) => {

}