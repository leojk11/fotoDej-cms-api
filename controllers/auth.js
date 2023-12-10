const Admin = require('../db/models/admin');
const Client = require('../db/models/client');
const ClientLog = require('../db/models/clientLog');
const Logger = require('../db/models/logger');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { successMessages } = require('../helpers/successMessages');
const { generateCleanModel } = require('../helpers/generateModels');
const { generateDate, generateTime } = require('../helpers/timeDate');
const { generateSuccessLogger, generateErrorLogger } = require('../helpers/logger');

const { loginCommands } = require('../enums/commands');
const { ClientLogAction } = require('../enums/clientLogAction');

exports.adminLogin = async(req, res) => {
    const data = { ...req.body };

    try {
        if(data.email === '' || !data.email) {
            await Logger.insertMany(generateErrorLogger(null, req, errorMessages.please_enter('email')));
            res.status(statusCodes.user_error).json({
                message: errorMessages.enter_email_tr,
                actual_message: errorMessages.please_enter('email')
            });
        } else if(data.password === '' || !data.password) {
            await Logger.insertMany(generateErrorLogger(null, req, errorMessages.please_enter('password')));
            res.status(statusCodes.user_error).json({
                message: errorMessages.enter_password_tr,
                actual_message: errorMessages.please_enter('password')
            });
        } else {
            const admins = await Admin.find({ email: data.email });
            if(admins.length === 0) {
                await Logger.insertMany(generateErrorLogger(null, req, errorMessages.user_not_exist(data.email)));
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

                    await Logger.insertMany(generateSuccessLogger(generateCleanModel(admins[0]), req));
                    res.status(statusCodes.success).json({
                        message: successMessages.logged_in_successfully_tr,
                        actual_message: successMessages.logged_in_successfully,
                        token,
                        user: generateCleanModel(admins[0])
                    });
                } else {
                    await Logger.insertMany(generateErrorLogger(null, req, errorMessages.password_not_correct));
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.password_not_correct_tr,
                        actual_message: errorMessages.password_not_correct
                    });
                }
            }
        }
    } catch (error) {
        await Logger.insertMany(generateErrorLogger(null, req, error));
        res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error
        });
    }
}

exports.clientLogin = async(req, res) => {
    const data = { ...req.body };

    try {
        if(data.email === '' || !data.email) {
            await Logger.insertMany(generateErrorLogger(null, req, errorMessages.please_enter('email')));
            res.status(statusCodes.user_error).json({
                message: errorMessages.enter_email_tr,
                actual_message: errorMessages.please_enter('email')
            });
        } else if(data.password === '' || !data.password) {
            await Logger.insertMany(generateErrorLogger(null, req, errorMessages.please_enter('password')));
            res.status(statusCodes.user_error).json({
                message: errorMessages.enter_password_tr,
                actual_message: errorMessages.please_enter('password')
            });
        } else {
            const clients = await Client.find({ email: data.email });
            if(clients.length === 0) {
                await Logger.insertMany(generateErrorLogger(null, req, errorMessages.user_not_exist(data.email)));
                res.status(statusCodes.user_error).json({
                    message: errorMessages.user_not_exist_tr,
                    actual_message: errorMessages.user_not_exist(data.email)
                });
            } else {
                if (!clients[0].active) {
                    await Logger.insertMany(generateErrorLogger(null, req, errorMessages.user_not_exist(data.email)));
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.user_not_exist_tr,
                        actual_message: errorMessages.user_not_exist(data.email)
                    });
                } else {
                    if (clients[0].first_password) {
                        if (data.password === clients[0].first_password) {
                            await Logger.insertMany(generateSuccessLogger(generateCleanModel(clients[0]), req));
                            res.status(statusCodes.success).json({
                                command: loginCommands.RESET_REQUIRED,
                                user_info: {
                                    id: clients[0]._id,
                                    first_password: clients[0].first_password
                                }
                            });
                        } else {
                            await Logger.insertMany(generateErrorLogger(null, req, errorMessages.password_not_correct));
                            res.status(statusCodes.user_error).json({
                                message: errorMessages.password_not_correct_tr,
                                actual_message: errorMessages.password_not_correct
                            });
                        }
                    } else {
                        if(bcrypt.compareSync(data.password, clients[0].password)) {
                            const token = jwt.sign(
                                { ...generateCleanModel(clients[0]) }, 
                                process.env.SECRET,
                                { expiresIn: '1h' }
                            );

                            const logData = {
                                action: ClientLogAction.LOGIN,
                                client_id: clients[0]._id,
                                client: generateCleanModel(clients[0]),
                                date: generateDate(),
                                time: generateTime()
                            };

                            await ClientLog.insertMany(logData);

                            await Logger.insertMany(generateSuccessLogger(generateCleanModel(clients[0]), req));
                            res.status(statusCodes.success).json({
                                message: successMessages.logged_in_successfully_tr,
                                actual_message: successMessages.logged_in_successfully,
                                token,
                                user: generateCleanModel(clients[0])
                            });
                        } else {
                            await Logger.insertMany(generateErrorLogger(null, req, errorMessages.password_not_correct));
                            res.status(statusCodes.user_error).json({
                                message: errorMessages.password_not_correct_tr,
                                actual_message: errorMessages.password_not_correct
                            });
                        }
                    }
                }
            }
        }
    } catch (error) {
        await Logger.insertMany(generateErrorLogger(null, req, error));
        res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error
        });
    }
}