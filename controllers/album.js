const Album = require('../db/models/album');
const Client = require('../db/models/client');
const Image = require('../db/models/image');
const Logger = require('../db/models/logger');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { successMessages } = require('../helpers/successMessages');
const { generateAlbum, generateCleanModel } = require('../helpers/generateModels');
const { generateDate, generateTime } = require('../helpers/timeDate');
const { generateSuccessLogger, generateErrorLogger } = require('../helpers/logger');

const { ErrorKind } = require('../enums/errorKind');
const { AdminRole } = require('../enums/adminRole');

const { parseJwt } = require('../middlewares/common');

exports.getAll = async (req, res) => {

    const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

    let skip = 0;
    if(parseInt(req.query.page) === 1) {
        skip = 0;
    } else {
        skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
    }

	const filters = {};

	if (loggedInUser.role !== AdminRole.SUPER_ADMIN) {
		filters.active = true;
	}

    // const filters = { active: true };

    if (req.query.date) {
        filters.date = req.query.date;
    }
    if (req.query.title) {
        filters.title = { $regex: req.query.title, $options: 'i' };
    }

    try {
        const albums = await Album.find(filters).sort({ _id: 'desc' })
            .skip(skip).limit(parseInt(req.query.take));
        const albumsCount = await Album.find().count();

        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));

        res.status(statusCodes.success).json({
            page: parseInt(req.query.page),
            total: albumsCount,
            list: albums.map(album => generateAlbum(album))
        });
    } catch (error) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));

        res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error
        });
    }
}

exports.getSingle = async (req, res) => {

    const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

    const id = req.params.id;

    const filters = {};

    if(id) {
        filters._id = id;
        if (loggedInUser.role !== AdminRole.SUPER_ADMIN) {
		    filters.active = true;
	    } // if user is not album get only active albums
        
        try {
            const albums = await Album.find(filters);
            if(albums.length === 0) {
                await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Album', id)));

                res.status(statusCodes.user_error).json({
                    message: errorMessages.album_not_exist_tr,
                    actual_message: errorMessages.not_exist('Album', id)
                });
            } else {
                await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                res.status(statusCodes.success).send(generateAlbum(albums[0]));
            }
        } catch (error) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
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
        }
    } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.getAllSoftDeleted = async (req, res) => {
    const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

    let skip = 0;
    if(parseInt(req.query.page) === 1) {
        skip = 0;
    } else {
        skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
    }

    try {
        const albums = await Album.find({ active: false }).sort({ _id: 'asc' })
            .skip(skip).limit(parseInt(req.query.take));
        const albumsCount = await Album.find({ active: true }).count();

        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).json({
            page: parseInt(req.query.page),
            total: albumsCount,
            list: albums.map(album => generateAlbum(album))
        });
    } catch (error) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error
        });
    }
}

exports.getAllAssignedTo = async (req, res) => {
    const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

    const userId = req.params.userId;

    if(userId) {
        let skip = 0;
        if(parseInt(req.query.page) === 1) {
            skip = 0;
        } else {
            skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
        }

        try {
            const albums = await Album.find({ assigned_to_id: userId, active: true }).sort({ _id: 'asc' })
                .skip(skip).limit(parseInt(req.query.take));
            const albumsCount = await Album.find({ assigned_to_id: userId, active: true }).count();

            await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
            res.status(statusCodes.success).json({
                page: parseInt(req.query.page),
                total: albumsCount,
                list: albums.map(album => generateAlbum(album))
            });
        } catch (error) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
            });
        }
    } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.getAllAssignedBy = async (req, res) => {
    const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

    const userId = req.params.userId;

    if(userId) {
        let skip = 0;
        if(parseInt(req.query.page) === 1) {
            skip = 0;
        } else {
            skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
        }

        try {
            const albums = await Album.find({ 
                assigned_by_id: userId,
                active: true
            }).sort({ _id: 'asc' })
            .skip(skip).limit(parseInt(req.query.take));
            const albumsCount = await Album.find({
                assigned_by_id: userId,
                active: true
            }).count();

            await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
            res.status(statusCodes.success).json({
                page: parseInt(req.query.page),
                total: albumsCount,
                list: albums.map(album => generateAlbum(album))
            });
        } catch (error) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
            });
        }
    } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.getAllCreatedBy = async (req, res) => {
    const userId = req.params.userId;

    if(userId) {
        let skip = 0;
        if(parseInt(req.query.page) === 1) {
            skip = 0;
        } else {
            skip = (parseInt(req.query.take) * parseInt(req.query.page)) - parseInt(req.query.take);
        }

        try {
            const albums = await Album.find({ 
                crated_by_id: userId,
                active: true
            }).sort({ _id: 'asc' })
            .skip(skip).limit(parseInt(req.query.take));
            const albumsCount = await Album.find({
                crated_by_id: userId,
                active: true
            }).count();

            await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
            res.status(statusCodes.success).json({
                page: parseInt(req.query.page),
                total: albumsCount,
                list: albums.map(album => generateAlbum(album))
            });
        } catch (error) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
            });
        }
    } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}
