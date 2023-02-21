const Album = require('../db/models/album');
const Client = require('../db/models/client');
const Request = require('../db/models/request');
const Invite = require('../db/models/invite');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { successMessages } = require('../helpers/successMessages');

exports.getDashboard = async (req, res) => {
  const albums = await Album.find().count();
  const clients = await Client.find().count();
  const requests = await Request.find().count();
  const invites = await Invite.find().count();

  res.status(statusCodes.success).json({
    albums, clients,
    requests, invites
  });
}