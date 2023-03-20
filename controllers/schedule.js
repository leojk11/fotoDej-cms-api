const Schedule = require('../db/models/schedule');
const Location = require('../db/models/location');

const { errorMessages } = require('../helpers/errorMessages');
const { successMessages } = require('../helpers/successMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { ErrorKind } = require('../enums/errorKind');

const { generateSchedule, generateLocation } = require('../helpers/generateModels');
const { parseJwt } = require('../middlewares/common');
const { generateDate, generateTime } = require('../helpers/timeDate');

exports.getAll = (req, res) => {
    if(!req.query.from || !req.query.to) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.dates_need_provided_tr,
            actual_message: errorMessages.dates_need_provided
        });
    } else {
        Schedule.find({
            date: {
                $gte: req.query.from,
                $lte: req.query.to
            }
        })
            .then(schedules => {
                const schedulesToSend = [];

                const groups = schedules.reduce((groups, schedule) => {
                    if (!groups[schedule.date]) {
                        groups[schedule.date] = [];
                    }
                    groups[schedule.date].push(generateSchedule(schedule));
                    return groups;
                }, {});

                const groupArrays = Object.keys(groups).map((date) => {
                    return {
                        date,
                        schedules: groups[date]
                    };
                });

                for(const schedule of schedules) {
                    schedulesToSend.push(generateSchedule(schedule));
                }

                res.status(statusCodes.success).send(groupArrays);
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

exports.getSingle = (req, res) => {
    const _id = req.params.id;

    if (_id) {
        Schedule.find({ _id })
            .then(schedules => {
                res.status(statusCodes.success).send(generateSchedule(schedules[0]));
            })
            .catch(error => {
                if(error.kind === ErrorKind.ID) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.invalid_id_tr,
                        actual_message: errorMessages.invalid_id(_id)
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

exports.getForUserUpcoming = (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    if (req.query.limit) {
        const filters = { user_id: loggedInUser.id };

        Schedule.find(filters)
            .limit(req.query.limit)
            .then(schedules => {
                const schedulesToSend = [];
    
                for(const schedule of schedules) {
                    schedulesToSend.push(generateSchedule(schedule));
                }
    
                res.status(statusCodes.success).send(schedulesToSend);
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal_tr,
                    actual_message: errorMessages.internal,
                    error
                });
            })
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.limit_required_tr,
            actual_message: errorMessages.limit_required
        });
    }
}

exports.getForUser = (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const filters = { user_id: loggedInUser.id };

    if(!req.query.from || !req.query.to) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.dates_need_provided_tr,
            actual_message: errorMessages.dates_need_provided
        });
    } else {
        filters.date = {
            $gte: req.query.from,
            $lte: req.query.to
        }

        if (req.query.title) {
            filters.title = req.query.title;
        }

        Schedule.find(filters)
            .then(schedules => {
                const schedulesToSend = [];

                for(const schedule of schedules) {
                    schedulesToSend.push(generateSchedule(schedule));
                }

                res.status(statusCodes.success).send(schedulesToSend);
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

exports.addNew = (req, res) => {

    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const date = new Date();
    date.setHours(00, 0, 0, 0);

    const data = {
        ...req.body,
        user_id: loggedInUser.id,

        timestamp: date
    };

    // console.log(data);

    if (!data.title || data.title === '') {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.title,
            actual_message: errorMessages.required_field('Title')
        });
    } else if (!data.date || data.date === '') {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.date,
            actual_message: errorMessages.required_field('Date')
        });
    } else {
        Schedule.insertMany(data)
            .then(addNewRes => {
                res.status(statusCodes.success).json({
                    message: successMessages.schedule_created_tr,
                    actual_message: successMessages.schedule_created,
                    schedule: generateSchedule(addNewRes[0])
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
}

exports.edit = (req, res) => {
    const id = req.params.id;

    const data = {
        ...req.body
    };

    if (id) {
        Schedule.updateOne(
            { _id: id },
            { ...data }
        )
            .then(() => {
                Schedule.find({ _id: id })
                    .then(schedules => {
                        res.status(statusCodes.success).json({
                            message: successMessages.schedule_updated_tr,
                            actual_message: successMessages.schedule_updated,
                            schedule: generateSchedule(schedules[0])
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
            actual_messsage: errorMessages.id_missing
        });
    }
}

exports.delete = (req, res) => {
    const id = req.params.id;

    if(id) {
        Schedule.deleteOne({ _id: id })
            .then(() => {
                res.status(statusCodes.success).json({
                    message: successMessages.schedule_deleted_tr,
                    actual_message: successMessages.schedule_deleted
                });
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
            actual_messsage: errorMessages.id_missing
        });
    }
}

// LOCATIONS
exports.getAllLocations = (req, res) => {
    Location.find()
        .then(locations => {
            const locationsTosend = [];

            for (const location of locations) {
                locationsTosend.push(generateLocation(location));
            }

            res.status(statusCodes.success).send(locationsTosend);
        })
        .catch(error => {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
            });
        })
}

exports.getLocationsForSchedule = (req, res) => {
    const scheduleId = req.params.id;

    if (scheduleId) {
        Location.find({ schedule_id: scheduleId })
            .then(locations => {
                const locationsToSend = [];

                for (const location of locations) {
                    locationsToSend.push(generateLocation(location));
                }

                res.status(statusCodes.success).send(locationsToSend);
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
            actual_messsage: errorMessages.id_missing
        });
    }
}

exports.addNewLocation = (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const id = req.params.id;
    const data = { ...req.body };

    if (id) {
        Schedule.find({ _id: id })
            .then(schedules => {
                if (schedules.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.schedule_not_exist_tr,
                        actual_message: errorMessages.not_exist('Schedule', id)
                    });
                } else {
                    const locationData = {
                        title: data.title,
                        place: data.place,

                        date: schedules[0].date,
                        time: data.time,

                        schedule_id: schedules[0].id,
                        schedule: generateSchedule(schedules[0]),
                        user_id: loggedInUser.id,

                        created_by: loggedInUser,
                        created_by_id: loggedInUser.id,
                        created_date: generateDate(),
                        created_time: generateTime()
                    };

                    Location.insertMany(locationData)
                        .then(addNewLocationRes => {
                            res.status(statusCodes.success).json({
                                message: successMessages.location_created_tr,
                                actual_message: successMessages.location_created,
                                location: generateLocation(addNewLocationRes[0])
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
            actual_messsage: errorMessages.id_missing
        });
    }
}

exports.editLocation = (req, res) => {
    const scheduleId = req.params.id;
    const locationId = req.params.location_id;

    if (!scheduleId || !locationId) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.missing_schedule_or_location_tr,
            actual_message: errorMessages.missing_schedule_or_location
        });
    } else {
        Schedule.find({ _id: scheduleId })
            .then(schedules => {
                if (schedules.length === 0) {
                    res.status(statusCodes.not_found).json({
                        message: errorMessages.not_exist('Schedules', scheduleId),
                        actual_message: errorMessages.schedule_not_exist_tr
                    });
                } else {
                    Location.find({ _id: locationId })
                        .then(locations => {
                            if (locations.length === 0) {
                                res.status(statusCodes.not_found).json({
                                    message: errorMessages.location_not_exist_tr,
                                    actual_message: errorMessages.not_exist('Location', locationId)
                                });
                            } else {
                                const data = { ...req.body };

                                Location.updateOne(
                                    { _id: locationId },
                                    data
                                )
                                .then(() => {
                                    res.status(statusCodes.success).json({
                                        message: successMessages.location_updated_tr,
                                        actual_message: successMessages.location_updated
                                    });
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
    }
}

exports.deleteLocation = (req, res) => {
    const scheduleId = req.params.id;
    const locationId = req.params.location_id;

    if (!scheduleId || !locationId) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.missing_schedule_or_location_tr,
            actual_message: errorMessages.missing_schedule_or_location
        });
    } else {
        Schedule.find({ _id: scheduleId })
            .then(schedules => {
                if (schedules.length === 0) {
                    res.status(statusCodes.not_found).json({
                        message: errorMessages.not_exist('Schedules', scheduleId),
                        actual_message: errorMessages.schedule_not_exist_tr
                    });
                } else {
                    Location.find({ _id: locationId })
                        .then(locations => {
                            if (locations.length === 0) {
                                res.status(statusCodes.not_found).json({
                                    message: errorMessages.location_not_exist_tr,
                                    actual_message: errorMessages.not_exist('Location', locationId)
                                });
                            } else {
                                Location.deleteOne({ _id: locationId })
                                    .then(() => {
                                        res.status(statusCodes.success).json({
                                            message: successMessages.location_deleted_tr,
                                            actual_message: successMessages.location_deleted
                                        });
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
    }
}
