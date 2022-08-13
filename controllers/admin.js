const Admin = require('../db/models/admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');

exports.getAll = (req, res) => {
    Admin.find()
        .then(admins => {
            res.status(statusCodes.success).send(admins);
        })
        .catch(error => {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal,
                error
            });
        })
}

exports.addNew = (req, res) => {
    const data = { ...req.body };

    data['password'] = bcrypt.hashSync(req.body.password, 10);

    Admin.insertMany({ ...data })
        .then(_ => {
            res.status(statusCodes.success).json({
                message: 'Admin has been added'
            });
        })
        .catch(error => {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal,
                error
            });
        });
}