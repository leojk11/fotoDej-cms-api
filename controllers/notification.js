const Notification = require('../db/models/notification');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { generateNotification } = require('../helpers/generateModels');

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