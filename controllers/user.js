const User = require('../db/models/user');
const Admin = require('../db/models/admin');
const Modification = require('../db/models/modification');

const bcrypt = require('bcrypt');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { generateDate, generateTime } = require('../helpers/timeDate');
const { 
    generateUser, 
    generateCleanModel,
    generateModificationForDb, 
    generateModification
} = require('../helpers/generateModels');

const { ErrorKind } = require('../enums/errorKind');
const { AccountStatus, OnlineStatus } = require('../enums/accountStatus');
const { UserRole } = require('../enums/userRole');
const { ModificationType } = require('../enums/modificationType');

const { parseJwt } = require('../middlewares/common');

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
    const id = req.params.id;

    if(id) {
        User.find({ _id: id, active: true })
            .then(users => {
                if(users.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('User', id)
                    });
                } else {
                    res.status(statusCodes.success).send(generateUser(users[0]));
                }
            })
            .catch(error => {
                if(error.kind === ErrorKind.ID) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.invalid_id(id)
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

exports.edit = (req, res) => {
    const id = req.params.id;

    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    if(id) {
        User.find({ _id: id })
            .then(users => {
                if(users.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('User', id)
                    });
                } else {
                    const modification = generateModificationForDb({
                        cluster: 'User',
                        id,
                        modification: ModificationType.EDITED_USER,
                        modified_by: generateCleanModel(loggedInUser)
                    });

                    const data = { 
                        ...req.body,
                        
                        modified_date: modification.modified_date,
                        modified_by_id: modification.modified_by_id,
                        modified_by: modification.modified_by
                    };

                    User.updateOne(
                        { _id: id },
                        { ...data }
                    )
                    .then(_ => {
                        User.find({ _id: id })
                            .then(newUser => {
                                const updatedUser = generateUser(newUser[0]);

                                Modification.insertMany(modification)
                                    .then(newModification => {
                                        res.status(statusCodes.success).json({
                                            message: `User ${ updatedUser.fullname } has been updated.`,
                                            user: updatedUser,
                                            modification: newModification[0]
                                        });
                                    })
                                    .catch(error => {
                                        console.log(error);
                                        res.status(statusCodes.server_error).json({
                                            message: errorMessages.internal,
                                            error
                                        });
                                    })
                            })
                            .catch(error => {
                                console.log(error);
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
                    })
                    .catch(error => {
                        console.log(error);
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
                console.log(error);
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

exports.softDelete = (req, res) => {
    const id = req.params.id;
    
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);
    
    if(id) {
        User.find({ _id: id, active: true })
            .then(users => {
                if(users.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('User', id)
                    })
                } else {
                    const modification = generateModificationForDb({
                        cluster: 'User',
                        id,
                        modification: ModificationType.SOFT_DELETED_USER,
                        modified_by: generateCleanModel(loggedInUser)
                    });

                    const data = {
                        active: false,
                        deleted_by_id: modification.modified_by_id,
                        deleted_by: modification.modified_by
                    };

                    User.updateOne({ _id: id }, data)
                        .then(_ => {
                            Modification.insertMany(modification)
                                .then(newModification => {
                                    res.status(statusCodes.success).json({
                                        message: `User ${ users[0].firstname } ${ users[0].lastname } has been deleted.`,
                                        modification: generateModification(newModification[0])
                                    });
                                })
                                .catch(error => {
                                    res.status(statusCodes.server_error).json({
                                        message: errorMessages.internal,
                                        error
                                    });
                                });
                        })
                        .catch(error => {
                            if(error.kind === ErrorKind.ID) {
                                res.status(statusCodes.user_error).json({
                                    message: errorMessages.invalid_id(id)
                                });
                            } else {
                                res.status(statusCodes.server_error).json({
                                    message: errorMessages.internal,
                                    error
                                });
                            }
                        });
                }
            })
            .catch(error => {
                if(error.kind === ErrorKind.ID) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.invalid_id(id)
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

exports.recover = (req, res) => {
    const id = req.params.id;

    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    if(id) {
        User.find({ _id: id })
            .then(users => {
                if(users.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('User', id)
                    });
                } else {
                    if(users[0].active) {
                        res.status(statusCodes.user_error).json({
                            message: 'User is already active.'
                        });
                    } else {
                        const modification = generateModificationForDb({
                            cluster: 'User',
                            id,
                            modification: ModificationType.RECOVERED_USER,
                            modified_by: generateCleanModel(loggedInUser)
                        });

                        const data = {
                            active: true,

                            deleted_by: '',
                            deleted_by_id: ''
                        };

                        User.updateOne({ _id: id }, data)
                            .then(_ => {
                                Modification.insertMany(modification)
                                    .then(newModification => {
                                        res.status(statusCodes.success).json({
                                            message: `User ${ generateUser(users[0]).fullname } has been recovered.`,
                                            user: generateUser(users[0]),
                                            modification: generateModification(newModification[0])
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
                                if(error.kind === ErrorKind.ID) {
                                    res.status(statusCodes.user_error).json({
                                        message: errorMessages.invalid_id(id)
                                    });
                                } else {
                                    res.status(statusCodes.server_error).json({
                                        message: errorMessages.internal,
                                        error
                                    });
                                }
                            });
                    }
                }
            })
            .catch(error => {
                if(error.kind === ErrorKind.ID) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.invalid_id(id)
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

exports.delete = (req, res) => {
    const id = req.params.id;

    if(id) {
        User.find({ _id: id })
            .then(users => {
                if(users.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('User', id)
                    });
                } else {
                    User.deleteOne({ _id: id })
                        .then(_ => {
                            res.status(statusCodes.success).json({
                                message: 'User has been deleted permanently.'
                            });
                        })
                        .catch(error => {
                            if(error.kind === ErrorKind.ID) {
                                res.status(statusCodes.user_error).json({
                                    message: errorMessages.invalid_id(id)
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
                        message: errorMessages.invalid_id(id)
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