// add new
exports.addNew = async (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const data = {
        ...req.body,

        images: '',
        images_count: 0,
        selected_images: '',
        selected_images_count: 0,

        created_date: generateDate(),
        created_by: generateCleanModel(loggedInUser),
        created_by_id: loggedInUser.id,

        active: true
    };

    if(data.title === '' || !data.title) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('Title')));

        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.title,
            actual_message: errorMessages.required_field('Title')
        });
    } else if(data.date === '' || !data.date) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('Date')));

        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.date,
            actual_message: errorMessages.required_field('Date')
        });
    } else {
        if (data.assigned_to_id) {
            const clients = await Client.find({ _id: data.assigned_to_id });
            if (clients.length === 0) {
                await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Client', data.assigned_to_id)));
                res.status(statusCodes.user_error).json({
                    message: errorMessages.client_not_exist_tr,
                    actual_message: errorMessages.not_exist('Client', data.assigned_to_id)
                });
            } else {
                data['assigned_to'] = JSON.stringify(generateCleanModel(clients[0]));

                try {
                    const albums = await Album.insertMany(data);
                    await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                    res.status(statusCodes.success).json({
                        message: successMessages.album_created_tr,
                        actual_message: successMessages.album_created,
                        album: generateAlbum(albums[0])
                    });
                } catch (error) {
                    await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
                    res.status(statusCodes.server_error).json({
                        message: errorMessages.internal_tr,
                        actual_message: errorMessages.internal,
                        error
                    });
                }
            }
        } else {
            try {
                const albums = await Album.insertMany(data);
                await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                res.status(statusCodes.success).json({
                    message: successMessages.album_created_tr,
                    actual_message: successMessages.album_created,
                    album: generateAlbum(albums[0])
                });
            } catch (error) {
                await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal_tr,
                    actual_message: errorMessages.internal,
                    error
                });
            }
        }
    }
}

