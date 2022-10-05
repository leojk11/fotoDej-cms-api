const Schedule = require('../db/models/schedule');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');

const { generateSchedule } = require('../helpers/generateModels');
const { parseJwt } = require('../middlewares/common');

exports.getAll = (req, res) => {
    if(!req.query.from || !req.query.to) {
        res.status(400).json({
            message: 'Date from and to need to be provided.'
        })
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
                    message: errorMessages.internal
                });
            })
    }
}

exports.getSingle = (req, res) => {
    if (req.params.id) {
        Schedule.find({ _id: req.params.id })
            .then(schedules => {
                res.status(statusCodes.success).send(generateSchedule(schedules[0]));
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
                });
            })
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing
        });
    }
}

exports.getForUser = (req, res) => {
    if(!req.query.from || !req.query.to) {
        res.status(400).json({
            message: 'Date from and to need to be provided.'
        })
    } else {
        Schedule.find({
            date: {
                $gte: req.query.from,
                $lte: req.query.to
            }
        })
            .then(schedules => {
                const schedulesToSend = [];


                for(const schedule of schedules) {
                    if(schedule.user_id === req.params.id) {
                        schedulesToSend.push(generateSchedule(schedule));
                    }
                }

                res.status(statusCodes.success).send(schedulesToSend);
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
                });
            })
    }
}

exports.addNew = (req, res) => {

    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const data = {
        ...req.body,
        user_id: loggedInUser._id
    };

    Schedule.insertMany(data)
        .then(addNewRes => {
            res.status(statusCodes.success).json({
                message: 'Schedule has been added.',
                schedule: generateSchedule(addNewRes[0])
            });
        })
        .catch(error => {
            res.status(statusCodes.server_error).json({
               message: errorMessages.internal
            });
        })
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
                            message: 'Schedule has been updated.',
                            schedule: generateSchedule(schedules[0])
                        });
                    })
                    .catch(error => {
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal
                        });
                    })
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
                });
            })
    } else {
        res.status(statusCodes.user_error).json({
            messsage: errorMessages.id_missing
        });
    }
}

exports.delete = (req, res) => {
    const id = req.params.id;

    if(id) {
        Schedule.deleteOne({ _id: id })
            .then(() => {
                res.status(statusCodes.success).json({
                    message: `Schedule has been deleted.`
                })
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
                })
            })
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing
        });
    }
}
