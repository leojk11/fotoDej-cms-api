const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestSchema = new Schema({
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  phone_number: {
    type: String,
    required: true
  },
  email: {
    type: String
  },

  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  }
});

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
