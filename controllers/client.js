const Client = require('../db/models/client');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');

exports.getAll = (req, res) => {
    Client.find()
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
    const data = { 
        ...req.body,
        number_of_albums: 0
    };

    data['password'] = bcrypt.hashSync(req.body.password, 10);

    Client.insertMany({ ...data })
        .then(_ => {
            res.status(statusCodes.success).json({
                message: 'Client has been added'
            });
        })
        .catch(error => {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal,
                error
            });
        });
}