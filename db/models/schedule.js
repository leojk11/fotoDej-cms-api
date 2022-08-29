const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scheduleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },

  user_id: {
    type: String,
    required: true
  },

  created_date: {
    type: String,
    required: true
  },
  created_time: {
    type: String,
    required: true
  },
  created_by_id: {
    type: String,
    required: true
  },
  created_by: {
    type: String,
    required: true
  }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;