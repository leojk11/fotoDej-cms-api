const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const albumSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },

    images: {
        type: String
    },
    images_count: {
        type: Number,
        required: true
    },
    selected_images: {
        type: String
    },
    selected_images_count: {
        type: Number
    },

    assigned_date: {
        type: String
    },
    assigned_to_id: {
        type: String
    },
    assigned_to: {
        type: Object
    },
    assigned_by_id: {
        type: String
    },
    assigned_by: {
        type: Object
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
    modified_time: {
        type: String
    },
    modified_by_id: {
        type: String
    },
    modified_by: {
        type: Object
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
