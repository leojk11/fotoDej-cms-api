const { generateDate, generateTime } = require('./timeDate');

exports.generateModificationForDb = (info) => {
  const newModification = {
    cluster: info.cluster,
    modified_element_id: info.id,

    modification: info.modification,

    modified_date: generateDate(),
    modified_time: generateTime(),

    modified_by: JSON.stringify(info.modified_by),
    modified_by_id: info.modified_by.id
  };

  return newModification;
}
exports.generateModification = (info) => {
  const newModification = {
    id: info._id,
    cluster: info.cluster,
    modification: info.modification,
    modified_element_id: info.modified_element_id,

    modified_date: info.modified_date,
    modified_time: info.modified_time,

    modified_by: JSON.parse(info.modified_by),
    modified_by_id: info.modified_by_id
  };

  return newModification;
}

exports.generateUser = (user) => {
  const newUser = {
    id: user._id,

    firstname: user.firstname,
    lastname: user.lastname,
    fullname: `${ user.firstname } ${ user.lastname }`,
    username: user.username,

    email: user.email,
    role: user.role,

    account_status: user.account_status,
    online_status: user.online_status,

    number_of_created_albums: user.number_of_created_albums,
    number_of_schedules: user.number_of_schedules,
    number_of_completed_schedules: user.number_of_completed_schedules,

    created_date: user.created_date,
    created_time: user.created_time,
    created_by: user.created_by,

    modified_date: user.modified_date,
    modified_by_id: user.modified_by_id,

    active: user.active
  };
  if(user.modified_by) {
    newUser['modified_by'] = JSON.parse(user.modified_by);
  }

  return newUser;
};

exports.generateClient = (client) => {
  const newClient = {
    id: client._id,

    firstname: client.firstname,
    lastname: client.lastname,
    fullname: `${ client.firstname } ${ client.lastname }`,

    phone_number: client.phone_number,
    email: client.email,
    username: client.username,

    profile_image: client.profile_image,

    number_of_albums: client.number_of_albums,

    created_date: client.created_date,
    created_time: client.created_time,
    created_by: client.created_by,
    created_by_id: client.created_by_id,

    modified_date: client.modified_date,
    modified_time: client.modified_time,
    modified_by: client.modified_by,
    modified_by_id: client.modified_by_id,

    deleted_by: client.deleted_by,

    account_status: client.account_status,
    active: client.active
  };
  
  return newClient;
}

exports.generateCleanModel = (user) => {
  const newCleanUser = {
    id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    fullname: `${ user.firstname } ${ user.lastname }`,
    email: user.email,
    username: user.username,
    profile_image: user.profile_image,
    role: user.role
  };

  return newCleanUser;
}

exports.generateAlbum = (album) => {
  const newAlbum = {
    id: album._id,
    title: album.title,
    date: album.date,
    images_count: album.images_count,
    selected_images: album.selected_images,
    selected_images_count: album.selected_images_count,
    assigned_date: album.assigned_date,
    assigned_to: album.assigned_to,
    assigned_to_id: album.assigned_to_id,
    assigned_by_id: album.assigned_by_id,
    created_date: album.created_date,
    created_by: album.created_by,
    created_by_id: album.created_by_id,
    modified_date: album.modified_date,
    modified_by: album.modified_by,
    modified_by_id: album.modified_by_id,
    active: album.active,
    deleted_by: album.deleted_by,
    deleted_by_id: album.deleted_by_id
  };

  if(album.images) {
    if(album.images.split(',').length > 1) {
      newAlbum['images'] = album.images.split(',');
    } else {
      const arr = [];
      arr.push(album.images);

      newAlbum['images'] = arr;
    }
  }
  return newAlbum;
}

exports.generateSchedule = (schedule) => {
  const newSchedule = {
    id: schedule.id,
    title: schedule.title,
    description: schedule.description,
    date: schedule.date,
    time: schedule.time,
    user_id: schedule.user_id,
    location_1: schedule.location_1,
    location_2: schedule.location_2,
    contact_number_1: schedule.contact_number_1,
    contact_number_2: schedule.contact_number_2
  };

  return newSchedule;
}

