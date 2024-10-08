exports.errorMessages = {
  please_enter: (field) => `Plase enter ${ field }.`,
  enter_password_tr: 'errors.enterPassword',
  enter_email_tr: 'errors.enterEmail',
  enter_image_name_tr: 'errors.enterImageName',

  user_not_exist: (email) => `User with email ${ email } does not exist.`,
  user_not_exist_tr: 'errors.userNotExist',

  not_authorized: 'You are not authorized. Plase login!',
  not_authorized_tr: 'errors.notAuthorized',
  passwords_not_match: 'Passwords do not match.',
  passwords_not_match_tr: 'errors.passwordsNotMatch',
  password_not_correct: 'Entered password is not correct.',
  password_not_correct_tr: 'errors.passwordNotCorrect',

  internal: 'Internal server error!',
  internal_tr: 'errors.internal',

  status_not_exist: 'Status does not exist.',
  status_not_exist_tr: 'errors.statusNotExist',

  email_send_error: 'Error while sending email.',
  email_send_error_tr: 'errors.emailSend',

  id_missing: 'You need to provide ID.',
  id_missing_tr: 'errors.missingId',
  not_exist: (cluster, id) => `[ID: ${ id }] does not exist in ${ cluster }.`,
  invalid_id: (id) => `[ID: ${ id }] is not valid.`,
  invalid_id_tr: 'errors.invalidId',

  no_permission: 'You are not permitted to do this!',
  no_permission_tr: 'errors.noPermission',
  client_not_exist_tr: 'errors.clientNoExist',
  user_exist_email_tr: 'errors.clientExistEmail',
  client_already_active: 'Client is already active.',
  client_already_active_tr: 'errors.clientAlreadyActive',
  invalid_account_status: 'Account status is not valid. [ACTIVE, PENDING]',
  invalid_account_status_tr: 'errors.invalidAccountStatus',

  album_not_exist_tr: 'errors.albumNotExist',
  select_images: 'Please selected images.',
  select_images_tr: 'errors.selectImages',

  admin_exist_email_tr: 'errors.adminExistEmail',
  admin_not_exist_tr: 'errors.adminNotExist',

  configuration_not_present: 'Configuration is not present yet.',
  configuration_not_present_tr: 'errors.configurationNotPresent',
  max_images: 'You cannot select more then 6 images.',
  max_images_tr: 'errors.maxImages',
  image_not_exist: 'Image does not not exist.',
  image_not_exist_tr: 'errors.imageNotExist',
  must_select_image: 'You must select an image.',
  must_select_image_tr: 'errors.mustSelectImage',

  provide_image_name: 'You need to provide image name.',
  provide_image_name_tr: 'errors.provideImageName',
  upload_error: 'Error while uploading',
  upload_error_tr: 'errors.uploadError',

  invite_not_exist_tr: 'errors.inviteNotExist',
  invalid_invite_status: 'You have set invalid request status. [SUCCESSFULL, FAILED]',
  invalid_invite_status_tr: 'errors.ivalidInviteStatus',


  dates_need_provided: 'Dates from ad to need to be provided.',
  dates_need_provided_tr: 'errors.datesNeedToBeProvided',

  request_not_exist_tr: 'errors.requestNotExist',
  invalid_request_status: 'You have set invalid request status. [PENDING, CONTACTED]',
  invalid_request_status_tr: 'errors.invalidRequestStatus',

  schedule_not_exist_tr: 'errors.scheduleNotExist',
  missing_schedule_or_location: 'You are missing schedule or location id.',
  missing_schedule_or_location_tr: 'errors.missingScheduleOrLocationId',
  location_not_exist_tr: 'errors.locationNotExist',
  limit_required_tr: 'errors.limitRequired',
  limit_required: 'You need to provide the amount of how much elements you want to receive.',

  invalid_log_action: 'Log action has been invalid. [LOGIN, LOGOUT, ACTIVATE_ACCOUNT, SELECTED_IMAGES, UPDATED_PROFILE]',
  invalid_log_action_tr: 'errors.invalidLogAction',

  required_field: (field) => `[Field: ${ field }] is mandatory.`,
  required_field_tr: {
    firstname: 'errors.required.firstname',
    lastname: 'errors.required.lastname',
    username: 'errors.required.username',
    phone_number: 'errors.required.phoneNumber',
    email: 'errors.required.email',
    password: 'errors.required.password',
    title: 'errors.required.title',
    date: 'errors.required.date',
    new_user: 'errors.required.newUser',
    logo: 'errors.required.logo',
    main_image: 'errors.required.mainImage',
    main_title: 'errors.required.mainTitle',
    second_title: 'errors.required.secondTitle',
    contact_form_label: 'errors.required.contactFormLabel',
    address: 'errors.required.address'
  }
};