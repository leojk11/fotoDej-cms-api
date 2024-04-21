const Client = require('../db/models/client');
const Invite = require('../db/models/invite');
const ClientLog = require('../db/models/clientLog');
const Logger = require('../db/models/logger');
const FeConfiguration = require('../db/models/feConfiguration');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const fs = require('fs');

const { statusCodes } = require('../helpers/statusCodes');
const { errorMessages } = require('../helpers/errorMessages');
const { successMessages } = require('../helpers/successMessages');
const { generateClient, generateCleanModel } = require('../helpers/generateModels');
const { generateDate, generateTime } = require('../helpers/timeDate');
const { insertNotificaton } = require('../helpers/notificationTools');
const { generateSuccessLogger, generateErrorLogger } = require('../helpers/logger');

const { ErrorKind } = require('../enums/errorKind');
const { AccountStatus } = require('../enums/accountStatus');
const { AdminRole } = require('../enums/adminRole');
const { ClientLogAction } = require('../enums/clientLogAction');
const { InviteStatus } = require('../enums/inviteStatus');
const { NotificationType } = require('../enums/notificationType');

const { parseJwt } = require('../middlewares/common');

exports.getAll = async(req, res) => {
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

	if (req.query.name) {
		filters.$or = [
			{ firstname: {$regex: req.query.name, $options: 'i'} },
			{ lastname: {$regex: req.query.name, $options: 'i'} }  
		];
	}
	if (req.query.phone_number) {
		filters.phone_number = { $regex: req.query.phone_number, $options: 'i' };
	}
	if (req.query.username) {
		filters.username = { $regex: req.query.username, $options: 'i' };
	}
	if (req.query.email) {
		filters.email = { $regex: req.query.email, $options: 'i' };
	}
  if (req.query.status) {
    if(req.query.status !== AccountStatus.ACTIVE && req.query.status !== AccountStatus.SUSPENDED) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_account_status));
      res.status(statusCodes.user_error).json({
        message: errorMessages.invalid_account_status_tr,
        actual_message: errorMessages.invalid_account_status
      });

      return;
    }
    filters.account_status = req.query.status;
  }

  try {
    const clients = await Client.find(filters).sort({ _id: 'asc' }).skip(skip).limit(parseInt(req.query.take));
    const clientsCount = await Client.find(filters).count();

    await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
    res.status(statusCodes.success).json({
      page: parseInt(req.query.page),
      total: clientsCount,
      list: clients.map(client => generateClient(client))
    });
  } catch (error) {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
    res.status(statusCodes.server_error).json({
      message: errorMessages.internal_tr,
      actual_message: errorMessages.internal,
      error: error
    });
  }
}

exports.getSoftDeletedClients = async(req, res) => {
	const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

	if (loggedInUser.role !== AdminRole.SUPER_ADMIN) {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.no_permission));
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
    try {
      const clients = await Client.find(filters).sort({ _id: 'asc' }).skip(skip).limit(parseInt(req.query.take));
      const clientsCount = await Client.find(filters).count();
  
      await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
      res.status(statusCodes.success).json({
        page: parseInt(req.query.page),
        total: clientsCount,
        list: clients.map(client => generateClient(client))
      });
    } catch (error) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
      res.status(statusCodes.server_error).json({
        message: errorMessages.internal_tr,
        actual_message: errorMessages.internal,
        error: error
      });
    }
	}
}

exports.getSingle = async(req, res) => {
  const token = req.headers.authorization;
	const loggedInUser = parseJwt(token);

	const id = req.params.id;

	if(id) {
    try {
      const clients = await Client.find({ _id: id, active: true });
      if (clients.length === 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Clients', id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.client_not_exist_tr,
          actual_message: errorMessages.not_exist('Clients', id)
        });
      } else {
        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).send(generateClient(clients[0]));
      }
    } catch (error) {
      if(error.kind === ErrorKind.ID) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.invalid_id_tr,
          actual_message: errorMessages.invalid_id(id)
        });
      } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error: error
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

