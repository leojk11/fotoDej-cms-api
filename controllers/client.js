const Client = require('../db/models/client');
const Modification = require('../db/models/modification');

const bcrypt = require('bcrypt');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { 
    generateClient, 
    generateCleanModel, 
    generateModificationForDb,
    generateModification 
} = require('../helpers/generateModels');
const { generateDate, generateTime } = require('../helpers/timeDate');

const { ErrorKind } = require('../enums/errorKind');
const { AccountStatus } = require('../enums/accountStatus');
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

    Client.find({ ...filters })
        .sort({ _id: 'asc' })
        .skip(skip)
        .limit(parseInt(req.query.take))
        .then(clients => {
            Client.find({ ...filters })
                .count()
                .then(countRes => {
                    const clientsToSend = [];

                    for(const client of clients) {
                        clientsToSend.push(generateClient(client));
                    }

                    res.status(statusCodes.success).json({
                        page: parseInt(req.query.page),
                        total: countRes,
                        list: clientsToSend
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
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal,
                error
            });
        })
}

exports.getSoftDeletedClients = (req, res) => {

    let skip = 0;
    if(parseInt(req.query.page) === 1) {
        skip = 0;
    } else {
        skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
    }

    const filters = { active: false };

    Client.find({ ...filters })
        .sort({ _id: 'asc' })
        .skip(skip)
        .limit(parseInt(req.query.take))
        .then(clients => {
            Client.find({ ...filters })
                .count()
                .then(countRes => {
                    const clientsToSend = [];

                    for(const client of clients) {
                        clientsToSend.push(generateClient(client));
                    }

                    res.status(statusCodes.success).json({
                        page: parseInt(req.query.page),
                        total: countRes,
                        list: clientsToSend
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
        Client.find({ _id: id, active: true })
            .then(clients => {
                if(clients.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Client', id)
                    });
                } else {
                    res.status(statusCodes.success).send(generateClient(clients[0]));
                }
            })
            .catch(error => {
                if(error.kind === ErrorKind.ID) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.invalid_id(id)
                    });
                } else {
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal
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
    const token = req.headers.authorization;

    const data = { 
        ...req.body,
        number_of_albums: 0,
        active: true,
        account_status: AccountStatus.ACTIVE,

        created_date: generateDate(),
        created_time: generateTime(),

        created_by: JSON.stringify(generateCleanModel(parseJwt(token)))
    };

    if(data.firstname === '' || !data.firstname) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Firstname')
        })
    } else if(data.lastname === '' || !data.lastname) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Lastname')
        })
    } else if(data.username === '' || !data.username) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Username')
        })
    } else if(data.phone_number === '' || !data.phone_number) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Phone number')
        })
    } else if(data.email === '' || !data.email) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Email')
        })
    } else if(data.password === '' || !data.password) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Password')
        })
    } else {
        Client.find({ email: data.email })
            .then(clients => {
                if(clients.length > 0) {
                    res.status(statusCodes.user_error).json({
                        message: `User with email ${ data.email } already exists.`
                    })
                } else {
                    data['password'] = bcrypt.hashSync(req.body.password, 10);

                    Client.insertMany({ ...data })
                        .then(_ => {
                            Client.find({ email: data.email })
                                .then(newClient => {
                                    res.status(statusCodes.success).json({
                                        message: 'Client has been added.',
                                        client: generateClient(newClient[0])
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
                            res.status(statusCodes.server_error).json({
                                message: errorMessages.internal,
                                error
                            });
                        });
                }
            })
            .catch(error => {
                console.log(error);
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
        Client.find({ _id: id, active: true })
            .then(clients => {
                if(clients.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Client', id)
                    });
                } else {
                    const modification = generateModificationForDb({
                        cluster: 'Client',
                        id,
                        modification: ModificationType.EDITED_CLIENT,
                        modified_by: generateCleanModel(loggedInUser)
                    });

                    const data = { 
                        ...req.body,
                        
                        modified_date: modification.modified_date,
                        modified_by: modification.modified_by,
                        modified_by_id: modification.modified_by_id
                    };

                    Client.updateOne(
                        { _id: id },
                        { ...data }
                    )
                    .then(_ => {
                        Client.find({ _id: id })
                            .then(newClient => {
                                Modification.insertMany(modification)
                                    .then(() => {
                                        res.status(statusCodes.success).json({
                                            message: `User has been updated`,
                                            client: generateClient(newClient[0])
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
        Client.find({ _id: id })
            .then(clients => {
                if(clients.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Client', id)
                    });
                } else {
                    const modification = generateModificationForDb({
                        cluster: 'Client',
                        id,
                        modification: ModificationType.SOFT_DELETED_CLIENT,
                        modified_by: generateCleanModel(loggedInUser)
                    });

                    Client.updateOne(
                        { _id: id },
                        { 
                            active: false,
                            deleted_by: JSON.stringify(generateCleanModel(loggedInUser))
                        }
                    )
                    .then(_ => {
                        Modification.insertMany(modification)
                            .then(newModification => {
                                res.status(statusCodes.success).json({
                                    message: `User ${ generateClient(clients[0]).fullname } has been deleted.`,
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

exports.recover = (req, res) => {
    const id = req.params.id;

    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    if(id) {
        Client.find({ _id: id })
            .then(clients => {
                if(clients.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Client', id)
                    });
                } else {
                    if(clients[0].active) {
                        res.status(statusCodes.user_error).json({
                            message: 'User is already active.'
                        });
                    } else {
                        const modification = generateModificationForDb({
                            cluster: 'Client',
                            id,
                            modification: ModificationType.RECOVERED_CLIENT,
                            modified_by: generateCleanModel(loggedInUser)
                        });

                        Client.updateOne(
                            { _id: id },
                            { active: true }
                        )
                        .then(_ => {
                            Modification.insertMany(modification)
                                .then(newModification => {
                                    res.status(statusCodes.success).json({
                                        message: `User ${ generateClient(clients[0]).fullname } has been recovered.`,
                                        user: generateClient(clients[0]),
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
        Client.find({ _id: id })
            .then(clients => {
                if(clients.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Client', id)
                    });
                } else {
                    Client.deleteOne({ _id: id })
                        .then(_ => {
                            res.status(statusCodes.success).json({
                                message: `User ${ generateClient(clients[0]).fullname } has been deleted permanently.`
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
            })
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing
        });
    }
}
