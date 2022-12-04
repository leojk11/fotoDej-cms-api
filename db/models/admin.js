const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    phone_number: {
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

    role: {
        type: String,
        required: true
    }, // ADMIN, SUPER_ADMIN

    added_by: {
        type: Object,
        required: true
    },
    added_by_id: {
        type: String,
        required: true
    },
    date_added: {
        type: String,
        required: true
    },
    time_added: {
        type: String,
        required: true
    },

    modified_by: {
        type: Object
    },
    modified_by_id: {
        type: String
    },
    modified_date: {
        type: String
    },
    modified_time: {
        type: String
    }
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;