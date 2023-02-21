const Client = require('../db/models/client');
const Invite = require('../db/models/invite');
const ClientLog = require('../db/models/clientLog');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const fs = require('fs');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { successMessages } = require('../helpers/successMessages');
const { generateClient, generateCleanModel } = require('../helpers/generateModels');
const { generateDate, generateTime } = require('../helpers/timeDate');

const { ErrorKind } = require('../enums/errorKind');
const { AccountStatus } = require('../enums/accountStatus');
const { AdminRole } = require('../enums/adminRole');
const { ClientLogAction } = require('../enums/clientLogAction');

const { parseJwt } = require('../middlewares/common');

exports.getAll = (req, res) => {

	const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

  console.log(loggedInUser);

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

	if (req.query.name) {
		filters.$or = [
			{ firstname: {$regex: req.query.name, $options: 'i'} },
			{ lastname: {$regex: req.query.name, $options: 'i'} }  
		];
	}
	if (req.query.phone_number) {
		filters.phone_number = { $regex: req.query.phone_number, $options: 'i' };
	}
	if (req.params.username) {
		filters.username = { $regex: req.query.username, $options: 'i' };
	}
	if (req.params.email) {
		filters.email = { $regex: req.query.email, $options: 'i' };
	}

	Client.find(filters)
		.sort({ _id: 'desc' })
		.skip(skip)
		.limit(parseInt(req.query.take))
		.then(clients => {
			Client.find(filters)
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
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error: error
          });
        })
		})
		.catch(error => {
			res.status(statusCodes.server_error).json({
				message: errorMessages.internal_tr,
				actual_message: errorMessages.internal,
				error: error
			});
		})
}

exports.getSoftDeletedClients = (req, res) => {

	const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

	if (loggedInUser.role !== AdminRole.SUPER_ADMIN) {
		res.status(statusCodes.user_error).json({
			message: errorMessages.no_permission_tr,
			actual_message: errorMessages.no_permission,
			rolesAllowed: AdminRole.SUPER_ADMIN
		});
	} else {
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
							message: errorMessages.internal_tr,
							actual_message: errorMessages.internal,
							error: error
						});
					})
			})
			.catch(error => {
				res.status(statusCodes.server_error).json({
					message: errorMessages.internal_tr,
					actual_message: errorMessages.internal,
					error: error
				});
			})
	}
}

