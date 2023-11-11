const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loggerSchema = new Schema({
  url: {
    type: String
  },
  method: {
    type: String
  },
  
  log_type: {
    type: String
  },
  log_status: {
    type: String
  },

  message: {
    type: String
  },
  error: {
    type: String
  },

  user: {
    type: Object
  },

  date: {
    type: String
  },
  time: {
    type: String
  }
});

const Lobber = mongoose.model('Logger', loggerSchema);
module.exports = Lobber;