const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const organizationSchema = new Schema({
  name: {
    type: String,
    required: true
  },

  owner: {
    type: Object,
    required: true
  },
  owner_id: {
    type: String,
    required: true
  },

  number_of_members: {
    type: Number
  },

  created_time: {
    type: String,
    required: true
  },
  created_date: {
    type: String,
    required: true
  },
  created_by: {
    type: Object,
    required: true
  },
  created_by_id: {
    type: String,
    required: true
  }
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;