const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clientLogSchema = new Schema({
  action: {
    type: String,
    required: true
  },
  client_id: {
    type: String,
    required: true
  },
  client: {
    type: Object,
    required: true
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

const ClientLog = mongoose.model('ClientLog', clientLogSchema);
module.exports = ClientLog;
