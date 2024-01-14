const Request = require('../db/models/request');
const Logger = require('../db/models/logger');

const { generateDate, generateTime } = require('../helpers/timeDate');
const { generateRequest } = require('../helpers/generateModels');
const { insertNotificaton } = require('../helpers/notificationTools');

const { ErrorKind } = require('../enums/errorKind');
const { RequestStatus } = require('../enums/requestStatus');
const { NotificationType } = require('../enums/notificationType');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { successMessages } = require('../helpers/successMessages');
const { generateSuccessLogger, generateErrorLogger } = require('../helpers/logger');
const { requestNotification } = require('../helpers/emailNotification');

const { parseJwt } = require('../middlewares/common');

exports.getAll = async(req, res) => {

  const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

  let skip = 0;
  if(parseInt(req.query.page) === 1) {
    skip = 0;
  } else {
    skip = req.query.take;
  }

  const filters = { };

  if (req.query.firstname) {
    filters.firstname = { $regex: req.query.firstname, $options: 'i' };
  }
  if (req.query.lastname) {
    filters.lastname = { $regex: req.query.lastname, $options: 'i' };
  }
  if (req.query.phone) {
    filters.phone_number = { $regex: req.query.phone, $options: 'i' };
  }
  if (req.query.email) {
    filters.email = { $regex: req.query.email, $options: 'i' };
  }
  if (req.query.date) {
    filters.date = { $regex: req.query.date, $options: 'i' };
  }
  if (req.query.status) {
    if(req.query.status !== RequestStatus.PENDING && req.query.status !== RequestStatus.CONTACTED) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_request_status));
      res.status(statusCodes.user_error).json({
        message: errorMessages.invalid_request_status_tr,
        actual_message: errorMessages.invalid_request_status
      });

      return;
    }
    filters.status = req.query.status;
  }

  try {
    const requests = await Request.find(filters).sort({ _id: 'desc' })
      .skip(skip).limit(parseInt(req.query.take));
    const requestsCount = await Request.find(filters).count();

    await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
    res.status(statusCodes.success).json({
      page: parseInt(req.query.page),
      total: requestsCount,
      list: requests.map(request => generateRequest(request))
    });
  } catch (error) {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
    res.status(statusCodes.server_error).json({
      message: errorMessages.internal_tr,
      actual_message: errorMessages.internal,
      error
    });
  }
}

exports.getPending = async(req, res) => {
  const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

  let skip = 0;
  if(parseInt(req.query.page) === 1) {
    skip = 0;
  } else {
    skip = req.query.take;
  }

  try {
    const requests = await Request.find({ status: RequestStatus.PENDING }).sort({ _id: 'desc' })
      .skip(skip).limit(parseInt(req.query.take));
    const requestsCount = await Request.find({ status: RequestStatus.PENDING }).count();

    await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
    res.status(statusCodes.success).json({
      page: parseInt(req.query.page),
      total: requestsCount,
      list: requests.map(request => generateRequest(request))
    });
  } catch (error) {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
    res.status(statusCodes.server_error).json({
      message: errorMessages.internal_tr,
      actual_message: errorMessages.internal,
      error
    });
  }
}

exports.getSingle = async(req, res) => {
  const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

  const _id = req.params.id;

  if (_id) {
    try {
      const requests = await Request.find({ _id });
      if (requests.length === 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Request', _id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.request_not_exist_tr,
          actual_message: errorMessages.not_exist('Request', _id)
        });
      } else {
        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).send(generateRequest(requests[0]));
      }
    } catch (error) {
      if(error.kind === ErrorKind.ID) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.invalid_id_tr,
          actual_message: errorMessages.invalid_id(id)
        });
      } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error
        });
      }
    }
  } else {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}

exports.addNew = async(req, res) => {
  const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

  const data = { 
    ...req.body,

    status: RequestStatus.PENDING,

    date: generateDate(),
    time: generateTime()
  };

  if (data.firstname === '' || !data.firstname) {
    res.status(statusCodes.user_error).json({
      message: errorMessages.required_field_tr.firstname,
      actual_message: errorMessages.required_field('firstname')
    });
  } else if (data.lastname === '' || !data.lastname) {
    res.status(statusCodes.user_error).json({
      message: errorMessages.required_field_tr.lastname,
      actual_message: errorMessages.required_field('lastname')
    });
  } else if (data.phone_number === '' || !data.phone_number) {
    res.status(statusCodes.user_error).json({
      message: errorMessages.required_field_tr.phone_number,
      actual_message: errorMessages.required_field('phone number')
    });
  } else {
    try {
      await Request.insertMany(data);
      await insertNotificaton(NotificationType.REQUEST_SENT, null, new Date(), null, null);
      await requestNotification(data, req);

      await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
      res.status(statusCodes.success).json({
        message: successMessages.request_created_tr,
        actual_message: successMessages.request_created
      });
    } catch (error) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error
      });
    }
  }
}

exports.markAsContacted = async(req, res) => {
  const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

  const _id = req.params.id;

  if (_id) {
    try {
      const requests = await Request.find({ _id });
      if (requests.length === 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Request', _id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.request_not_exist_tr,
          actual_message: errorMessages.not_exist('Request', _id)
        });
      } else {
        await Request.updateOne(
          { _id }, { status: RequestStatus.CONTACTED }
        );

        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).json({
          message: successMessages.request_contacted_tr,
          actual_message: successMessages.request_contacted
        });
      }
    } catch (error) {
      if(error.kind === ErrorKind.ID) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.invalid_id_tr,
          actual_message: errorMessages.invalid_id(id)
        });
      } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error
        });
      }
    }
  } else {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}

exports.delete = (req, res) => {

}