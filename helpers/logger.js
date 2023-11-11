const { LogType } = require('../enums/logType');

const { generateDate, generateTime } = require('./timeDate');
const { statusCodes } = require('./statusCodes');

exports.generateSuccessLogger = (user, url) => {
  return {
    log_type: LogType.SUCCESS,
    log_status: statusCodes.success,
    user, url,

    date: generateDate(),
    time: generateTime()
  };
}

exports.generateErrorLogger = (user, url, error) => {
  return {
    log_type: LogType.ERROR,
    log_status: statusCodes.server_error,
    user, error, url,

    date: generateDate(),
    time: generateTime()
  };
}
