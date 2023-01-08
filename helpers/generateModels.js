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
    assigned_to_id: album.assigned_to_id,
    assigned_by_id: album.assigned_by_id,
    created_date: album.created_date,
    created_by_id: album.created_by_id,
    modified_date: album.modified_date,
    modified_by_id: album.modified_by_id,
    active: album.active,
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


  if(album.assigned_to) {
    newAlbum['assigned_to'] = JSON.parse(album.assigned_to);
  }
  if(album.assigned_by) {
    newAlbum['assigned_by'] = JSON.parse(album.assigned_by);
  }
  if(album.created_by) {
    newAlbum['created_by'] = JSON.parse(album.created_by);
  }
  if(album.modified_by) {
    newAlbum['modified_by'] = JSON.parse(album.modified_by);
  }
  if(album.deleted_by) {
    newAlbum['deleted_by'] = JSON.parse(album.deleted_by);
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

exports.generateImage = (image) => {
  const newImage = {
    id: image._id,
    name: image.name,
    album_id: image.album_id
  };

  return newImage;
}

exports.generateConf = (conf) => {
  const newConf = {
    id: conf._id,
    logo: conf.logo,
    main_image: conf.main_image,
    main_title: conf.main_title,
    second_title: conf.second_title,
    promo_video: conf.promo_video,
    contact_form_label: conf.contact_form_label,
    phone_number: conf.phone_number,
    email: conf.email,
    address: conf.address,
    facebook_link: conf.facebook_link,
    insta_link: conf.insta_link
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

    date: invite.date,
    time: invite.time
  };

  return newInvite;
}

