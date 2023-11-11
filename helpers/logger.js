const { LogType } = require('../enums/logType');

const { generateDate, generateTime } = require('./timeDate');
const { statusCodes } = require('./statusCodes');

exports.generateSuccessLogger = (user, request) => {
  return {
    log_type: LogType.SUCCESS,
    log_status: statusCodes.success,
    user,
    url: request.url,
    method: request.method,

    date: generateDate(),
    time: generateTime()
  };
}

exports.generateErrorLogger = (user, request, error) => {
  return {
    log_type: LogType.ERROR,
    log_status: statusCodes.server_error,
    user, error,     
    url: request.url,
    method: request.method,

    date: generateDate(),
    time: generateTime()
  };
}
