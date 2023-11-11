const { LogType } = require('../enums/logType');

const { generateDate, generateTime } = require('./timeDate');
const { statusCodes } = require('./statusCodes');

exports.generateSuccessLogger = (user, request) => {
  const loggerData = {
    log_type: LogType.SUCCESS,
    log_status: statusCodes.success,
    url: request.url,
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
    url: request.url,
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
