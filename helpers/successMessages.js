exports.successMessages = {
  logged_in_successfully: 'Logged in successfully.',
  logged_in_successfully_tr: 'success.loggedIn',

  document_updated: (id) => `Document [${ id }] has been updated.`,
  document_deleted: (id) => `Document [${ id }] has been deleted.`,

  email_sent: 'Email has been sent successfully.',
  email_sent_tr: 'success.emailSent',

  client_created_tr: 'success.clientCreated',
  client_updated_tr: 'success.clientUpdated',
  client_deleted_tr: 'success.clientDeleted',
  client_deleted_permanently_tr: 'success.clientDeletedPermanently',
  client_recovered_tr: 'success.clientRecovered',
  client_profile_image_changed_tr: 'success.clientProfileImageChanged',

  album_created: 'Album has been created.',
  album_created_tr: 'success.albumCreated',
  album_updated: 'Album has been updated.',
  album_updated_tr: 'success.albumUpdated',
  album_images_updated: 'Images have been updated.',
  album_images_updated_tr: 'success.albumImagesUpdated',
  album_images_selected: 'Images have been selected.',
  album_images_selected_tr: 'success.albumImagesSelected',
  album_deleted: (title) => `Album ${ title } has been deleted permanently.`,
  album_deleted_tr: 'success.albumDeleted'
};