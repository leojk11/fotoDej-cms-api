const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scheduleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
  },

  location_1: {
    type: String
  },
  location_2: {
    type: String
  },

  contact_number_1: {
    type: String
  },
  contact_number_2: {
    type: String
  },

  user_id: {
    type: String,
    required: true
  }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;
