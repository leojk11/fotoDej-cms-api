const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  type: {
    type: String,
    required: true
  },

  // type: ACCEPTED_INVITATION
  client: {
    type: Object
  },
  client_id: {
    type: String
  },

  event_info: {
    type: Object
  },

  message: { // for all types (generic messages)
    type: String
  },

  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  timestamp: {
    type: String,
    required: true
  }
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;