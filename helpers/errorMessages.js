exports.errorMessages = {
    not_authorized: 'You are not authorized. Please login/register.',
    internal: 'Internal server error!',
    id_missing: 'Please provide ID!',
    required_field: (field) => `${ field } is required.`,
    please_enter: (field) => `Plase enter your ${ field }.`,
    not_exist: (cluster, id) => `${ cluster } with ID ${ id } does not exist!`
};