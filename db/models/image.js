const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    album_id: {
        type: String
    },
    disabled: {
        type: Boolean,
        required: true
    }
});

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;
