const Admin = require('../db/models/admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { generateDate, generateTime } = require('../helpers/timeDate');

const { AdminRole } = require('../enums/adminRole');
const { ErrorKind } = require('../enums/errorKind');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');

const { parseJwt } = require('../middlewares/common');
const { successMessages } = require('../helpers/successMessages');

exports.getAll = (req, res) => {

    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    let skip = 0;
    if(parseInt(req.query.page) === 1) {
        skip = 0;
    } else {
        skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
    }

    const filters = {
        added_by_id: loggedInUser.id
    };

    Admin.find(filters)
        .sort({ _id: 'desc' })
        .skip(skip)
        .limit(parseInt(req.query.take))
        .then(admins => {
            Admin.find(filters)
                .count()
                .then(countRes => {
                    const adminsToSend = [];

                    for(const admin of admins) {
                        adminsToSend.push(admin);
                    }

                    res.status(statusCodes.success).json({
                        page: parseInt(req.query.page),
                        total: countRes,
                        list: adminsToSend
                    });
                })
                .catch(error => {
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal_tr,
                        actual_message: errorMessages.internal,
                        error
                    });
                })
        })
        .catch(error => {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
            });
        })
}

exports.getSingle = (req, res) => {
    const _id = req.params.id;

    if (_id) {
        Admin.find({ _id })
            .then(admins => {
                if (admins.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Admin', id)
                    });
                } else {
                    res.status(statusCodes.success).send(admins[0]);
                }
            })
            .catch(error => {
                if(error.kind === ErrorKind.ID) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.invalid_id_tr,
                        actual_message: errorMessages.invalid_id(id)
                    });
                } else {
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal_tr,
                        actual_message: errorMessages.internal,
                        error
                    });
                }
            })
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.addNew = (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    if (loggedInUser.role !== AdminRole.SUPER_ADMIN) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.no_permission_tr,
            actual_message: errorMessages.no_permission,
            rolesAllowed: AdminRole.SUPER_ADMIN
        });
    } else {
        const data = { 
            ...req.body,

            added_by: loggedInUser,
            added_by_id: loggedInUser.id,

            role: AdminRole.ADMIN,

            date_added: generateDate(),
            time_added: generateTime()
        };

        if (!data.firstname || data.firstname === '') {
            res.status(statusCodes.user_error).json({
                message: errorMessages.required_field_tr.firstname,
                actual_message: errorMessages.required_field('Firstname')
            });
        } else if (!data.lastname || data.lastname === '') {
            res.status(statusCodes.user_error).json({
                message: errorMessages.required_field_tr.lastname,
                actual_message: errorMessages.required_field('Lastname')
            });
        } else if (!data.email || data.email === '') {
            res.status(statusCodes.user_error).json({
                message: errorMessages.required_field_tr.email,
                actual_message: errorMessages.required_field('Email')
            });
        } else if (!data.phone_number || data.phone_number === '') {
            res.status(statusCodes.user_error).json({
                message: errorMessages.required_field_tr.phone_number,
                actual_message: errorMessages.required_field('Phone number')
            });
        } else if (!data.password || data.password === '') {
            res.status(statusCodes.user_error).json({
                message: errorMessages.required_field_tr.password,
                actual_message: errorMessages.required_field('Password')
            });
        } else {
            Admin.find({ email: data.email })
                .then(admins => {
                    if (admins.length > 0) {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.admin_exist_email_tr,
                            actual_message: `Admin with email ${ data.email } already exists.`
                        });
                    } else {
                        data.password = bcrypt.hashSync(data.password, 10);

                        Admin.insertMany({ ...data })
                            .then(_ => {
                                res.status(statusCodes.success).json({
                                    message: successMessages.admin_created_tr,
                                    actual_message: successMessages.admin_crated
                                });
                            })
                            .catch(error => {
                                res.status(statusCodes.server_error).json({
                                    message: errorMessages.internal_tr,
                                    actual_message: errorMessages.internal,
                                    error
                                });
                            });
                    }
                })
                .catch(error => {
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal_tr,
                        actual_message: errorMessages.internal,
                        error
                    });
                })
        }
    }
}

exports.edit = (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    if (loggedInUser.role !== AdminRole.SUPER_ADMIN) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.no_permission_tr,
            actual_message: errorMessages.no_permission,
            rolesAllowed: AdminRole.SUPER_ADMIN
        });
    } else {
        const _id = req.params.id;

        if (_id) {
            const data = {
                ...req.body,

                modified_by: loggedInUser,
                modified_by_id: loggedInUser.id,

                modified_date: generateDate(),
                modified_time: generateTime()
            };

            Admin.find({ _id })
                .then(admins => {
                    if (admins.length === 0) {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.admin_not_exist_tr,
                            actual_message: errorMessages.not_exist('Admin', _id)
                        });
                    } else {
                        Admin.updateOne({ _id }, data)
                            .then(() => {
                                Admin.find({ _id })
                                    .then(newAdmins => {
                                        res.status(statusCodes.success).json({
                                            message: 'User has been updated.',
                                            user: newAdmins[0]
                                        });
                                    })
                                    .catch(error => {
                                        res.status(statusCodes.server_error).json({
                                            message: errorMessages.internal_tr,
                                            actual_message: errorMessages.internal,
                                            error
                                        });
                                    })
                            })
                            .catch(error => {
                                res.status(statusCodes.server_error).json({
                                    message: errorMessages.internal_tr,
                                    actual_message: errorMessages.internal,
                                    error
                                });
                            })
                    }
                })
                .catch(error => {
                    if(error.kind === ErrorKind.ID) {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.invalid_id_tr,
                            actual_message: errorMessages.invalid_id(id)
                        });
                    } else {
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal_tr,
                            actual_message: errorMessages.internal,
                            error
                        });
                    }
                })
        } else {
            res.status(statusCodes.user_error).json({
                message: errorMessages.id_missing_tr,
                actual_message: errorMessages.id_missing
            });
        }
    }
}

exports.delete = (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    if (loggedInUser.role !== AdminRole.SUPER_ADMIN) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.no_permission_tr,
            actual_message: errorMessages.no_permission,
            rolesAllowed: AdminRole.SUPER_ADMIN
        });
    } else {
        const _id = req.params.id;

        if (_id) {
            Admin.find({ _id })
                .then(admins => {
                    if (admins.length === 0) {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.admin_not_exist_tr,
                            actual_message: errorMessages.not_exist('Admin', id)
                        });
                    } else {
                        Admin.deleteOne({ _id })
                            .then(() => {
                                res.status(statusCodes).json({
                                    message: successMessages.admin_deleted_tr,
                                    actual_message: successMessages.admin_deleted
                                });
                            })
                            .catch(error => {
                                res.status(statusCodes.server_error).json({
                                    message: errorMessages.internal_tr,
                                    actual_message: errorMessages.internal,
                                    error
                                });
                            })
                    }
                })
                .catch(error => {
                    if(error.kind === ErrorKind.ID) {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.invalid_id_tr,
                            actual_message: errorMessages.invalid_id(id)
                        });
                    } else {
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal_tr,
                            actual_message: errorMessages.internal,
                            error
                        });
                    }
                })

        } else {
            res.status(statusCodes.user_error).json({
                message: errorMessages.id_missing_tr,
                actual_message: errorMessages.id_missing
            });
        }
    }
}