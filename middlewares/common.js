const jwt = require('jsonwebtoken');
require('dotenv').config();

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');

exports.verifyToken = (req, res, next) => {
    try {
        const splittedToken = req.headers.authorization.split(' ');
        const token = splittedToken[1];

        jwt.verify(token, process.env.SECRET);
        next();
    } catch (error) {
        res.status(statusCodes.not_authorized).json({
            message: errorMessages.not_authorized
        });
    }
}

exports.parseJwt = (token) => {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64');
    return JSON.parse(payload.toString());
}

exports.errorHandler = (err, req, res, next) => {
    const errorObj = {
        status: err.status,
        error: {
            message: err.message
        }
    };

    res.status(500).json(errorObj);
}