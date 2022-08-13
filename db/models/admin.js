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
        type: String
    },

    role: {
        type: String,
        required: true
    }, // ADMIN, HEAD_ADMIN, OP

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
    }
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;