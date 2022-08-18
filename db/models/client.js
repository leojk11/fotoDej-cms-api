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

    account_status: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        require: true
    },
    deleted_by: {
        type: String
    }
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;