exports.generateLocation = (location) => {
  const newLocation = {
    id: location._id,
    title: location.title,
    place: location.place,
    date: location.date,
    time: location.time,

    location_n: location.location_n,
    schedule_id: location.schedule_id,
    schedule: location.schedule,
    user_id: location.user_id,

    created_by: location.created_by,
    created_by_id: location.created_by_id,
    created_time: location.created_time,
    created_date: location.created_date,

    modified_by: location.modified_by,
    modified_by_id: location.modified_by_id,
    modified_time: location.modified_time,
    modified_date: location.modified_date,
  };

  return newLocation;
}

exports.generateImage = (image) => {
  const newImage = {
    id: image._id,
    name: image.name,
    album_id: image.album_id,
    disabled: image.disabled
  };

  return newImage;
}

exports.generateSelectedImages = (selectedImages) => {
  const newSelectedImages = {
    id: selectedImages._id,
    album_id: selectedImages.album_id,
    images: selectedImages.images
  };

  return newSelectedImages;
}

exports.generateConf = (conf) => {
  const newConf = {
    id: conf._id,
    logo: conf.logo,
    logo_white: conf.logo_white,
    logo_icon: conf.logo_icon,
    main_image: conf.main_image,
    main_title: conf.main_title,
    main_title_tr: conf.main_title_tr,
    second_title: conf.second_title,
    second_title_tr: conf.second_title_tr,
    promo_videos: conf.promo_videos,
    contact_form_label: null, // will be completely removed in the feature
    phone_number: conf.phone_number,
    email: conf.email,
    address: conf.address,
    facebook_link: conf.facebook_link,
    insta_link: conf.insta_link,

    // invite part
    invite_from: conf.invite_from,
    invite_subject: conf.invite_subject,
    invite_credentials_message: conf.invite_credentials_message,
    invite_credentials_email_label: conf.invite_credentials_email_label,
    invite_credentials_password_label: conf.invite_credentials_password_label,
    invite_login_message: conf.invite_login_message,
    invite_thank_you_message: conf.invite_thank_you_message,
    invite_phone_number_icon: conf.invite_phone_number_icon,
    invite_email_icon: conf.invite_email_icon,
    invite_location_icon: conf.invite_location_icon
  };

  if(conf.promo_images) {
    newConf['promo_images'] = JSON.parse(conf.promo_images);
  }

  return newConf;
}

exports.generateInvite = (invite) => {
  const newInvite = {
    id: invite._id,
    invited_client: invite.invited_client,
    invited_client_id: invite.invited_client_id,
    invited_by: invite.invited_by,
    invited_by_id: invite.invited_by_id,

    status: invite.status,

    date: invite.date,
    time: invite.time
  };

  return newInvite;
}

exports.generateRequest = (req) => {
  const newReq = {
    id: req._id,
    firstname: req.firstname,
    lastname: req.lastname,
    phone_number: req.phone_number,
    email: req.email,
    status: req.status,
    time: req.time,
    date: req.date
  };

  return newReq;
}

exports.generateClientLog = (clientLog) => {
  const newClientLog = {
    id: clientLog._id,
    action: clientLog.action,
    client: clientLog.client,
    client_id: clientLog.client_id,
    date: clientLog.date,
    time: clientLog.time
  };

  return newClientLog;
}

exports.generateNotification = (notification) => {
  const newNotification = {
    id: notification._id,
    client: notification.client,
    client_id: notification.client_id,
    event_info: notification.event_info,
    message: notification.message,
    date: notification.date,
    time: notification.time,
    type: notification.type,
    album_id: notification.album_id,

    time_passed: notification.time_passed,
    time_passed_type: notification.time_passed_type,

    read: notification.read
  };

  return newNotification;
}
