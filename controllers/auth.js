const Admin = require('../db/models/admin');
const Client = require('../db/models/client');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { successMessages } = require('../helpers/successMessages');
const { generateCleanModel } = require('../helpers/generateModels');

const { loginCommands } = require('../enums/commands');

exports.adminLogin = (req, res) => {
    const data = { ...req.body };

    if(data.email === '' || !data.email) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.enter_email_tr,
            actual_message: errorMessages.please_enter('email')
        });
    } else if(data.password === '' || !data.password) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.enter_password_tr,
            actual_message: errorMessages.please_enter('password')
        });
    } else {
        Admin.find({ email: data.email })
            .then(admins => {
                if(admins.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.user_not_exist_tr,
                        actual_message: errorMessages.user_not_exist(data.email)
                    });
                } else {
                    if(bcrypt.compareSync(data.password, admins[0].password)) {
                        const token = jwt.sign(
                            { ...generateCleanModel(admins[0]) }, 
                            process.env.SECRET,
                            { expiresIn: '1h' }
                        );

                        res.status(statusCodes.success).json({
                            message: successMessages.logged_in_successfully_tr,
                            actual_message: successMessages.logged_in_successfully,
                            token,
                            user: generateCleanModel(admins[0])
                        });
                    } else {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.password_not_correct_tr,
                            actual_message: errorMessages.password_not_correct
                        });
                    }
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
}

exports.clientLogin = (req, res) => {
    const data = { ...req.body };

    if(data.email === '' || !data.email) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.enter_email_tr,
            actual_message: errorMessages.please_enter('email')
        });
    } else if(data.password === '' || !data.password) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.enter_password_tr,
            actual_message: errorMessages.please_enter('password')
        });
    } else {
        Client.find({ email: data.email })
            .then(users => {
                if(users.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.user_not_exist_tr,
                        actual_message: errorMessages.user_not_exist(data.email)
                    });
                } else {
                    if(users[0].active) {
                        if (users[0].first_password) {
                            if (data.password === users[0].first_password) {
                                res.status(statusCodes.success).json({
                                    command: loginCommands.RESET_REQUIRED,
                                    user_info: {
                                        id: users[0]._id,
                                        first_password: users[0].first_password
                                    }
                                });
                            } else {
                                res.status(statusCodes.user_error).json({
                                    message: errorMessages.password_not_correct_tr,
                                    actual_message: errorMessages.password_not_correct
                                });
                            }
                        } else {
                            if(bcrypt.compareSync(data.password, users[0].password)) {
                                const token = jwt.sign(
                                    { ...generateCleanModel(users[0]) }, 
                                    process.env.SECRET,
                                    { expiresIn: '1h' }
                                );
        
                                res.status(statusCodes.success).json({
                                    message: successMessages.logged_in_successfully_tr,
                                    actual_message: successMessages.logged_in_successfully,
                                    token,
                                    user: generateCleanModel(users[0])
                                });
                            } else {
                                res.status(statusCodes.user_error).json({
                                    message: errorMessages.password_not_correct_tr,
                                    actual_message: errorMessages.password_not_correct
                                });
                            }
                        }
                    } else {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.user_not_exist_tr,
                            actual_message: errorMessages.user_not_exist(data.email)
                        });
                    }
                    
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
}