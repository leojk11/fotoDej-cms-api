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
const configuration = require('../routes/feConfiguration');
const inviteRoutes = require('../routes/invite');
const organizationRoutes = require('../routes/organization');
const requestsRoutes = require('../routes/requests');
const dashboardRoutes = require('../routes/dashboard');
const clientLogsRoutes = require('../routes/clientLog');
const notificationsRoutes = require('../routes/notification');
const loggerRoutes = require('../routes/logger');
const visitCounterRoutes = require('../routes/visitCounter');

mainRouter.use('/users', userRoutes);
mainRouter.use('/admin', adminRoutes);
mainRouter.use('/client', clientRoutes);
mainRouter.use('/albums', albumRoutes);
mainRouter.use('/modifications', modificationRoutes);
mainRouter.use('/schedules', scheduleRoutes);
mainRouter.use('/conf', configuration);
mainRouter.use('/invites', inviteRoutes);
mainRouter.use('/organizations', organizationRoutes);
mainRouter.use('/requests', requestsRoutes);
mainRouter.use('/dashboard', dashboardRoutes);
mainRouter.use('/client_logs', clientLogsRoutes);
mainRouter.use('/notifications', notificationsRoutes);
mainRouter.use('/logger', loggerRoutes);
mainRouter.use('/visit_counters', visitCounterRoutes);

module.exports = mainRouter;
