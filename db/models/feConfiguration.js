const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feConfiguration = new Schema({
    logo: {
        type: String
    },
    logo_white: {
        type: String
    },
    logo_icon: {
        type: String
    },
    main_image: {
        type: String
    },
    main_title: {
        type: String
    },
    main_title_tr: {
        type: String
    },
    second_title: {
        type: String
    },
    second_title_tr: {
        type: String
    },
    promo_images: {
        type: String
    },
    promo_videos: {
        type: Array
    },
    contact_form_label: {
        type: String
    },
    phone_number: {
        type: String
    },
    email: {
        type: String
    },
    address: {
        type: String
    },

    facebook_link: {
        type: String
    },
    insta_link: {
        type: String
    },

    // invite part
    invite_from: {
        type: String
    },
    invite_subject: {
        type: String
    },
    invite_credentials_message: {
        type: String
    },
    invite_credentials_email_label: {
        type: String
    },
    invite_credentials_password_label: {
        type: String
    },
    invite_login_message: {
        type: String
    },
    invite_thank_you_message: {
        type: String
    },
    invite_phone_number_icon: {
        type: String
    },
    invite_email_icon: {
        type: String
    },
    invite_location_icon: {
        type: String
    },
});

const FeConfiguration = mongoose.model('FeConfiguration', feConfiguration);
module.exports = FeConfiguration;
