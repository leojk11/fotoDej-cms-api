const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackingSchema = new Schema({
  client: {
    type: Object,
    required: true
  },
  client_id: {
    type: String,
    required: true
  },

  tracking_type: {
    type: String,
    required: true
  },

  // this are dependant on what client did at the moment
  album: {
    type: Object
  },
  album_id: {
    type: String
  },

  image: {
    type: String
  },
  // this are dependant on what client did at the moment

  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  }
});

const Tracking = mongoose.model('Tracking', trackingSchema);
module.exports = Tracking;
