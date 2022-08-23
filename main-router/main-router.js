const express = require('express');

const mainRouter = express();

// auth routes
const authRoutes = require('../routes/auth');
mainRouter.use('/auth', authRoutes);

const userRoutes = require('../routes/user');
const adminRoutes = require('../routes/admin');
const clientRoutes = require('../routes/client');
const albumRoutes = require('../routes/album');
const modificationRoutes = require('../routes/modification');

mainRouter.use('/users', userRoutes);
mainRouter.use('/admin', adminRoutes);
mainRouter.use('/client', clientRoutes);
mainRouter.use('/albums', albumRoutes);
mainRouter.use('/modifications', modificationRoutes);

module.exports = mainRouter;