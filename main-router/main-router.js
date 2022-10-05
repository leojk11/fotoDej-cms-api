const express = require('express');

const mainRouter = express();

// auth routes
const authRoutes = require('../routes/auth');
mainRouter.use('/auth', authRoutes);

// images routes
const imageRoutes = require('../routes/images');
mainRouter.use('/images', imageRoutes);

const userRoutes = require('../routes/user');
const adminRoutes = require('../routes/admin');
const clientRoutes = require('../routes/client');
const albumRoutes = require('../routes/album');
const modificationRoutes = require('../routes/modification');
const scheduleRoutes = require('../routes/schedule');

mainRouter.use('/users', userRoutes);
mainRouter.use('/admin', adminRoutes);
mainRouter.use('/client', clientRoutes);
mainRouter.use('/albums', albumRoutes);
mainRouter.use('/modifications', modificationRoutes);
mainRouter.use('/schedules', scheduleRoutes);

module.exports = mainRouter;
