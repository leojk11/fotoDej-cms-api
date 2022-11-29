const Album = require('../db/models/album');
const Client = require('../db/models/client');
const Modification = require('../db/models/modification');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { 
    generateAlbum, 
    generateCleanModel,
    generateModification,
    generateModificationForDb
} = require('../helpers/generateModels');
const { generateDate } = require('../helpers/timeDate');

const { ErrorKind } = require('../enums/errorKind');
const { ModificationType } = require('../enums/modificationType');

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

    if (req.query.date) {
        filters.date = req.query.date;
    }
    if (req.query.title) {
        filters.title = { $regex: req.query.title, $options: 'i' };
    }

    Album.find(filters)
        .sort({ _id: 'desc' })
        .skip(skip)
        .limit(parseInt(req.query.take))
        .then(albums => {
            Album.find(filters)
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
        })
}
// get single
exports.getSingle = (req, res) => {
    const id = req.params.id;

    if(id) {
        Album.find({ _id: id, active: true })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    res.status(statusCodes.success).send(generateAlbum(albums[0]));
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
    const loggedInUser = parseJwt(token);

    const data = {
        ...req.body,

        images: '',
        images_count: 0,
        selected_images: '',
        selected_images_count: 0,

        created_date: generateDate(),
        created_by: JSON.stringify(generateCleanModel(loggedInUser)),
        created_by_id: loggedInUser._id,

        active: true
    };

    if(data.title === '' || !data.title) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Title')
        });
    } else if(data.date === '' || !data.date) {
        res.status(statusCodes.user_error).json({
            message: errorMessages.required_field('Date')
        });
    } else {
        if (data.assigned_to_id) {
            Client.find({  _id: data.assigned_to_id })
                .then(clients => {
                    if (clients.length === 0) {
                        res.status(statusCodes.user_error).json({
                            message: errorMessages.not_exist('Client', data.assigned_to_id)
                        });
                    } else {
                        data['assigned_to'] = JSON.stringify(generateCleanModel(clients[0]));

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
                })
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
}
// edit
exports.edit = (req, res) => {
    const id = req.params.id;

    const token = req.headers.authorization;
    const loggedInUser = parseJwt(token);

    console.log('body', req.body);

    if(id) {
        Album.find({ _id: id, active: true })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    const modification = generateModificationForDb({
                        cluster: 'Album',
                        id,
                        modification: ModificationType.EDITED_ALBUM,
                        modified_by: generateCleanModel(loggedInUser)
                    });

                    const data = { 
                        ...req.body,

                        modified_date: modification.modified_date,
                        modified_by_id: modification.modified_by_id,
                        modified_by: JSON.stringify(generateCleanModel(loggedInUser))
                    };

                    if (req.body.assigned_to_id) {
                        Client.find({ _id: req.body.assigned_to_id })
                            .then(clients => {
                                if (clients.length === 0) {
                                    res.status(statusCodes.user_error).json({
                                        message: errorMessages.not_exist('Client', req.body.assigned_to_id)
                                    });
                                } else {
                                    data['assigned_to'] = JSON.stringify(generateCleanModel(clients[0]))

                                    Album.updateOne(
                                        { _id: id },
                                        { ...data }
                                    )
                                    .then(_ => {
                                        Album.find({ _id: id })
                                            .then(newAlbum => {
                                                Modification.insertMany(modification)
                                                    .then(newModification => {
                                                        res.status(statusCodes.success).json({
                                                            message: 'Album has been updated.',
                                                            album: generateAlbum(newAlbum[0]),
                                                            modification: generateModification(newModification[0])
                                                        });
                                                    })
                                                    .catch(error => {
                                                        res.status(statusCodes.server_error).json({
                                                            message: errorMessages.internal
                                                        });
                                                    })
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
                                    Modification.insertMany(modification)
                                        .then(newModification => {
                                            res.status(statusCodes.success).json({
                                                message: 'Album has been updated.',
                                                album: generateAlbum(newAlbum[0]),
                                                modification: generateModification(newModification[0])
                                            });
                                        })
                                        .catch(error => {
                                            res.status(statusCodes.server_error).json({
                                                message: errorMessages.internal
                                            });
                                        })
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
                        });
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
// add/edit images
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
                        res.status(statusCodes.user_error).then({
                            message: errorMessages.not_exist('Album', id)
                        });
                    } else {
                        const modification = generateModificationForDb({
                            cluster: 'Album',
                            id,
                            modification: ModificationType.ADDED_IMAGES,
                            modified_by: generateCleanModel(loggedInUser),
                            before_modification_value: JSON.stringify(albums[0]),
                            modified_field: 'images'
                        });

                        Album.updateOne(
                            { _id: id },
                            { 
                                images: images,
                                images_count: splittedImages.length,

                                modified_date: modification.modified_date,
                                modified_by_id: modification.modified_by_id,
                                modified_by: JSON.stringify(generateCleanModel(loggedInUser))
                            }
                        )
                            .then(_ => {
                                Album.find({ _id: id })
                                    .then(newAlbum => {
                                        Modification.insertMany(modification)
                                            .then(newModification => {
                                                res.status(statusCodes.success).json({
                                                    message: 'Images have been updated.',
                                                    album: generateAlbum(newAlbum[0]),
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
                                        console.log(error);
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
                                console.log(error);
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
                    console.log(error);
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
                message: 'Please select images.'
            });
        }
    } else {
        res.status(statusCodes.user_error).json({
            message: errorMessages.id_missing
        });
    }
}
// select/edit selected images
exports.selectedImages = (req, res) => {
    const id = req.params.id;

    if(id) {
        Album.find({ _id: id, active: true })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Album', id)
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
                                        message: 'Images have been selected.',
                                        album: generateAlbum(newAlbum[0])
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
                            message: 'Please select images.'
                        });
                    }
                }
            })
            .catch(error => {
                console.log(error);
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
// assign/reasign to other user
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
                        message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    if(newUser) {
                        Client.find({ _id: newUser, active: true })
                            .then(clients => {
                                if(clients.length === 0) {
                                    res.status(statusCodes.user_error).json({
                                        message: errorMessages.not_exist('User', id)
                                    });
                                } else {
                                    const modification = generateModificationForDb({
                                        cluster: 'Album',
                                        id,
                                        modification: ModificationType.ASSIGNED_ALBUM,
                                        modified_by: generateCleanModel(loggedInUser)
                                    });

                                    Album.updateOne(
                                        { _id: id },
                                        { 
                                            assigned_to_id: clients[0]._id,
                                            assigned_to: JSON.stringify(generateCleanModel(clients[0])),

                                            modified_date: generateDate(),
                                            modified_by_id: loggedInUser._id,
                                            modified_by: JSON.stringify(generateCleanModel(loggedInUser))
                                        }
                                    )
                                    .then(_ => {
                                        Album.find({ _id: id })
                                            .then(newAlbum => {
                                                Modification.insertMany(modification)
                                                    .then(newModification => {
                                                        res.status(statusCodes.success).json({
                                                            message: 'User has been assigned.',
                                                            album: generateAlbum(newAlbum[0]),
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
                                                console.log(error);
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
                                        console.log(error);
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
                                console.log(error);
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
                            message: errorMessages.required_field('New user')
                        });
                    }
                }
            })
            .catch(error => {
                console.log(error);
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

// deleted
exports.delete = (req, res) => {
    const id = req.params.id;

    if(id) {
        Album.find({ _id: id })
            .then(albums => {
                if(albums.length === 0) {
                    res.status(statusCodes.user_error).json({
                        message: errorMessages.not_exist('Album', id)
                    });
                } else {
                    Album.deleteOne({ _id: id })
                        .then(_ => {
                            res.status(statusCodes.success).json({
                                message: `Album ${ generateAlbum(albums[0]).title } has been deleted permanently.`
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
