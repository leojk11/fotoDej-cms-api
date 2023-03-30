const Notification = require('../db/models/notification');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { generateNotification } = require('../helpers/generateModels');

const { TimePassedType } = require('../enums/timePassedType');
const { ErrorKind } = require('../enums/errorKind');
const { successMessages } = require('../helpers/successMessages');

exports.getAll = (req, res) => {

  let skip = 0;
  if(parseInt(req.query.page) === 1) {
    skip = 0;
  } else {
    skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
  }

  const filters = {};

  Notification.find(filters)
    .sort({ _id: 'desc' })
    .skip(skip)
    .limit(parseInt(req.query.take))
    .then(notifications => {
      Notification.find(filters)
        .count()
        .then(countRes => {
          const notificataionsToSend = [];

          for(const notification of notifications) {
            const addedTime = new Date(notification.timestamp);
            const now = new Date();

            const hours = Math.abs(addedTime - now) / 3.6e6;

            if (hours < 1) {
              const milisecs = (now - addedTime);
              const minutes = Math.round(((milisecs % 86400000) % 3600000) / 60000);

              notification['time_passed_type'] = TimePassedType.MINUTES;
              notification['time_passed'] = minutes;
            } else if (hours <= 24) {
              notification['time_passed_type'] = TimePassedType.HOURS;
              notification['time_passed'] = hours;
            } else {
              const difference = now.getTime() - addedTime.getTime();
              const totalDays = Math.ceil(difference / (1000 * 3600 * 24));

              notification['time_passed_type'] = TimePassedType.DAYS;
              notification['time_passed'] = totalDays;
            }

            notificataionsToSend.push(generateNotification(notification));
          }

          res.status(statusCodes.success).json({
            page: parseInt(req.query.page),
            total: countRes,
            list: notificataionsToSend
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

exports.markAsRead = (req, res) => {
  const _id = req.params.id;

  if (_id) {
    Notification.updateOne({ _id }, { read: true })
      .then(() => {
        Notification.find({ _id })
          .then(notifications => {
            res.status(statusCodes.success).json({
              message: successMessages.notification_marked_read_tr,
              actual_message: successMessages.notification_marked_read,
              notification: generateNotification(notifications[0])
            });
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