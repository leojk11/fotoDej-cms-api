const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
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

    role: {
        type: String,
        required: true
    },

    account_status: {
        type: String,
        required: true
    },
    online_status: {
        type: String
    },

    number_of_created_albums: {
        type: Number,
        required: true
    },

    number_of_schedules: {
        type: Number
    },
    number_of_completed_schedules: {
        type: Number // leave it for now
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
        type: String
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

    active: { // this is used to be able to create soft delete feature
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

const User = mongoose.model('User', userSchema);
module.exports = User;