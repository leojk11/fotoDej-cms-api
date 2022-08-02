const jwt = require('jsonwebtoken');
require('dontenv/connfig');

const { errorCodes } = require('../helpers/errorCodes');
const { errorMessages } = require('../helpers/errorMessages');

exports.verifyToken = (req, res, next) => {
    try {
        const splittedToken = req.headers.authorization.split(' ');
        const token = splittedToken[1];

        jwt.verify(token, process.env.SECRET);
        next();
    } catch (error) {
        res.status(errorCodes.not_authorized).json({
            message: errorMessages.not_authorized
        });
    }
}

exports.parseJwt = (token) => {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64');
    return JSON.parse(payload.toString());
}