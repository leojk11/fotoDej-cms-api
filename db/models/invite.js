const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inviteSchema = new Schema({
  invited_client: {
    type: Object
  },
  invited_client_id: {
    type: String
  },

  invited_by: {
    type: Object
  },
  invited_by_id: {
    type: String
  },

  date: {
    type: String
  },
  time: {
    type: String
  }
});

const Invite = mongoose.model('Invite', inviteSchema);
module.exports = Invite;