const Album = require('../db/models/album');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { generateAlbum, generateCleanModel } = require('../helpers/generateModels');
const { ErrorKind } = require('../enums/errorKind');
const { generateDate } = require('../helpers/timeDate');
const { parseJwt } = require('../middlewares/common');

// get all
exports.getAll = (req, res) => {

    let skip = 0;
    if(parseInt(req.query.page) === 1) {
        skip = 0;
    } else {
        skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
    }

    const filters = { active: true };

    Album.find({ ...filters })
        .sort({ _id: 'asc' })
        .skip(skip)
        .limit(parseInt(req.query.take))
        .then(albums => {
            Album.find({ ...filters })
                .count()
                .then(countRes => {
                    const albumsToSend = [];

                    for(const album of albums) {
                        albumsToSend.push(generateAlbum(album));
                    }

                    res.status(statusCodes.success).json({
                        page: parseInt(req.query.page),
                        total: countRes,
                        list: albumsToSend
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
// get single
exports.getSingle = (req, res) => {
    const id = req.params.id;

    if(id) {
        Album.find({ _id: id })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    if(!albums[0].active) {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.not_exist('Album', id)
                        });
                    } else {
                        res.status(statusCodes.success).send(generateAlbum(albums[0]));
                    }
                }
            })
            .catch(error => {
                if(error.kind === ErrorKind.ID) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.invalid_id(id)
                    })
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
// get all soft deleted
exports.getAllSoftDeleted = (req, res) => {

    let skip = 0;
    if(parseInt(req.query.page) === 1) {
        skip = 0;
    } else {
        skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
    }

    const filters = { active: false };

    Album.find({ ...filters })
        .sort({ _id: 'asc' })
        .skip(skip)
        .limit(parseInt(req.query.take))
        .then(albums => {
            Album.find({ ...filters })
                .count()
                .then(countRes => {
                    const albumsToSend = [];

                    for(const album of albums) {
                        albumsToSend.push(generateAlbum(album));
                    }

                    res.status(statusCodes.success).json({
                        page: parseInt(req.query.page),
                        total: countRes,
                        list: albumsToSend
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
// get all filtered by assigned_to
exports.getAllAssignedTo = (req, res) => {
    const userId = req.params.userId;

    if(userId) {
        let skip = 0;
        if(parseInt(req.query.page) === 1) {
            skip = 0;
        } else {
            skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
        }

        Album.find({ 
            assigned_to_id: userId,
            active: true
        })
            .sort({ _id: 'asc' })
            .skip(skip)
            .limit(parseInt(req.query.take))
            .then(albums => {
                Album.find({
                    assigned_to_id: userId,
                    active: true
                })
                    .count()
                    .then(countRes => {
                        const albumsToSend = [];

                        for(const album of albums) {
                            albumsToSend.push(generateAlbum(album));
                        }
        
                        res.status(statusCodes.success).json({
                            page: parseInt(req.query.page),
                            total: countRes,
                            list: albumsToSend
                        });
                    })
                    .catch(error => {
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal
                        });
                    });
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
                });
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing
        });
    }
}
// get all filtered by assigned_by
exports.getAllAssignedBy = (req, res) => {
    const userId = req.params.userId;

    if(userId) {
        let skip = 0;
        if(parseInt(req.query.page) === 1) {
            skip = 0;
        } else {
            skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
        }

        Album.find({ 
            assigned_by_id: userId,
            active: true
        })
            .sort({ _id: 'asc' })
            .skip(skip)
            .limit(parseInt(req.query.take))
            .then(albums => {
                Album.find({
                    assigned_by_id: userId,
                    active: true
                })
                    .count()
                    .then(countRes => {
                        const albumsToSend = [];

                        for(const album of albums) {
                            albumsToSend.push(generateAlbum(album));
                        }
        
                        res.status(statusCodes.success).json({
                            page: parseInt(req.query.page),
                            total: countRes,
                            list: albumsToSend
                        });
                    })
                    .catch(error => {
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal
                        });
                    });
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
                });
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing
        });
    }
}
// get all fitlered by created_by
exports.getAllCreatedBy = (req, res) => {
    const userId = req.params.userId;

    if(userId) {
        let skip = 0;
        if(parseInt(req.query.page) === 1) {
            skip = 0;
        } else {
            skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
        }

        Album.find({ 
            crated_by_id: userId,
            active: true
        })
            .sort({ _id: 'asc' })
            .skip(skip)
            .limit(parseInt(req.query.take))
            .then(albums => {
                Album.find({
                    crated_by_id: userId,
                    active: true
                })
                    .count()
                    .then(countRes => {
                        const albumsToSend = [];

                        for(const album of albums) {
                            albumsToSend.push(generateAlbum(album));
                        }
        
                        res.status(statusCodes.success).json({
                            page: parseInt(req.query.page),
                            total: countRes,
                            list: albumsToSend
                        });
                    })
                    .catch(error => {
                        res.status(statusCodes.server_error).json({
                            message: errorMessages.internal
                        });
                    });
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal
                });
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing
        });
    }
}
// add new
exports.addNew = (req, res) => {
    const token = req.headers.authorization;

    const data = {
        ...req.body,

        images: '',
        images_count: 0,
        selected_images: '',
        selected_images_count: 0,

        created_date: generateDate(),
        created_by: JSON.stringify(generateCleanModel(parseJwt(token))),
        created_by_id: parseJwt(token)._id,

        active: true
    };

    if(data.title === '' || !data.title) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Title')
        });
    } else {
        Album.insertMany(data)
            .then(addNewRes => {
                res.status(statusCodes.success).json({
                    message: 'Album has been created.',
                    album: generateAlbum(addNewRes[0])
                });
            })
            .catch(error => {
                console.log(error)
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal,
                    error
                });
            })
    }
}
// edit
exports.edit = (req, res) => {
    const id = req.params.id;
    const token = req.headers.authorization;

    if(id) {
        Album.find({ _id: id })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    if(!albums[0].active) {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.not_exist('Album', id)
                        });
                    } else {
                        const data = { ...req.body };
                        
                    }
                }
            })
            .catch(error => {
                if(error.kind === ErrorKind.ID) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.invalid_id(req.params.id)
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
// add images
// edit images
// select images
// edit selected images

// soft delete
// deleted
