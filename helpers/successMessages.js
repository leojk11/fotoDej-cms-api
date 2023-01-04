exports.successMessages = {
  logged_in_successfully: 'success.loggedIn',

  document_updated: (id) => `Document [${ id }] has been updated.`,
  document_deleted: (id) => `Document [${ id }] has been deleted.`,

  email_sent: 'Email has been sent successfully.',
  email_sent_tr: 'success.emailSent',

  client_created_tr: 'success.clientCreated',
  client_updated_tr: 'success.clientUpdated',
  client_deleted_tr: 'success.clientDeleted',
  client_deleted_permanently_tr: 'success.clientDeletedPermanently',
  client_recovered_tr: 'success.clientRecovered',
  client_profile_image_changed_tr: 'success.clientProfileImageChanged'
};