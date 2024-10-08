const ClientLog = require('../db/models/clientLog');
const Client = require('../db/models/client');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { successMessages } = require('../helpers/successMessages');
const { generateClientLog } = require('../helpers/generateModels');

const { ClientLogAction } = require('../enums/clientLogAction');

const { ErrorKind } = require('../enums/errorKind');

exports.getAll = (req, res) => {

	let skip = 0;
	if(parseInt(req.query.page) === 1) {
		skip = 0;
	} else {
		skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
	}

  const filters = {};

  if (req.query.client) {
    filters.$or = [
			{ 'client.firstname': { $regex: req.query.client, $options: 'i'} },
			{ 'client.lastname': { $regex: req.query.client, $options: 'i'} }  
		];
  }

  if (req.query.date) {
    filters.date = { $regex: req.query.date, $options: 'i' };
  }

  if (req.query.action) {
    if(req.query.action !== ClientLogAction.ACTIVATE_ACCOUNT 
      && req.query.action !== ClientLogAction.LOGIN 
      && req.query.action !== ClientLogAction.LOGOUT 
      && req.query.action !== ClientLogAction.SELECTED_IMAGES 
      && req.query.action !== ClientLogAction.UPDATED_PROFILE) {
      res.status(statusCodes.user_error).json({
        message: errorMessages.invalid_log_action_tr,
        actual_message: errorMessages.invalid_log_action
      });

      return;
    }
    filters.action = req.query.action;
  }

  ClientLog.find(filters)
    .sort({ _id: 'desc' })
    .skip(skip)
    .limit(parseInt(req.query.take))
    .then(clientLogs => {
      ClientLog.find(filters)
        .count()
        .then(countRes => {
          const logsToSend = [];

          for (const log of clientLogs) {
            logsToSend.push(generateClientLog(log));
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

exports.getForClient = (req, res) => {
  const clientId = req.params.id;

  if (clientId) {
    Client.find({ _id: clientId })
      .then(clients => {
        if (clients.length === 0) {
          res.status(statusCodes.not_found).json({
            message: errorMessages.client_not_exist_tr,
            actual_message: errorMessages.not_exist('clients', clientId)
          });
        } else {
          ClientLog.find({ client_id: clientId })
            .then(clientLogs => {
              const logsToSend = [];
      
              for (const log of clientLogs) {
                logsToSend.push(generateClientLog(log));
              }
      
              res.status(statusCodes.success).send(logsToSend);
            })
            .catch(error => {
              res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
              });
            })
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

exports.getRecentForClient = (req, res) => {
  const clientId = req.params.id;

  if (clientId) {
    Client.find({ _id: clientId })
      .then(clients => {
        if (clients.length === 0) {
          res.status(statusCodes.not_found).json({
            message: errorMessages.client_not_exist_tr,
            actual_message: errorMessages.not_exist('clients', clientId)
          });
        } else {
          ClientLog.find({ client_id: clientId })
            .sort({ _id: 'desc' })
            .limit(5)
            .then(clientLogs => {
              const logsToSend = [];
      
              for (const log of clientLogs) {
                logsToSend.push(generateClientLog(log));
              }
      
              res.status(statusCodes.success).send(logsToSend);
            })
            .catch(error => {
              res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
              });
            })
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

exports.insetInternalTests = (req, res) => {
  const data = { ...req.body };

  ClientLog.insertMany(data)
    .then(() => {
      res.status(200).send('ok');
    })
    .catch(error => {
      res.status(500).send(error);
    })
}