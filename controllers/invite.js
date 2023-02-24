const Invite = require('../db/models/invite');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { generateInvite } = require('../helpers/generateModels');

const { InviteStatus } = require('../enums/inviteStatus');
const { ErrorKind } = require('../enums/errorKind');

const { parseJwt } = require('../middlewares/common');

exports.getAll = (req, res) => {

  // const token = req.headers.authorization;
  // const loggedInUser = parseJwt(token);

  let skip = 0;
  if(parseInt(req.query.page) === 1) {
    skip = 0;
  } else {
    skip = req.query.take
  }
  const filters = {};

  if (req.query.client) {
    filters.$or = [
			{ 'invited_client.firstname': { $regex: req.query.client, $options: 'i'} },
			{ 'invited_client.lastname': { $regex: req.query.client, $options: 'i'} }  
		];
  }
  if (req.query.date) {
    filters.date = req.query.date;
  }

  Invite.find(filters)
    .sort({ _id: 'desc' })
    .skip(skip)
    .limit(parseInt(req.query.take))
    .then(invites => {
      Invite.find(filters)
        .count()
        .then(countRes => {
          const invitesToSend = [];

          for(const invite of invites) {
            invitesToSend.push(generateInvite(invite));
          }

          res.status(statusCodes.success).json({
            page: parseInt(req.query.page),
            total: countRes,
            list: invitesToSend
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

exports.getSingle = (req, res) => {
  const _id = req.params.id;

  if(_id) {
    Invite.find({ _id })
      .then(invites => {
        if(invites.length === 0) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.invite_not_exist_tr,
            actual_message: errorMessages.not_exist('Invite', _id)
          });
        } else {
          res.status(statusCodes.success).send(generateInvite(invites[0]));
        }
      })
      .catch(error => {
        if(error.kind === ErrorKind.ID) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.invalid_id_tr,
            actual_message: errorMessages.invalid_id(id)
          });
        } else {
          res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error
          });
        }
      })
  } else {
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}