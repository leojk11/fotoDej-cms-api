const Logger = require('../db/models/logger');

const { AdminRole } = require('../enums/adminRole');
const { ErrorKind } = require('../enums/errorKind');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');

const { parseJwt } = require('../middlewares/common');
const { successMessages } = require('../helpers/successMessages');

exports.getAll = (req, res) => {

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  let skip = 0;
  if(parseInt(req.query.page) === 1) {
    skip = 0;
  } else {
    skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
  }

  const filters = { };

  Logger.find(filters)
    .sort({ _id: 'desc' })
    .skip(skip)
    .limit(parseInt(req.query.take))
    .then(logs => {
      Logger.find(filters)
        .count()
        .then(countRes => {
          const logsToSend = [];

          for(const admin of logs) {
            logsToSend.push(admin);
          }

          res.status(statusCodes.success).json({
            page: parseInt(req.query.page),
            total: countRes,
            list: logsToSend
          });
        })
        .catch(error => {
          res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error
          });
        })
    })
    .catch(error => {
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error
      });
    })
}

exports.addNew = (info) => {
  Logger.insertMany(info)
    .then(info => {
      console.log('new log added')
    })
}