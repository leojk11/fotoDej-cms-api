const Album = require('../db/models/album');
const Client = require('../db/models/client');
const Image = require('../db/models/image');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { successMessages } = require('../helpers/successMessages');
const { generateAlbum, generateCleanModel } = require('../helpers/generateModels');
const { generateDate, generateTime } = require('../helpers/timeDate');

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

        res.status(statusCodes.success).json({
            page: parseInt(req.query.page),
            total: albumsCount,
            list: albums.map(album => generateAlbum(album))
        });
    } catch (error) {
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
	    }
        
        try {
            const albums = await Album.find(filters);
            if(albums.length === 0) {
                res.status(statusCodes.user_error).json({
                    message: errorMessages.album_not_exist_tr,
                    actual_message: errorMessages.not_exist('Album', id)
                });
            } else {
                res.status(statusCodes.success).send(generateAlbum(albums[0]));
            }
        } catch (error) {
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
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.getAllSoftDeleted = async (req, res) => {
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

        res.status(statusCodes.success).json({
            page: parseInt(req.query.page),
            total: albumsCount,
            list: albums.map(album => generateAlbum(album))
        });
    } catch (error) {
        res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error
        });
    }
}

exports.getAllAssignedTo = async (req, res) => {
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

            res.status(statusCodes.success).json({
                page: parseInt(req.query.page),
                total: albumsCount,
                list: albums.map(album => generateAlbum(album))
            });
        } catch (error) {
            res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error
            });
        }
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

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
                            message: errorMessages.internal_tr,
                            actual_message: errorMessages.internal,
                            error
                        });
                    });
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal_tr,
                    actual_message: errorMessages.internal,
                    error
                });
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

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
                            message: errorMessages.internal_tr,
                            actual_message: errorMessages.internal,
                            error
                        });
                    });
            })
            .catch(error => {
                res.status(statusCodes.server_error).json({
                    message: errorMessages.internal_tr,
                    actual_message: errorMessages.internal,
                    error
                });
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}
// add new
exports.addNew = (req, res) => {
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    const data = {
        ...req.body,

        images: '',
        images_count: 0,
        selected_images: '',
        selected_images_count: 0,

        created_date: generateDate(),
        created_by: JSON.stringify(generateCleanModel(loggedInUser)),
        created_by_id: loggedInUser.id,

        active: true
    };

    if(data.title === '' || !data.title) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.title,
            actual_message: errorMessages.required_field('Title')
        });
    } else if(data.date === '' || !data.date) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field_tr.date,
            actual_message: errorMessages.required_field('Date')
        });
    } else {
        if (data.assigned_to_id) {
            Client.find({  _id: data.assigned_to_id })
                .then(clients => {
                    if (clients.length === 0) {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.client_not_exist_tr,
                            actual_message: errorMessages.not_exist('Client', data.assigned_to_id)
                        });
                    } else {
                        data['assigned_to'] = JSON.stringify(generateCleanModel(clients[0]));

                        Album.insertMany(data)
                            .then(addNewRes => {
                                res.status(statusCodes.success).json({
                                    message: successMessages.album_created_tr,
                                    actual_message: successMessages.album_created,
                                    album: generateAlbum(addNewRes[0])
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
        } else {
            Album.insertMany(data)
                .then(addNewRes => {
                    res.status(statusCodes.success).json({
                        message: successMessages.album_created_tr,
                        actual_message: successMessages.album_created,
                        album: generateAlbum(addNewRes[0])
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
}

exports.edit = (req, res) => {
    const id = req.params.id;

    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    if(id) {
        Album.find({ _id: id, active: true })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.album_not_exist_tr,
                        actual_message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    const data = { 
                        ...req.body,

                        modified_date: generateDate(),
                        modified_time: generateTime(),
                        modified_by_id: loggedInUser.id,
                        modified_by: loggedInUser
                    };

                    if (req.body.assigned_to_id) {
                        Client.find({ _id: req.body.assigned_to_id })
                            .then(clients => {
                                if (clients.length === 0) {
                                    res.status(statusCodes.user_error).json({
                                        message: errorMessages.client_not_exist_tr,
                                        actual_message: errorMessages.not_exist('Client', req.body.assigned_to_id)
                                    });
                                } else {
                                    data['assigned_to'] = generateCleanModel(clients[0]);

                                    Album.updateOne(
                                        { _id: id },
                                        { ...data }
                                    )
                                    .then(_ => {
                                        Album.find({ _id: id })
                                            .then(newAlbum => {
                                                res.status(statusCodes.success).json({
                                                    message: successMessages.album_updated_tr,
                                                    actual_message: successMessages.album_updated,
                                                    album: generateAlbum(newAlbum[0]),
                                                });
                                            })
                                            .catch(error => {
                                                console.log(error);
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
                                    })
                                    .catch(error => {
                                        console.log(error);
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
                                    });
                                }
                            })
                    } else {
                        Album.updateOne(
                            { _id: id },
                            { ...data }
                        )
                        .then(_ => {
                            Album.find({ _id: id })
                                .then(newAlbum => {
                                    res.status(statusCodes.success).json({
                                        message: successMessages.album_updated_tr,
                                        actual_message: successMessages.album_updated,
                                        album: generateAlbum(newAlbum[0])
                                    });
                                })
                                .catch(error => {
                                    console.log(error);
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
                        })
                        .catch(error => {
                            console.log(error);
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
                        });
                    }
                }
            })
            .catch(error => {
                console.log(error);
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

exports.images = (req, res) => {
    const id = req.params.id;

    const images = req.body.images;
    const splittedImages = images.split(',');
    
    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    if(id) {
        if(images) {
            Album.find({ _id: id, active: true })
                .then(albums => {
                    if(albums.length === 0) {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.album_not_exist_tr,
                            actual_message: errorMessages.not_exist('Album', id)
                        });
                    } else {
                        Album.updateOne(
                            { _id: id },
                            { 
                                images: images,
                                images_count: splittedImages.length,

                                modified_date: generateDate(),
                                modified_time: generateTime(),
                                modified_by_id: loggedInUser.id,
                                modified_by: loggedInUser
                            }
                        )
                            .then(_ => {
                                Album.find({ _id: id })
                                    .then(newAlbum => {
                                        res.status(statusCodes.success).json({
                                            message: successMessages.album_images_updated_tr,
                                            actual_message: successMessages.album_images_updated,
                                            album: generateAlbum(newAlbum[0])
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
        } else {
            res.status(statusCodes.user_error).json({
                message: errorMessages.select_images_tr,
                actual_message: errorMessages.select_images
            });
        }
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing_tr,
            actual_message: errorMessages.id_missing
        });
    }
}

exports.selectedImages = (req, res) => {
    const id = req.params.id;

    if(id) {
        Album.find({ _id: id, active: true })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.album_not_exist_tr,
                        actual_message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    const selectedImages = req.body.selected_images;
                    const splittedImages = selectedImages.split(',');

                    if(selectedImages) {
                        Album.updateOne(
                            { _id: id },
                            { 
                                selected_images: selectedImages,
                                selected_images_count: splittedImages.length
                            }
                        )
                        .then(_ => {
                            Album.find({ _id: id })
                                .then(newAlbum => {
                                    res.status(statusCodes.success).json({
                                        message: successMessages.album_images_selected_tr,
                                        actual_message: successMessages.album_images_selected,
                                        album: generateAlbum(newAlbum[0])
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
                            message: errorMessages.select_images_tr,
                            actual_message: errorMessages.select_images
                        });
                    }
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

exports.assignUser = (req, res) => {
    const id = req.params.id;
    const newUser = req.body.user;

    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    if(id) {
        Album.find({ _id: id, active: true })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.album_not_exist_tr,
                        actual_message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    if(newUser) {
                        Client.find({ _id: newUser, active: true })
                            .then(clients => {
                                if(clients.length === 0) {
                                    res.status(statusCodes.user_error).json({
                                        message: errorMessages.client_not_exist_tr,
                                        actual_message: errorMessages.not_exist('Client', id)
                                    });
                                } else {
                                    Album.updateOne(
                                        { _id: id },
                                        { 
                                            assigned_to_id: clients[0]._id,
                                            assigned_to: generateCleanModel(clients[0]),

                                            modified_date: generateDate(),
                                            modified_time: generateTime(),
                                            modified_by_id: loggedInUser.id,
                                            modified_by: loggedInUser
                                        }
                                    )
                                    .then(_ => {
                                        Album.find({ _id: id })
                                            .then(newAlbum => {
                                                res.status(statusCodes.success).json({
                                                    message: 'User has been assigned.',
                                                    album: generateAlbum(newAlbum[0])
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
                    } else {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.required_field_tr.new_user,
                            actual_message: errorMessages.required_field('New user')
                        });
                    }
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

exports.statusChange = (req, res) => {
    const id = req.params.id;
    const status = req.params.status;

    if(id) {
        Album.find({ _id: id })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.album_not_exist_tr,
                        actual_message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    Album.updateOne(
                        { _id: id }, 
                        { active: status }
                    )
                        .then(_ => {
                            res.status(statusCodes.success).json({
                                message: successMessages.album_status_updated_tr,
                                actual_message: successMessages.album_status_updated
                            });
                        })
                        .catch(error => {
                            console.log(error);
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
                console.log(error)
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

exports.delete = (req, res) => {
    const id = req.params.id;

    if(id) {
        Album.find({ _id: id })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.album_not_exist_tr,
                        actual_message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    Album.deleteOne({ _id: id })
                        .then(_ => {
                            Image.deleteMany({ album_id: id })
                                .then(() => {
                                    res.status(statusCodes.success).json({
                                        message: successMessages.album_deleted_tr,
                                        actual_message: successMessages.album_deleted(generateAlbum(albums[0]))
                                    });
                                })
                                .catch(error => {
                                    if(error.kind === ErrorKind.ID) {
                                        res.status(statusCodes.user_error).json({
                                            message: errorMessages.invalid_id_tr,
                                            actual_message: errorMessages.invalid_id(id)
                                        });
                                    } else {
                                        console.log(error);
                                        res.status(statusCodes.server_error).json({
                                            message: errorMessages.internal_tr,
                                            actual_message: errorMessages.internal,
                                            error
                                        });
                                    }
                                })
                        })
                        .catch(error => {
                            console.log(error);
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
                console.log(error)
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