exports.addNew = async(req, res) => {

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

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

  try {
    if(data.firstname === '' || !data.firstname) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('firstname')));
      res.status(statusCodes.user_error).json({
        message: errorMessages.required_field_tr.firstname,
        actual_message: errorMessages.required_field('firstname')
      });
    } else if(data.lastname === '' || !data.lastname) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('lastname')));
      res.status(statusCodes.user_error).json({
        message: errorMessages.required_field_tr.lastname,
        actual_message: errorMessages.required_field('lastname')
      });
    } else if(data.username === '' || !data.username) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('username')));
      res.status(statusCodes.user_error).json({
        message: errorMessages.required_field_tr.username,
        actual_message: errorMessages.required_field('username')
      });
    } else if(data.phone_number === '' || !data.phone_number) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('phone_number')));
      res.status(statusCodes.user_error).json({
        message: errorMessages.required_field_tr.phone_number,
        actual_message: errorMessages.required_field('phone_number')
      });
    } else if(data.email === '' || !data.email) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('email')));
      res.status(statusCodes.user_error).json({
        message: errorMessages.required_field_tr.email,
        actual_message: errorMessages.required_field('email')
      });
    } else if(data.password === '' || !data.password) {
      await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.required_field('password')));
      res.status(statusCodes.user_error).json({
        message: errorMessages.required_field_tr.password,
        actual_message: errorMessages.required_field('password')
      });
    } else {
      const clientsByEmail = await Client.find({ email: data.email });
      if (clientsByEmail.length > 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, `User with email [${ data.email }] already exists.`));
        res.status(statusCodes.user_error).json({
          message: errorMessages.user_exist_email_tr,
          actual_message: `User with email [${ data.email }] already exists.`
        });
      } else {
        data['password'] = bcrypt.hashSync(req.body.password, 10);
        data['first_password'] = req.body.password;

        await Client.insertMany(data);
        const newClient = await Client.find({ email: data.email });

        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).json({
          message: successMessages.client_created_tr,
          actual_message: 'Client has been created.',
          client: generateClient(newClient[0])
        });
      }
    }
  } catch (error) {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
    res.status(statusCodes.server_error).json({
      message: errorMessages.internal_tr,
      actual_message: errorMessages.internal,
      error: error
    });
  }
}

exports.edit = async(req, res) => {
  const id = req.params.id;
		
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  if(id) {
    try {
      const clients = await Client.find({ _id: id, active: true });
      if (clients.length === 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Clients', id)));
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
  
        await Client.updateOne({ _id: id, data });
        const updatedClient = await Client.findById(id);
  
        res.status(statusCodes.success).json({
          message: successMessages.client_updated_tr,
          actual_message: successMessages.document_updated(id),
          client: generateClient(updatedClient)
        });
      }
    } catch (error) {
      if(error.kind === ErrorKind.ID) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.invalid_id_tr,
          actual_message: errorMessages.invalid_id(id)
        });
      } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error: error
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

exports.changeProfileImage = async(req, res) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const path = './images/profile_images/';

  const _id = req.params.id;
  const image = req.files.image;

  if (_id) {
    try {
      const clients = await Client.find({ _id });
      if (clients.length === 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Clients', _id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.client_not_exist_tr,
          actual_message: errorMessages.not_exist('Clients', _id)
        });
      } else {
        const client = clients[0];

        if (client.profile_image) {
          fs.unlinkSync(path + client.profile_image);
        }

        const newFileName = client._id + '_' + image.name;
        image.mv(path + newFileName);

        await Client.updateOne(
          { _id },
          { profile_image: newFileName }
        );
        client.profile_image = newFileName;

        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).json({
          message: successMessages.client_profile_image_changed_tr,
          actual_message: successMessages.client_profile_image_changed,
          client: generateCleanModel(client)
        });
      }
    } catch (error) {
      if(error.kind === ErrorKind.ID) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(_id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.invalid_id_tr,
          actual_message: errorMessages.invalid_id(_id)
        });
      } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error: error
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

