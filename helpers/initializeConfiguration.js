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
  insta_link: '',

  // invite_part
  invite_from: 'New user',
  invite_subject: 'Invite!',
  invite_credentials_message: 'This are your login credentials',
  invite_credentials_email_label: 'Email',
  invite_credentials_password_label: 'Password',
  invite_login_message: 'Click on the next button to get redirected to login',
  invite_thank_you_message: 'Thank you for using us!',
  invite_phone_number_icon: 'DEF_phone_email_icon.png',
  invite_email_icon: 'DEF_mail_email_icon.png',
  invite_location_icon: 'DEF_location_email_icon.png',
};

exports.initConfiguration = async () => {
  const configuration = await FeConfiguration.find();
  if (configuration.length === 0) {
    await FeConfiguration.insertMany(initialConfiguration);
  }
};