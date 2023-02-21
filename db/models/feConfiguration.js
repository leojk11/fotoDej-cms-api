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
    promo_video: {
        type: String
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
    }
});

const FeConfiguration = mongoose.model('FeConfiguration', feConfiguration);
module.exports = FeConfiguration;
