const User = require('../db/models/user');
const Admin = require('../db/models/admin');

const bcrypt = require('bcrypt');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { ErrorKind } = require('../enums/errorKind');
const { generateDate, generateTime } = require('../helpers/timeDate');
const { AccountStatus, OnlineStatus } = require('../enums/accountStatus');
const { UserRole } = require('../enums/userRole');
const { generateUser } = require('../helpers/generateModels');

exports.getAll = (req, res) => {

    let skip = 0;
    if(parseInt(req.query.page) === 1) {
        skip = 0;
    } else {
        skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
    }

    const filters = { active: true };

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

exports.getSingle = (req, res) => {
    if(req.params.id) {
        User.find({ _id: req.params.id })
            .then(users => {
                if(users.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('User', req.params.id)
                    });
                } else {
                    res.status(statusCodes.success).send(generateUser(users[0]));
                }
            })
            .catch(error => {
                if(error.kind === ErrorKind.ID) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.invalid_id(req.params.id)
                    });
                } else {
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal,
                        error
                    });
                }
            })
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing
        });
    }
}

exports.addNew = (req, res) => {
    
    const data = {
        ...req.body,
        role: UserRole.USER,

        active: true,

        account_status: AccountStatus.ACTIVE,
        online_status: OnlineStatus.OFFLINE,

        number_of_created_albums: 0,
        
        number_of_schedules: 0,
        number_of_completed_schedules: 0,

        created_date: generateDate(),
        created_time: generateTime()
    };

    if(data.firstname === '' || !data.firstname) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Firstname')
        });
    } else if(data.lastname === '' || !data.lastname) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Lastname')
        });
    } else if(data.username === '' || !data.username) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Username')
        });
    } else if(data.email === '' || !data.email) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Email')
        });
    } else {
        User.find({ email: data.email })
            .then(users => {
                if (users.length > 0) {
                    res.status(statusCodes.user_error).json({
                        message: `User with email ${ data.email } already exists.`
                    })
                } else {
                    Admin.find({ email: data.email })
                        .then(admins => {
                            if(admins.length > 0) {
                                res.status(statusCodes.user_error).json({
                                    message: `Admin with email ${ data.email } already exists.`
                                })
                            } else {
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
                        })
                        .catch(error => {
                            res.status(statusCodes.server_error).json({
                                message: errorMessages.internal,
                                error
                            });
                        });
                }
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal,
                    error
                });
            })
    }
}

exports.softDelete = (req, res) => {
    if(req.params.id) {
        User.find({ _id: req.params.id })
            .then(users => {
                if(users.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('User', req.params.id)
                    })
                } else {
                    User.updateOne(
                        { _id: req.params.id },
                        { active: false }
                    )
                    .then(_ => {
                        res.status(statusCodes.success).json({
                            message: `User ${ users[0].firstname } ${ users[0].lastname } has been deleted.`
                        });
                    })
                    .catch(error => {
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal,
                            error
                        });
                    });
                }
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal,
                    error
                });
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing
        });
    }
}

exports.delete = (req, res) => {
    if(req.params.id) {
        User.find({ _id: req.params.id })
            .then(users => {
                if(users.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('User', req.params.id)
                    })
                } else {
                    User.deleteOne({ _id: req.params.id })
                        .then(_ => {
                            res.status(statusCodes.success).json({
                                message: 'User has been deleted permanently.'
                            });
                        })
                        .catch(error => {
                            if(error.kind === ErrorKind.ID) {
                                res.status(statusCodes.user_error).json({
                                    message: errorMessages.invalid_id(req.params.id)
                                });
                            } else {
                                res.status(statusCodes.server_error).json({
                                    message: errorMessages.internal,
                                    error
                                });
                            }
                        })
                }
            })
            .catch(error => {
                if(error.kind === ErrorKind.ID) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.invalid_id(req.params.id)
                    });
                } else {
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal,
                        error
                    });
                }
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing
        });
    }
}