const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clientSchema = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    phone_number: {
        type: String
    },

    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    first_password: {
        type: String
    },

    profile_image: {
        type: String
    },

    number_of_albums: {
        type: Number,
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
    modified_by: {
        type: String
    },
    modified_by_id: {
        type: String
    },

    account_status: {
        type: String,
        required: true
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

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
