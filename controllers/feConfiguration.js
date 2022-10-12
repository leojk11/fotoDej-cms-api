const FeConfiguration = require('../db/models/feConfiguration');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');

exports.get = (req, res) => {
    FeConfiguration.find()
        .then(configuration => {
            res.status(statusCodes.success).send(configuration[0]);
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

}

exports.addPromoVideo = (req, res) => {

}

exports.addMultipleAddresses = (req, res) => {

}

exports.addMultiplePhoneNumbers = (req, res) => {

}

exports.delete = (req, res) => {

}