exports.edit = async (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const id = req.params.id;

    const data = { 
        ...req.body,

        modified_date: generateDate(),
        modified_time: generateTime(),
        modified_by_id: loggedInUser.id,
        modified_by: loggedInUser
    };

    if(id) {
        const albums = await Album.find({ _id: id, active: true });
        if (albums.length === 0) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Album', id)));
            res.status(statusCodes.user_error).json({
                message: errorMessages.album_not_exist_tr,
                actual_message: errorMessages.not_exist('Album', id)
            });
        } else {
            if (req.body.assigned_to_id) {
                const clients = await Client.find({ _id: req.body.assigned_to_id });
                if (clients.length === 0) {
                    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Client', req.body.assigned_to_id)));
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.client_not_exist_tr,
                        actual_message: errorMessages.not_exist('Client', req.body.assigned_to_id)
                    });
                } else {
                    data['assigned_to'] = generateCleanModel(clients[0]);

                    try {
                        await Album.updateOne({ _id: id }, { ...data });
                        const updatedAlbum = await Album.find({ _id: id });

                        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                        res.status(statusCodes.success).json({
                            message: successMessages.album_updated_tr,
                            actual_message: successMessages.album_updated,
                            album: generateAlbum(updatedAlbum[0]),
                        });
                    } catch (error) {
                        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
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
                    }
                }
            } else {
                try {
                    await Album.updateOne({ _id: id }, { ...data });
                    const updatedAlbum = await Album.find({ _id: id });

                    await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                    res.status(statusCodes.success).json({
                        message: successMessages.album_updated_tr,
                        actual_message: successMessages.album_updated,
                        album: generateAlbum(updatedAlbum[0]),
                    });
                } catch (error) {
                    await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
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
                }
            }
        }
    } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.images = async (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const id = req.params.id;

    const images = req.body.images;
    const splittedImages = images.split(',');

    if(id) {
        if(images) {
            const albums = await Album.find({ _id: id, active: true });
            if (albums.length === 0) {
                await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Album', id)));
                res.status(statusCodes.user_error).json({
                    message: errorMessages.album_not_exist_tr,
                    actual_message: errorMessages.not_exist('Album', id)
                });
            } else {
                try {
                    await Album.updateOne(
                        { _id: id },
                        { 
                            images: images,
                            images_count: splittedImages.length,

                            modified_date: generateDate(),
                            modified_time: generateTime(),
                            modified_by_id: loggedInUser.id,
                            modified_by: loggedInUser
                        }
                    );
                    const updatedAlbum = await Album.find({ _id: id });

                    await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                    res.status(statusCodes.success).json({
                        message: successMessages.album_images_updated_tr,
                        actual_message: successMessages.album_images_updated,
                        album: generateAlbum(updatedAlbum[0])
                    });
                } catch (error) {
                    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(id)));
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
                }
            }
        } else {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.select_images));
            res.status(statusCodes.user_error).json({
                message: errorMessages.select_images_tr,
                actual_message: errorMessages.select_images
            });
        }
    } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.selectedImages = async (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const id = req.params.id;

    const selectedImages = req.body.selected_images;
    const splittedImages = selectedImages.split(',');

    if(id) {
        try {
            const albums = await Album.find({ _id: id, active: true });
            if (albums.length === 0) {
                await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Album', id)));
                res.status(statusCodes.user_error).json({
                    message: errorMessages.album_not_exist_tr,
                    actual_message: errorMessages.not_exist('Album', id)
                });
            } else {
                if (selectedImages) {
                    await Album.updateOne(
                        { _id: id },
                        { 
                            selected_images: selectedImages,
                            selected_images_count: splittedImages.length
                        }
                    );
                    const updatedAlbum = await Album.find({ _id: id, active: true });

                    await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                    res.status(statusCodes.success).json({
                        message: successMessages.album_images_selected_tr,
                        actual_message: successMessages.album_images_selected,
                        album: generateAlbum(updatedAlbum[0])
                    });
                } else {
                    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.select_images));
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.select_images_tr,
                        actual_message: errorMessages.select_images
                    });
                }
            }
        } catch (error) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
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
        }
    } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.assignUser = async (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const id = req.params.id;
    const newUser = req.body.user;

    if(id) {
        try {
            const albums = await Album.find({ _id: id, active: true });
            if (albums.length === 0) {
                await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Album', id)));
                res.status(statusCodes.user_error).json({
                    message: errorMessages.album_not_exist_tr,
                    actual_message: errorMessages.not_exist('Album', id)
                });
            } else {
                if(newUser) {
                    const clients = await Client.find({ _id: newUser, active: true });
                    if (clients.length === 0) {
                        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Client', id)));
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.client_not_exist_tr,
                            actual_message: errorMessages.not_exist('Client', id)
                        });
                    } else {
                        await Album.updateOne(
                            { _id: id },
                            { 
                                assigned_to_id: clients[0]._id,
                                assigned_to: generateCleanModel(clients[0]),

                                modified_date: generateDate(),
                                modified_time: generateTime(),
                                modified_by_id: loggedInUser.id,
                                modified_by: loggedInUser
                            }
                        );
                        const updatedAlbum = await Album.find({ _id: id, active: true });

                        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                        res.status(statusCodes.success).json({
                            message: 'User has been assigned.',
                            album: generateAlbum(updatedAlbum[0])
                        });
                    }
                } else {
                    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('New user')));
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.required_field_tr.new_user,
                        actual_message: errorMessages.required_field('New user')
                    });
                }
            }
        } catch (error) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
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
        }
    } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.statusChange = async (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const id = req.params.id;

    const status = req.params.status;

    if(id) {
        try {
            const albums = await Album.find({ _id: id });
            if (albums.length === 0) {
                await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Album', id)));
                res.status(statusCodes.user_error).json({
                    message: errorMessages.album_not_exist_tr,
                    actual_message: errorMessages.not_exist('Album', id)
                });
            } else {
                await Album.updateOne(
                    { _id: id }, 
                    { active: status }
                );
                const updatedAlbum = await Album.find({ _id: id });

                await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                res.status(statusCodes.success).json({
                    message: successMessages.album_status_updated_tr,
                    actual_message: successMessages.album_status_updated,
                    album: generateAlbum(updatedAlbum[0])
                });
            }
        } catch (error) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
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
        }
    } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.delete = async (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const id = req.params.id;

    if(id) {
        try {
            const albums = await Album.find({ _id: id });
            if (albums.length === 0) {
                await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Album', id)));
                res.status(statusCodes.user_error).json({
                    message: errorMessages.album_not_exist_tr,
                    actual_message: errorMessages.not_exist('Album', id)
                });
            } else {
                await Album.deleteOne({ _id: id });
                await Image.deleteMany({ album_id: id });

                await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
                res.status(statusCodes.success).json({
                    message: successMessages.album_deleted_tr,
                    actual_message: successMessages.album_deleted(generateAlbum(albums[0]))
                });
            }
        } catch (error) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
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
        }
    } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.id_missing));
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}
