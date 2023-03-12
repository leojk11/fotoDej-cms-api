const Request = require('../db/models/request');

const { generateDate, generateTime } = require('../helpers/timeDate');
const { generateRequest } = require('../helpers/generateModels');
const { insertNotificaton } = require('../helpers/notificationTools');

const { ErrorKind } = require('../enums/errorKind');
const { RequestStatus } = require('../enums/requestStatus');
const { NotificationType } = require('../enums/notificationType');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');

const { successMessages } = require('../helpers/successMessages');

exports.getAll = (req, res) => {

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
      res.status(statusCodes.user_error).json({
        message: errorMessages.invalid_request_status_tr,
        actual_message: errorMessages.invalid_request_status
      });

      return;
    }
    filters.status = req.query.status;
  }

  Request.find(filters)
    .sort({ _id: 'desc' })
    .skip(skip)
    .limit(parseInt(req.query.take))
    .then(requests => {
      Request.find(filters)
        .count()
        .then(countRes => {
            const requestsToSend = [];

            for(const request of requests) {
              requestsToSend.push(generateRequest(request));
            }

            res.status(statusCodes.success).json({
              page: parseInt(req.query.page),
              total: countRes,
              list: requestsToSend
            });
        })
        .catch(error => {
          console.log(error);
          res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error
          });
        })
    })
    .catch(error => {
      console.log(error);
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error
      });
    })
}

exports.getPending = (req, res) => {
  let skip = 0;
  if(parseInt(req.query.page) === 1) {
    skip = 0;
  } else {
    skip = req.query.take;
  }

  Request.find({ status: RequestStatus.PENDING })
    .sort({ _id: 'desc' })
    .skip(skip)
    .limit(parseInt(req.query.take))
    .then(requests => {
      Request.find({ status: RequestStatus.PENDING })
        .count()
        .then(countRes => {
            const requestsToSend = [];

            for(const request of requests) {
              requestsToSend.push(generateRequest(request));
            }

            res.status(statusCodes.success).json({
              page: parseInt(req.query.page),
              total: countRes,
              list: requestsToSend
            });
        })
        .catch(error => {
          console.log(error);
          res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error
          });
        })
    })
    .catch(error => {
      console.log(error);
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error
      });
    })
}

exports.getSingle = (req, res) => {
  const _id = req.params.id;

  if (_id) {
    Request.find({ _id })
      .then(requests => {
        if (requests.length === 0) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.request_not_exist_tr,
            actual_message: errorMessages.not_exist('Request', _id)
          });
        } else {
          res.status(statusCodes.success).send(generateRequest(requests[0]));
        }
      })
      .catch(error => {
        console.log(error);
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

exports.addNew = (req, res) => {
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
    Request.insertMany(data)
      .then(async () => {
        await insertNotificaton(NotificationType.REQUEST_SENT, null, new Date(), null);

        res.status(statusCodes.success).json({
          message: successMessages.request_created_tr,
          actual_message: successMessages.request_created
        });
      })
      .catch(error => {
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error
        });
      })
  }
}

exports.markAsContacted = (req, res) => {
  const _id = req.params.id;

  if (_id) {
    Request.find({ _id })
      .then(requests => {
        if (requests.length === 0) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.request_not_exist_tr,
            actual_message: errorMessages.not_exist('Request', _id)
          });
        } else {
          Request.updateOne(
            { _id }, { status: RequestStatus.CONTACTED }
          ).then(() => {
            res.status(statusCodes.success).json({
              message: successMessages.request_contacted_tr,
              actual_message: successMessages.request_contacted
            });
          })
          .catch(error => {
            console.log(error);
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
        }
      })
      .catch(error => {
        console.log(error);
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

exports.delete = (req, res) => {

}