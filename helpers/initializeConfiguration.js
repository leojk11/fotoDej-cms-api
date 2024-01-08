const FeConfiguration = require('../db/models/feConfiguration');

const initialConfiguration = {
  logo: 'DEF_black_camera_logo.png',
  logo_white: 'DEF_black_camera_logo.png',
  logo_icon: 'DEF_black_camera_logo.png',
  main_image: '',
  main_title: '',
  main_title_tr: '',
  second_title: '',
  second_title_tr: '',
  contact_form_label: '',
  phone_number: '',
  email: '',
  address: '',
  promo_images: '',
  promo_videos: [],
  facebook_link: '',
  insta_link: ''
};

exports.initConfiguration = async () => {
  const configuration = await FeConfiguration.find();
  if (configuration.length === 0) {
    await FeConfiguration.insertMany(initialConfiguration);
  }
};