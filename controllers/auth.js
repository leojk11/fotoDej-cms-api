const Admin = require('../db/models/admin');
const User = require('../db/models/user');

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
                            admin: admins[0]
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

exports.userLogin = (req, res) => {
    const data = { ...req.body };
}