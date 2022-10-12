const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feConfiguration = new Schema({
    logo: {
        type: String
    },
    main_image: {
        type: String
    },
    main_title: {
        type: String
    },
    second_title: {
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
    }
});

const FeConfiguration = mongoose.model('FeConfiguration', feConfiguration);
module.exports = FeConfiguration;
