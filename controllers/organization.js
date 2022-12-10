const Organization = require('../db/models/organization');

const { generateDate, generateTime } = require('../helpers/timeDate');

const { AdminRole } = require('../enums/adminRole');
const { ErrorKind } = require('../enums/errorKind');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');

const { parseJwt } = require('../middlewares/common');

exports.getAll = (req, res) => {

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  let skip = 0;
  if(parseInt(req.query.page) === 1) {
    skip = 0;
  } else {
    skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
  }

  const filters = {
    added_by_id: loggedInUser.id
  };

  Organization.find(filters)
    .sort({ _id: 'desc' })
    .skip(skip)
    .limit(parseInt(req.query.take))
    .then(organizations => {
      Organization.find(filters)
        .count()
        .then(countRes => {
          const organizationsToSend = [];

          for(const org of organizations) {
            organizationsToSend.push(org);
          }

          res.status(statusCodes.success).json({
            page: parseInt(req.query.page),
            total: countRes,
            list: organizationsToSend
          });
        })
        .catch(error => {
          res.status(statusCodes.server_error).json({
            message: errorMessages.internal,
            error
          });
        })
    })
    .catch(error => {
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal,
        error
      });
    })
}

exports.getSingle = (req, res) => {
  const _id = req.params.id;

  if (_id) {
    Organization.find({ _id })
      .then(organizations => {
        if (organizations.length === 0) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.not_exist('Organization', _id)
          });
        } else {
          res.status(statusCodes.success).send(organizations[0]);
        }
      })
      .catch(error => {
        if(error.kind === ErrorKind.ID) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.invalid_id(id),
            error
          });
        } else {
          res.status(statusCodes.server_error).json({
            message: errorMessages.internal,
            error
          });
        }
      })
  } else {
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing
    });
  }
}

exports.addNew = (req, res) => {
  // const token = req.headers.authorization;
  // const loggedInUser = parseJwt(token);
}