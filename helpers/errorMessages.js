exports.errorMessages = {
    not_authorized: 'You are not authorized. Plase login!',
    internal: 'Internal server error!',
    id_missing: 'Please provide ID!',
    required_field: (field) => `${ field } is required.`,
    please_enter: (field) => `Plase enter your ${ field }.`,
    not_exist: (cluster, id) => `${ cluster } with ID ${ id } does not exist!`,
    user_not_exist: (email) => `User with email ${ email } does not exist.`,
    invalid_id: (id) => `Invalid ID [${ id }].`,
    no_permission: 'You are not permitted to do this!'
};