exports.generateUser = (user) => {
    const newUser = {
        id: user._id,

        firstname: user.firstname,
        lastname: user.lastname,
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
        modified_by: user.modified_by,

        active: user.active
    };

    return newUser;
}