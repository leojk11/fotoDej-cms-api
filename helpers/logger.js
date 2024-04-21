const { LogType } = require('../enums/logType');

const { generateDate, generateTime } = require('./timeDate');
const { statusCodes } = require('./statusCodes');

exports.generateCustomMessageLogger = (user, request, message) => {
  const loggerData = {
    log_type: LogType.CUSTOM_MESSAGE,
    log_status: statusCodes.success,
    url: request.originalUrl,
    method: request.method,
    message,

    date: generateDate(),
    time: generateTime()
  };

  if (user) {
    loggerData['user'] = user;
  } else {
    loggerData['user'] = 'NO_USER';
  }

  return loggerData;
}

exports.generateSuccessLogger = (user, request) => {
  const loggerData = {
    log_type: LogType.SUCCESS,
    log_status: statusCodes.success,
    url: request.originalUrl,
    method: request.method,

    date: generateDate(),
    time: generateTime()
  };

  if (user) {
    loggerData['user'] = user;
  } else {
    loggerData['user'] = 'NO_USER';
  }

  return loggerData;
}

exports.generateErrorLogger = (user, request, error) => {
  const loggerData = {
    log_type: LogType.ERROR,
    log_status: statusCodes.server_error,
    user, error,     
    url: request.originalUrl,
    method: request.method,

    date: generateDate(),
    time: generateTime()
  };

  if (user) {
    loggerData['user'] = user;
  } else {
    loggerData['user'] = 'NO_USER';
  }

  return loggerData;
}
