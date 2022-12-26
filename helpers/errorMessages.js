exports.errorMessages = {
  not_authorized: 'You are not authorized. Plase login!',
  internal: 'Internal server error!',
  internal_tr: 'error.internal',
  id_missing: 'Please provide ID!',
  id_missing_tr: 'errors.missingId',
  please_enter: (field) => `Plase enter your ${ field }.`,
  not_exist: (cluster, id) => `[ID: ${ id }] does not exist in ${ cluster }.`,
  user_not_exist: (email) => `User with email ${ email } does not exist.`,
  invalid_id: (id) => `[ID: ${ id }] is not valid.`,
  invalid_id_tr: 'errors.invalidId',

  no_permission: 'You are not permitted to do this!',
  no_permission_tr: 'errors.noPermission',
  client_not_exist_tr: 'errors.clientNoExist',

  required_field: (field) => `[Field: ${ field }] is mandatory.`,
  required_field_tr: {
    firstname: 'errors.required.firstname',
    lastname: 'errors.required.lastname',
    username: 'errors.required.username',
    phone_number: 'errors.required.phoneNumber',
    email: 'errors.required.email',
    password: 'errors.required.password',
  }
};