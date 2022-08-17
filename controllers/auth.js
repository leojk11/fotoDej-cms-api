const Admin = require('../db/models/admin');
const User = require('../db/models/user');
const Client = require('../db/models/client');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');

exports.adminLogin = (req, res) => {
    const data = { ...req.body };

    if(data.email === '' || !data.email) {
        res.status(statusCodes.user_error).json({
            mesasge: errorMessages.please_enter('email')
        });
    } else if(data.password === '' || !data.password) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.please_enter('password')
        });
    } else {
        Admin.find({ email: data.email })
            .then(admins => {
                if(admins.length === 0) {
                    User.find({ email: data.email })
                        .then(users => {
                            if(users.length === 0) {
                                res.status(statusCodes.user_error).json({
                                    message: `User with email ${ data.email } does not exist.`
                                });
                            } else {
                                if(bcrypt.compareSync(data.password, admins[0].password)) {
                                    const token = jwt.sign(
                                        { ...admins[0] }, 
                                        process.env.SECRET
                                    );
            
                                    res.status(200).json({
                                        message: 'Logged in successfully.',
                                        token,
                                        user: admins[0]
                                    });
                                } else {
                                    res.status(statusCodes.user_error).json({
                                        message: 'Incorrect password!'
                                    });
                                }
                            }
                        })
                        .catch(error => {
                            res.status(statusCodes.server_error).json({
                                message: errorMessages.internal,
                                error
                            });
                        })

                } else {
                    if(bcrypt.compareSync(data.password, admins[0].password)) {
                        const token = jwt.sign(
                            { ...admins[0] }, 
                            process.env.SECRET
                        );

                        res.status(200).json({
                            message: 'Logged in successfully.',
                            token,
                            user: admins[0]
                        });
                    } else {
                        res.status(statusCodes.user_error).json({
                            message: 'Incorrect password!'
                        });
                    }
                }
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal,
                    error
                });
            })
    }
}

exports.clientLogin = (req, res) => {
    const data = { ...req.body };

    if(data.email === '' || !data.email) {
        res.status(statusCodes.user_error).json({
            mesasge: errorMessages.please_enter('email')
        });
    } else if(data.password === '' || !data.password) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.please_enter('password')
        });
    } else {
        Client.find({ email: data.email })
            .then(users => {
                if(users.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: `Profile with email ${ data.email } does not exist.`
                    });
                } else {
                    if(bcrypt.compareSync(data.password, users[0].password)) {
                        const token = jwt.sign(
                            { ...users[0] }, 
                            process.env.SECRET
                        );

                        res.status(200).json({
                            message: 'Logged in successfully.',
                            token,
                            user: users[0]
                        });
                    } else {
                        res.status(statusCodes.user_error).json({
                            message: 'Incorrect password!'
                        });
                    }
                }
            })
            .catch(error => {
                console.log(error);
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal,
                    error
                });
            })
    }
}