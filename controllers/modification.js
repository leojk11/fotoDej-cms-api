const Modification = require('../db/models/modification');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { generateModification } = require('../helpers/generateModels');

exports.getAll = (req, res) => {
  
  let skip = 0;
  if(parseInt(req.query.page) === 1) {
      skip = 0;
  } else {
      skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
  }

  const filters = { };

  Modification.find({ ...filters })
    .sort({ _id: 'asc' })
    .skip(skip)
    .limit(parseInt(req.query.take))
    .then(modifications => {
      Modification.find({ ...filters })
        .count()
        .then(countRes => {
          const modificationsToSend = [];

          for(const modification of modifications) {
            modificationsToSend.push(generateModification(modification));
          }

          res.status(statusCodes.success).json({
            page: parseInt(req.query.page),
            total: countRes,
            list: modificationsToSend
          });
        })
        .catch(error => {
          console.log(error);
          res.status(statusCodes.server_error).json({
            message: errorMessages.internal,
            error
          });
        })
    })
    .catch(error => {
      console.log(error);
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal,
        error
      });
    })
}