exports.changeAccoutStatus = async(req, res) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const _id = req.params.id;
  const status = req.params.status;

  if (_id) {
    try {
      if (status !== AccountStatus.ACTIVE && status !== AccountStatus.SUSPENDED) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.status_not_exist));
        res.status(statusCodes.user_error).json({
          message: errorMessages.status_not_exist_tr,
          actual_message: errorMessages.status_not_exist
        });
      } else {
        const clients = await Client.find({ _id });
        if (clients.length === 0) {
          await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Clients', _id)));
          res.status(statusCodes.user_error).json({
            message: errorMessages.client_not_exist_tr,
            actual_message: errorMessages.not_exist('Clients', _id)
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
            await Client.updateOne(
              { _id },
              { account_status: status }
            );
            const updatedClient = await Client.find({ _id });

            res.status(statusCodes.success).json({
              message: `Account status has been updated to ${ status }`,
              client: generateCleanModel(updatedClient[0])
            });
          }
        }
      }
    } catch (error) {
      if(error.kind === ErrorKind.ID) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(_id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.invalid_id_tr,
          actual_message: errorMessages.invalid_id(_id)
        });
      } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error: error
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

exports.resetFirstPassword = async(req, res) => {
  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  const _id = req.params.id;
  const data = {
    first_password: req.body.first_password,
    password: req.body.password,
    rePassword: req.body.repeat_password
  };

  if (_id) {
    try {
      const clients = await Client.find({ _id });
      if (clients.length === 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Clients', _id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.client_not_exist_tr,
          actual_message: errorMessages.not_exist('Clients', _id)
        });
      } else {
        if (data.first_password !== clients[0].first_password) {
          await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.password_not_correct));
          res.status(statusCodes.user_error).json({
            message: errorMessages.password_not_correct_tr,
            actual_message: errorMessages.password_not_correct
          });
        } else {
          if (data.password !== data.rePassword) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.passwords_not_match));
            res.status(statusCodes.user_error).json({
              message: errorMessages.passwords_not_match_tr,
              actual_message: errorMessages.passwords_not_match
            });
          } else {
            const newPassword = bcrypt.hashSync(data.password, 10);
            await Client.updateOne(
              { _id },
              { password: newPassword, first_password: null }
            );

            await Invite.find(
              { invited_client_id: clients[0]._id, status: InviteStatus.SUCCESSFULL },
              { status: InviteStatus.ACCEPTED }
            );

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
            await ClientLog.insertMany(logData);

            await insertNotificaton(
              NotificationType.ACCEPTED_INVITATION, 
              generateCleanModel(clients[0]), 
              new Date(), null, null
            );
            
            await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
            res.status(statusCodes.success).json({
              message: successMessages.logged_in_successfully_tr,
              actual_message: 'Logged in successfully',
              token,
              user: generateCleanModel(clients[0])
            });
          }
        }
      }
    } catch (error) {
      if(error.kind === ErrorKind.ID) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(_id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.invalid_id_tr,
          actual_message: errorMessages.invalid_id(_id)
        });
      } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error: error
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

exports.softDelete = async(req, res) => {
  const _id = req.params.id;

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  if(_id) {
    try {
      const clients = await Client.find({ _id });
      if (clients.length === 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Clients', _id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.client_not_exist_tr,
          actual_message: errorMessages.not_exist('Clients', _id)
        });
      } else {
        await Client.updateOne(
          { _id },
          { 
            active: false,
            deleted_by: JSON.stringify(generateCleanModel(loggedInUser))
          }
        );

        await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
        res.status(statusCodes.success).json({
          message: successMessages.client_deleted_tr,
          actual_message: successMessages.document_updated(_id),
        });
      }
    } catch (error) {
      if(error.kind === ErrorKind.ID) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(_id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.invalid_id_tr,
          actual_message: errorMessages.invalid_id(_id)
        });
      } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error: error
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

exports.recover = async(req, res) => {
  const _id = req.params.id;

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  if(_id) {
    try {
      const clients = await Client.find({ _id });
      if (clients.length === 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Clients', _id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.client_not_exist_tr,
          actual_message: errorMessages.not_exist('Clients', _id)
        });
      } else {
        if(clients[0].active) {
          await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.client_already_active));
          res.status(statusCodes.user_error).json({
            message: errorMessages.client_already_active_tr,
            actual_message: errorMessages.client_already_active
          });
        } else {
          await Client.updateOne(
            { _id },
            { active: true }
          );

          await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
          res.status(statusCodes.success).json({
            message: successMessages.client_recovered_tr,
            actual_message: successMessages.document_updated(_id),
            user: generateClient(clients[0])
          });
        }
      }
    } catch (error) {
      if(error.kind === ErrorKind.ID) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(_id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.invalid_id_tr,
          actual_message: errorMessages.invalid_id(_id)
        });
      } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error: error
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

