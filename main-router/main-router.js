const express = require('express');

const mainRouter = express();

const userRoutes = require('../routes/user');

mainRouter.use('/users', userRoutes);

// routes go here

module.exports = mainRouter;