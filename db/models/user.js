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

    account_status: {
        type: String,
        required: true
    },
    online_status: {
        type: Boolean
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
    modified_date: {
        type: String
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;