exports.getSingle = (req, res) => {
	const id = req.params.id;

	if(id) {
		Client.find({ _id: id, active: true })
			.then(clients => {
				if(clients.length === 0) {
					res.status(statusCodes.user_error).json({
						message: errorMessages.client_not_exist_tr,
						actual_message: errorMessages.not_exist('Clients', id)
					});
				} else {
					res.status(statusCodes.success).send(generateClient(clients[0]));
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
						error: error
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

  console.log(loggedInUser);

	const data = { 
		...req.body,
		number_of_albums: 0,
		active: true,
		account_status: AccountStatus.ACTIVE,

		created_date: generateDate(),
		created_time: generateTime(),

		created_by: loggedInUser,
    created_by_id: loggedInUser.id
	};

	if(data.firstname === '' || !data.firstname) {
    res.status(statusCodes.user_error).json({
      message: errorMessages.required_field_tr.firstname,
      actual_message: errorMessages.required_field('firstname')
    });
	} else if(data.lastname === '' || !data.lastname) {
    res.status(statusCodes.user_error).json({
      message: errorMessages.required_field_tr.lastname,
      actual_message: errorMessages.required_field('lastname')
    });
	} else if(data.username === '' || !data.username) {
    res.status(statusCodes.user_error).json({
      message: errorMessages.required_field_tr.username,
      actual_message: errorMessages.required_field('username')
    });
	} else if(data.phone_number === '' || !data.phone_number) {
    res.status(statusCodes.user_error).json({
      message: errorMessages.required_field_tr.phone_number,
      actual_message: errorMessages.required_field('phone_number')
    });
	} else if(data.email === '' || !data.email) {
    res.status(statusCodes.user_error).json({
      message: errorMessages.required_field_tr.email,
      actual_message: errorMessages.required_field('email')
    });
	} else if(data.password === '' || !data.password) {
    res.status(statusCodes.user_error).json({
      message: errorMessages.required_field_tr.password,
      actual_message: errorMessages.required_field('password')
    });
	} else {
    Client.find({ email: data.email })
      .then(clients => {
        if(clients.length > 0) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.user_exist_email_tr,
            actual_message: `User with email [${ data.email }] already exists.`
          });
        } else {
          data['password'] = bcrypt.hashSync(req.body.password, 10);
          data['first_password'] = req.body.password;

          Client.insertMany({ ...data })
            .then(_ => {
              Client.find({ email: data.email })
                .then(newClient => {
                  res.status(statusCodes.success).json({
                    message: successMessages.client_created_tr,
                    actual_message: 'Client has been created.',
                    client: generateClient(newClient[0])
                  });
                })
                .catch(error => {
                  console.log(error);
                  res.status(statusCodes.server_error).json({
                    message: errorMessages.internal_tr,
                    actual_message: errorMessages.internal,
                    error: error
                  });
                })
            })
            .catch(error => {
              console.log(error);
              res.status(statusCodes.server_error).json({
                message: errorMessages.internal_tr,
                actual_message: errorMessages.internal,
                error: error
              });
            });
        }
      })
      .catch(error => {
        console.log(error);
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error: error
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
						message: errorMessages.client_not_exist_tr,
						actual_message: errorMessages.not_exist('Clients', id)
					});
        } else {
          const data = { 
            ...req.body,
              
            modified_date: generateDate(),
            modified_time: generateTime(),
            modified_by: loggedInUser,
            modified_by_id: loggedInUser.id
          };

          Client.updateOne(
            { _id: id },
            { ...data }
          )
            .then(_ => {
              Client.find({ _id: id })
                .then(newClient => {
                  res.status(statusCodes.success).json({
                    message: successMessages.client_updated_tr,
                    actual_message: successMessages.document_updated(id),
                    client: generateClient(newClient[0])
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
                      error: error
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
                  error: error
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
            error: error
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

exports.changeProfileImage = (req, res) => {
  const path = './images/profile_images/';

  const _id = req.params.id;
  const image = req.files.image;

  if (_id) {
    Client.find({ _id })
      .then(clients => {
        if (clients.length === 0) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.client_not_exist_tr,
            actual_message: errorMessages.not_exist('Clients', id)
          });
        } else {
          const client = clients[0];

          if (client.profile_image) {
            fs.unlinkSync(path + client.profile_image);
          }

          const newFileName = clients[0]._id + '_' + image.name;
          image.mv(path + newFileName);

            Client.updateOne(
              { _id },
              { profile_image: newFileName }
            )
            .then(() => {
              client.profile_image = newFileName;

              res.status(statusCodes.success).json({
                message: successMessages.client_profile_image_changed_tr,
                actual_message: 'Image has been changed.',
                client: generateCleanModel(client)
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
                  error: error
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
            error: error
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

exports.changeAccoutStatus = (req, res) => {
  const _id = req.params.id;
  const status = req.params.status;

  const availableStatuses = [];

  for (const [key] of Object.entries(AccountStatus)) {
    availableStatuses.push(key);
  }

  if (_id) {  
    if (status !== AccountStatus.ACTIVE && status !== AccountStatus.SUSPENDED) {
      res.status(statusCodes.user_error).json({
        message: errorMessages.status_not_exist_tr,
        actual_message: errorMessages.status_not_exist
      });
    } else {
      Client.find({ _id })
        .then(clients => {
          if (clients.length === 0) {
            res.status(statusCodes.user_error).json({
              message: errorMessages.client_not_exist_tr,
              actual_message: errorMessages.not_exist('Clients', id)
            });
          } else {
            if (clients[0].account_status === AccountStatus.SUSPENDED && status === AccountStatus.SUSPENDED) {
              res.status(statusCodes.user_error).json({
                message: `Account status ${ AccountStatus.SUSPENDED } can only be changed to ${ AccountStatus.ACTIVE }`
              });
            } else if (clients[0].account_status === AccountStatus.ACTIVE && status === AccountStatus.ACTIVE) {
              res.status(statusCodes.user_error).json({
                message: `Account status ${ AccountStatus.ACTIVE } can only be changed to ${ AccountStatus.SUSPENDED }`
              });
            } else {
              Client.updateOne(
                { _id },
                { account_status: status }
              )
              .then(() => {
                res.status(statusCodes.success).json({
                  message: `Account status has been updated to ${ status }`
                });
              })
              .catch(() => {
                res.status(statusCodes.server_error).json({
                  message: errorMessages.internal_tr,
                  actual_message: errorMessages.internal,
                  error: error
                });
              })
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
              error: error
            });
          }
        })
    }
  } else {
    res.status(statusCodes.user_error).json({
      message: errorMessages.id_missing_tr,
      actual_message: errorMessages.id_missing
    });
  }
}

exports.resetFirstPassword = (req, res) => {
  const _id = req.params.id;
  const data = {
    first_password: req.body.first_password,
    password: req.body.password,
    rePassword: req.body.repeat_password
  };

  if (_id) {
    Client.find({ _id })
      .then(clients => {
        if (clients.length === 0) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.client_not_exist_tr,
            actual_message: errorMessages.not_exist('Clients', id)
          });
        } else {
          if (data.first_password === clients[0].first_password) {
            if (data.password === data.rePassword) {
              const newPassword = bcrypt.hashSync(data.password, 10);

              Client.updateOne(
                { _id },
                { password: newPassword, first_password: null }
              )
              .then(_ => {
                const token = jwt.sign(
                  { ...generateCleanModel(clients[0]) }, 
                  process.env.SECRET,
                  { expiresIn: '1h' }
                );

                const logData = {
                  action: ClientLogAction.ACTIVATE_ACCOUNT,
                  client_id: clients[0]._id,
                  client: generateCleanModel(clients[0]),
                  date: generateDate(),
                  time: generateTime()
                };

                ClientLog.insertMany(logData)
                  .then(() => {
                    res.status(200).json({
                      message: successMessages.logged_in_successfully_tr,
                      actual_message: 'Logged in successfully',
                      token,
                      user: generateCleanModel(clients[0])
                    });
                  })
                  .catch(error => {
                    res.status(statusCodes.server_error).json({
                      message: errorMessages.internal_tr,
                      actual_message: errorMessages.internal,
                      error: error
                    });
                  })
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
                    error: error
                  });
                }
              })
            } else {
              res.status(statusCodes.user_error).json({
                message: errorMessages.passwords_not_match,
                actual_message: 'Passwords do not match'
              });
            }
          } else {
            res.status(statusCodes.user_error).json({
              message: errorMessages.password_not_correct_tr,
              actual_message: errorMessages.password_not_correct
            });
          }
        }
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
            error: error
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

exports.softDelete = (req, res) => {
  const id = req.params.id;

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  if(id) {
    Client.find({ _id: id })
      .then(clients => {
        if(clients.length === 0) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.client_not_exist_tr,
            actual_message: errorMessages.not_exist('Clients', id)
          });
        } else {
          Client.updateOne(
            { _id: id },
            { 
              active: false,
              deleted_by: JSON.stringify(generateCleanModel(loggedInUser))
            }
          )
          .then(_ => {
            res.status(statusCodes.success).json({
              message: successMessages.client_deleted_tr,
              actual_message: successMessages.document_updated(id),
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
                error: error
              });
            }
          });
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
            error: error
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

exports.recover = (req, res) => {
  const id = req.params.id;

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  if(id) {
    Client.find({ _id: id })
      .then(clients => {
        if(clients.length === 0) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.client_not_exist_tr,
            actual_message: errorMessages.not_exist('Clients', id)
          });
        } else {
          if(clients[0].active) {
            res.status(statusCodes.user_error).json({
              message: errorMessages.client_already_active_tr,
              actual_message: errorMessages.client_already_active
            });
          } else {
              Client.updateOne(
                { _id: id },
                { active: true }
              )
              .then(_ => {
                res.status(statusCodes.success).json({
                  message: successMessages.client_recovered_tr,
                  actual_message: successMessages.document_updated(id),
                  user: generateClient(clients[0])
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
                    error: error
                  });
                }
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
            error: error
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

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  if (loggedInUser.role !== AdminRole.SUPER_ADMIN) {
    res.status(statusCodes.user_error).json({
      message: errorMessages.no_permission_tr,
      actual_message: errorMessages.no_permission,
      rolesAllowed: AdminRole.SUPER_ADMIN
    });
  } else {
    const id = req.params.id;
  
    if(id) {
      Client.find({ _id: id })
        .then(clients => {
          if(clients.length === 0) {
            res.status(statusCodes.user_error).json({
              message: errorMessages.client_not_exist_tr,
              actual_message: errorMessages.not_exist('Clients', id)
            });
          } else {
            Client.deleteOne({ _id: id })
              .then(_ => {
                res.status(statusCodes.success).json({
                  message: successMessages.client_deleted_permanently_tr,
                  actual_message: successMessages.document_deleted(id),
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
                    error: error
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
              error: error
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

exports.invite = async(req, res) => {
  const id = req.params.id;
  const email = req.body.email;

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  if (id) {
    Client.find({ _id: id })
      .then(clients => {
        if (clients.length === 0) {
          res.status(statusCodes.user_error).json({
            message: errorMessages.client_not_exist_tr,
            actual_message: errorMessages.not_exist('Clients', id)
          });
        } else {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL,
              pass: process.env.EMAIL_PASSWORD
            }
          });

          const mailOptions = {
            from: 'FotoDej',
            subject: 'Invite!',
            html: `
              <body style="margin: 0px;">
              <div style="max-width: 650px; width: 100%; background-color: #ffffff; padding: 50px; font-family: Open Sans, sans-serif; color: #25476a; font-size: 24px; overflow: hidden;">
                <div>
                  <img 
                    style="width: 120px; height: auto;"
                    src="https://drive.google.com/uc?export=view&id=1bM3l5yEi1OpSUgl5TIKCLlz6bbERacXd">
                </div>
          
                <div style="position: relative; z-index: 2;">
                  <p style="line-height: 91%; margin-top: 50px; margin-bottom: 45px;">
                    Здраво <span style="font-weight: bold;">Бојана</span>,
                  </p>
                  <p style="max-width: 300px; line-height: 100%; margin-bottom: 13px;">
                    Ова се вашите податоци за најава:
                  </p>
                  <div style="line-height: 130%; margin-bottom: 70px;">
                    <p>
                      <span style="font-size: 24px; opacity: 0.7; margin-right: 11px;">емаил:</span>
                      <span style="font-weight: bold; color: #25476a;">${ email ? email : clients[0].email }</span>
                    </p>
                    <p>
                      <span style="font-size: 24px; opacity: 0.7; margin-right: 11px;">лозинка:</span>
                      <span style="font-weight: bold;">${ clients[0].first_password }</span>
                    </p>
                  </div>
                  <p style="max-width: 372px; line-height: 100%;">
                    Кликнете на следниот линк за да се упатите кон најава
                  </p>
                  <a style="background-color: #25476a; width: 197px; height: 44px; border-radius: 10px; box-shadow: 2px 2px 7px -1px rgba(68, 68, 68, 0.3); padding: 0; color: #ffffff; text-decoration: none; line-height: 30px; font-weight: 600; font-size: 20px; margin-top: 23px; transition: 0.3s ease-in-out; padding: 10px 60px;" 
                    href="${ req.headers.origin }"> Најава </a>
                  <p style="font-weight: 600; line-height: 91%; font-size: 15px; margin-top: 75px; margin-bottom: 30px;">
                    Ви благодариме на довербата!</p>
                </div>
                <div style="width: 100%; z-index: 2;">
                  <div style="float: left; display: inline-block; clear: both;">
                    <div style="display: flex; align-items: center; margin-bottom: 4px; transition: 0.3s ease-in-out; cursor: pointer;"
                      onMouseOver="this.style.opacity='0.7'"
                      onMouseOut="this.style.opacity='1'">
                      <div style="font-size: 14px; margin-right: 15px;">
                        <img src="https://drive.google.com/uc?export=view&id=1QE_s0Khk1nfkSBwLa-hUnypWd7LB6fJp">
                      </div>
                      <a style="font-size: 13px; color: #25476a; text-decoration: none; font-weight: 600; line-height: 18px;" 
                        href="tel: 077 123 123">077 123 123</a>
                    </div>
          
                    <div style="display: flex; align-items: center; margin-bottom: 4px; transition: 0.3s ease-in-out; cursor: pointer;"
                      onMouseOver="this.style.opacity='0.7'"
                      onMouseOut="this.style.opacity='1'">
                      <div style="font-size: 14px; margin-right: 15px;">
                        <img src="https://drive.google.com/uc?export=view&id=1sS7AZ3sBTeglrvubtEGCCCeqL3-zeJOu">
                      </div>
                      <a style="font-size: 13px; color: #25476a; text-decoration: none; font-weight: 600; line-height: 18px;"
                        href="mailto:fotodej@gmail.com">fotodej@gmail.com</a>
                    </div>
          
                    <div style="display: flex; align-items: center; margin-bottom: 4px; transition: 0.3s ease-in-out; cursor: pointer;"
                      onMouseOver="this.style.opacity='0.7'"
                      onMouseOut="this.style.opacity='1'">
                      <div style="font-size: 14px; margin-right: 15px;">
                        <img src="https://drive.google.com/uc?export=view&id=11owzBfMBXrHX0j4otpIlARg46zxp0DAs">
                      </div>
                      <a style="font-size: 13px; color: #25476a; text-decoration: none; font-weight: 600; line-height: 18px;"
                        href="#">адреса ул. Улица бр.1</a>
                    </div>
                  </div>
          
                  <div style="float: right; clear: both; display: inline-block;">
                    <img    
                      style="width: 120px;"
                      src="https://drive.google.com/uc?export=view&id=1bM3l5yEi1OpSUgl5TIKCLlz6bbERacXd">
                  </div>
                </div>
              </div>
            </body>
            `
          };

          mailOptions['to'] = email ? email : clients[0].email;

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              res.status(statusCodes.server_error).json({
                message: errorMessages.email_send_error_tr,
                actual_message: errorMessages.email_send_error
              });
            } else {
              const invite = {
                invited_client: generateCleanModel(clients[0]),
                invited_client_id: clients[0]._id,

                invited_by: loggedInUser,
                invited_by_id: loggedInUser.id,

                date: generateDate(),
                time: generateTime()
              };

              Invite.insertMany(invite)
                .then(() => {
                  res.status(statusCodes.success).json({
                    message: successMessages.email_sent_tr,
                    actual_message: successMessages.email_sent
                  });
                })
                .catch(error => {
                  res.status(statusCodes.server_error).json({
                    message: errorMessages.internal_tr,
                    actual_message: errorMessages.internal,
                    error: error
                  });
                })
            }
          });
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
            error: error
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
