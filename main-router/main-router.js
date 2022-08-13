const express = require('express');

const mainRouter = express();

// auth routes
const authRoutes = require('../routes/auth');
mainRouter.use('/auth', authRoutes);

const userRoutes = require('../routes/user');
const adminRoutes = require('../routes/admin');

mainRouter.use('/users', userRoutes);
mainRouter.use('/admin', adminRoutes);

module.exports = mainRouter;