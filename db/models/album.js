const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const albumSchema = new Schema({
    title: {
        type: String,
        required: true
    },

    images: { // not required when creating the album
        type: String
    },
    images_count: { // required because it will be 0 by default
        type: Number,
        required: true
    },

    assigned_date: {
        type: String
    },
    assigned_to_id: {
        type: String
    },
    assigned_to: {
        type: String
    },
    assigned_by_id: {
        type: String
    },
    assigned_by: {
        type: String
    },

    created_date: {
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
    },

    modified_date: {
        type: String
    },
    modified_by_id: {
        type: String
    },
    modified_by: {
        type: String
    },

    active: {
        type: Boolean,
        required: true
    },
    deleted_by_id: {
        type: String
    },
    deleted_by: {
        type: String
    }
});

const Album = mongoose.model('Album', albumSchema);
module.exports = Album;