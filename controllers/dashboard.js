const Album = require('../db/models/album');
const Client = require('../db/models/client');
const Request = require('../db/models/request');
const Invite = require('../db/models/invite');
const VisitCounter = require('../db/models/visitCounter');

const Logger = require('../db/models/logger');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { generateSuccessLogger, generateErrorLogger } = require('../helpers/logger');
const { generateDate } = require('../helpers/timeDate');

exports.getDashboard = async (req, res) => {
  try {
    const albums = await Album.find().countDocuments();
    const clients = await Client.find().countDocuments();
    const requests = await Request.find().countDocuments();
    const invites = await Invite.find().countDocuments();

    const visitCounters = await VisitCounter.find({ date: generateDate() }).countDocuments();

    await Logger.insertMany(generateSuccessLogger(null, req));
    res.status(statusCodes.success).json({
      albums, clients,
      requests, invites,
      visitCounters
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