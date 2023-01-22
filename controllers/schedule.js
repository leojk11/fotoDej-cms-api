const Schedule = require('../db/models/schedule');

const { errorMessages } = require('../helpers/errorMessages');
const { successMessages } = require('../helpers/successMessages');
const { statusCodes } = require('../helpers/statusCodes');
const { ErrorKind } = require('../enums/errorKind');

const { generateSchedule } = require('../helpers/generateModels');
const { parseJwt } = require('../middlewares/common');

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

exports.getForUser = (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const filters = {};

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
                    // if(schedule.user_id === req.params.id) {
                        schedulesToSend.push(generateSchedule(schedule));
                    // }
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

    const data = {
        ...req.body,
        user_id: loggedInUser.id
    };

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
