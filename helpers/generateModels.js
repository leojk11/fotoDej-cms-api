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
        modified_time: user.modified_time,

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

        profile_image: client.profile_image,

        number_of_albums: client.number_of_albums,

        created_date: client.created_date,
        created_time: client.created_time,
        created_by: JSON.parse(client.created_by),

        modified_date: client.modified_date,
        modified_time: client.modified_time,

        account_status: client.account_status,
        active: client.active
    };
    if(client.modified_by) {
        newClient['modified_by'] = JSON.parse(client.modified_by);
    }

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

