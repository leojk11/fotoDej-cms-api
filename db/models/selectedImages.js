const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const selectedImagesSchema = new Schema({
  album_id: {
    type: String,
    required: true
  },
  images: {
    type: Array,
    required: true
  }
});

const SelectedImages = mongoose.model('SelectedImages', selectedImagesSchema);
module.exports = SelectedImages;
