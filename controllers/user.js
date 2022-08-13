const User = require('../db/models/user');

const bcrypt = require('bcrypt');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { generateDate } = require('../helpers/timeDate');
const { AccountStatus, OnlineStatus } = require('../enums/accountStatus');

exports.getAll = (req, res) => {

    let skip = 0;
    if(parseInt(req.query.page) === 1) {
        skip = 0;
    } else {
        skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
    }

    const filters = {};

    User.find({ ...filters })
        .sort({ _id: 'asc' })
        .skip(skip)
        .limit(parseInt(req.query.take))
        .then(users => {
            User.find({ ...filters })
                .count()
                .then(countRes => {
                    const usersToSend = [];

                    for(const user of users) {
                        usersToSend.push(user);
                    }

                    res.status(statusCodes.success).json({
                        page: parseInt(req.query.page),
                        total: countRes,
                        list: usersToSend
                    });
                })
                .catch(error => {
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal,
                        error
                    });
                })
        })
        .catch(error => {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal,
                error
            });
        })
}

exports.addNew = (req, res) => {
    
    const data = {
        ...req.body,
        account_status: AccountStatus.NOT_ACTIVATED,
        online_status: OnlineStatus.OFFLINE,

        number_of_created_albums: 0,
        
        number_of_schedules: 0,
        number_of_completed_schedules: 0,

        created_date: generateDate()
    };

    // if(data.firstname === '' || !data.firstname) {
    //     res.status(statusCodes.user_error).json({
    //         message: errorMessages.required_field('Firstname')
    //     });
    // } else if(data.lastname === '' || !data.lastname) {
    //     res.status(statusCodes.user_error).json({
    //         message: errorMessages.required_field('Lastname')
    //     });
    // } else if(data.username === '' || !data.username) {
    //     res.status(statusCodes.user_error).json({
    //         message: errorMessages.required_field('Username')
    //     });
    // } else if(data.email === '' || !data.email) {
    //     res.status(statusCodes.user_error).json({
    //         message: errorMessages.required_field('Email')
    //     });
    // } 
    // // else if()

    data['password'] = bcrypt.hashSync(req.body.password, 10);

    User.insertMany(data)
        .then(_ => {
            res.status(statusCodes.success).json({
                message: 'New user has been added.'
            })
        })
        .catch(error => {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal,
                error
            });
        })
}