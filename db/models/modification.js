const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const modificationSchema = new Schema({
  cluster: {
    type: String,
    required: true
  },
  modified_element_id: {
    type: String,
    required: true
  },
  modified_field: {
    type: String,
    required: true
  },
  before_modification_value: {
    type: String,
    required: true
  },
  
  modification: {
    type: String,
    requied: true
  }, // enum: ADDED_IMAGES, SELECTED_IMAGES, ASSIGNED_ALBUM, EDITED_ALBUM, SOFT_DELETED_ALBUM, EDIT_CLIENT, SOFT_DELETE_CLIENT, EDIT_USER, SOFT_DELETE_USER

  modified_date: {
    type: String,
    required: true
  },
  modified_time: {
    type: String,
    required: true
  },
  modified_by_id: {
    type: String,
    required: true
  },
  modified_by: {
    type: String,
    required: true
  },

});

const Modification = mongoose.model('Modification', modificationSchema);
module.exports = Modification;