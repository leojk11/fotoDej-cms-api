const VisitCounter = require('../db/models/visitCounter');
const Logger = require('../db/models/logger');

const { generateSuccessLogger, generateErrorLogger } = require('../helpers/logger');
const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { generateVistiCounter } = require('../helpers/generateModels');
const { generateDate } = require('../helpers/timeDate');

exports.getAll = async(req, res) => {

  let skip = 0;
  if(parseInt(req.query.page) === 1) {
    skip = 0;
  } else {
    skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
  }

  const filters = {};

  try {
    const visitCounters = await VisitCounter.find(filters).sort({ _id: 'desc' })
      .skip(skip).limit(parseInt(req.query.take));
    const visitCountersCount = await VisitCounter.find().count();

    await Logger.insertMany(generateSuccessLogger(null, req));

    res.status(statusCodes.success).json({
      page: parseInt(req.query.page),
      total: visitCountersCount,
      list: visitCounters.map(visitCounter => generateVistiCounter(visitCounter))
    });
  } catch (error) {
    await Logger.insertMany(generateErrorLogger(null, req, error));

    res.status(statusCodes.server_error).json({
      message: errorMessages.internal_tr,
      actual_message: errorMessages.internal,
      error
    });
  }
}

exports.addCounter = async(req, res) => {
  await VisitCounter.insertMany({ date: generateDate() });
  res.status(200).send('ok');
}