exports.delete = async(req, res) => {

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  if (loggedInUser.role !== AdminRole.SUPER_ADMIN) {
    await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.no_permission));
    res.status(statusCodes.user_error).json({
      message: errorMessages.no_permission_tr,
      actual_message: errorMessages.no_permission,
      rolesAllowed: AdminRole.SUPER_ADMIN
    });
  } else {
    const _id = req.params.id;
  
    if(_id) {
      try {
        const clients = await Client.find({ _id });
        if (clients.length === 0) {
          await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Clients', _id)));
          res.status(statusCodes.user_error).json({
            message: errorMessages.client_not_exist_tr,
            actual_message: errorMessages.not_exist('Clients', _id)
          });
        } else {
          await Client.deleteOne({ _id });

          await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
          res.status(statusCodes.success).json({
            message: successMessages.client_deleted_permanently_tr,
            actual_message: successMessages.document_deleted(_id),
          });
        }
      } catch (error) {
        if(error.kind === ErrorKind.ID) {
          await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(_id)));
          res.status(statusCodes.user_error).json({
            message: errorMessages.invalid_id_tr,
            actual_message: errorMessages.invalid_id(_id)
          });
        } else {
          await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
          res.status(statusCodes.server_error).json({
            message: errorMessages.internal_tr,
            actual_message: errorMessages.internal,
            error: error
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
}

exports.invite = async(req, res) => {
  const id = req.params.id;
  const email = req.body.email;

  const token = req.headers.authorization;
  const loggedInUser = parseJwt(token);

  if (id) {
    try {
      const clients = await Client.find({ _id: id });
      if (clients.length === 0) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.not_exist('Clients', id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.client_not_exist_tr,
          actual_message: errorMessages.not_exist('Clients', id)
        });
      } else {
        // req.headers.host
        let protocol = null;
        if (req.headers.host.includes('localhost')) {
          protocol = 'http';
        } else {
          protocol = 'https';
        }
        
        const configuration = await FeConfiguration.find();

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
          }
        });
  
        const mailOptions = {
          from: configuration[0].invite_from,
          subject: configuration[0].invite_subject,
          html: `
            <body style="margin: 0px;">
              <div style="max-width: 650px; width: 100%; background-color: #ffffff; padding: 50px; font-family: Open Sans, sans-serif; color: #25476a; font-size: 24px; overflow: hidden;">
                <div>
                  <img 
                    style="width: 120px; height: auto;"
                    src="${ protocol }://${ req.headers.host }/images/${ configuration[0].logo }">
                </div>
            
                <div style="position: relative; z-index: 2;">
                  <p style="line-height: 91%; margin-top: 50px; margin-bottom: 45px;">
                    Здраво <span style="font-weight: bold;">${ clients[0].firstname } ${ clients[0].lastname }</span>,
                  </p>
                  <p style="max-width: 300px; line-height: 100%; margin-bottom: 13px;">
                    ${ configuration[0].invite_credentials_message }
                  </p>
                  <div style="line-height: 130%; margin-bottom: 70px;">
                    <p>
                      <span style="font-size: 24px; opacity: 0.7; margin-right: 11px;">${ configuration[0].invite_credentials_email_label }:</span>
                      <span style="font-weight: bold; color: #25476a;">${ clients[0].email }</span>
                    </p>
                    <p>
                      <span style="font-size: 24px; opacity: 0.7; margin-right: 11px;">${ configuration[0].invite_credentials_password_label }:</span>
                      <span style="font-weight: bold;">${ clients[0].first_password }</span>
                    </p>
                  </div>
                  <p style="max-width: 372px; line-height: 100%;">
                    ${ configuration[0].invite_login_message }
                  </p>
                  <a style="background-color: #25476a; width: 197px; height: 44px; border-radius: 10px; box-shadow: 2px 2px 7px -1px rgba(68, 68, 68, 0.3); padding: 0; color: #ffffff; text-decoration: none; line-height: 30px; font-weight: 600; font-size: 20px; margin-top: 23px; transition: 0.3s ease-in-out; padding: 10px 60px;" 
                    href="${ req.headers.origin }"> Најава </a>
                  <p style="font-weight: 600; line-height: 91%; font-size: 15px; margin-top: 75px; margin-bottom: 30px;">
                    ${ configuration[0].invite_thank_you_message }</p>
                </div>
                <div style="width: 100%; z-index: 2;">
                  <div style="float: left; display: inline-block; clear: both;">
                    <div style="display: flex; align-items: center; margin-bottom: 4px; transition: 0.3s ease-in-out; cursor: pointer;"
                      onMouseOver="this.style.opacity='0.7'"
                      onMouseOut="this.style.opacity='1'">
                      <div style="font-size: 14px; margin-right: 15px;">
                        <img src="${ protocol }://${ req.headers.host }/images/${ configuration[0].invite_phone_number_icon }">
                      </div>
                      <a style="font-size: 13px; color: #25476a; text-decoration: none; font-weight: 600; line-height: 18px;" 
                        href="tel:${ configuration[0].phone_number }">${ configuration[0].phone_number }</a>
                    </div>
            
                    <div style="display: flex; align-items: center; margin-bottom: 4px; transition: 0.3s ease-in-out; cursor: pointer;"
                      onMouseOver="this.style.opacity='0.7'"
                      onMouseOut="this.style.opacity='1'">
                      <div style="font-size: 14px; margin-right: 15px;">
                        <img src="${ protocol }://${ req.headers.host }/images/${ configuration[0].invite_email_icon }">
                      </div>
                      <a style="font-size: 13px; color: #25476a; text-decoration: none; font-weight: 600; line-height: 18px;"
                        href="mailto:${ configuration[0].email }">${ configuration[0].email }</a>
                    </div>
            
                    <div style="display: flex; align-items: center; margin-bottom: 4px; transition: 0.3s ease-in-out; cursor: pointer;"
                      onMouseOver="this.style.opacity='0.7'"
                      onMouseOut="this.style.opacity='1'">
                      <div style="font-size: 14px; margin-right: 15px;">
                        <img src="${ protocol }://${ req.headers.host }/images/${ configuration[0].invite_location_icon }">
                      </div>
                      <a style="font-size: 13px; color: #25476a; text-decoration: none; font-weight: 600; line-height: 18px;"
                        href="#">${ configuration[0].address }</a>
                    </div>
                  </div>
            
                  <div style="float: right; clear: both; display: inline-block;">
                    <img    
                      style="width: 120px;"
                      src="${ protocol }://${ req.headers.host }/images/${ configuration[0].logo }">
                  </div>
                </div>
              </div>
            </body>
          `
        };
  
        mailOptions['to'] = email ? email : clients[0].email;

        transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
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

              status: InviteStatus.SUCCESSFULL,

              date: generateDate(),
              time: generateTime()
            };

            const invites = await Invite.find({ invited_client_id: clients[0]._id });
            if (invites.length > 0) {
              await Invite.updateOne(
                { _id: invites[0]._id },
                { status: InviteStatus.FAILED }
              );
              await Invite.insertMany(invite);

              await Logger.insertMany(generateSuccessLogger(loggedInUser, req));
              res.status(statusCodes.success).json({
                message: successMessages.email_sent_tr,
                actual_message: successMessages.email_sent
              });
            }
          }
        });

        // res.status(statusCodes.success).json({
        //   message: successMessages.email_sent_tr,
        //   actual_message: successMessages.email_sent
        // });
      }
    } catch (error) {
      if(error.kind === ErrorKind.ID) {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, errorMessages.invalid_id(id)));
        res.status(statusCodes.user_error).json({
          message: errorMessages.invalid_id_tr,
          actual_message: errorMessages.invalid_id(id)
        });
      } else {
        await Logger.insertMany(generateErrorLogger(loggedInUser, req, error));
        res.status(statusCodes.server_error).json({
          message: errorMessages.internal_tr,
          actual_message: errorMessages.internal,
          error: error
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
