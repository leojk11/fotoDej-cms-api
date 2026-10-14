const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const mainRouter = require('./main-router/main-router');

const { errorHandler } = require('./middlewares/common');
const { initConfiguration } = require('./helpers/initializeConfiguration');

const mongo = require('./db/mongo');

const app = express();
app.use(
  cors({
    origin: '*',
    optionsSuccessStatus: 200
  }),
  express.json(),
  fileUpload(),
  express.urlencoded({ extended: false }),
  // Express 5 leaves req.body undefined when no body is parsed
  (req, res, next) => {
    req.body = req.body || {};
    next();
  },
  mainRouter,
  errorHandler
);

// connects to the db and makes sure the default configuration exists. safe to call many times
let ready;
app.ready = () => {
  if (!ready) {
    ready = mongo().then(() => initConfiguration()).catch(error => {
      ready = undefined;
      throw error;
    });
  }

  return ready;
}

// local / server hosting: node app.js. On Netlify the app is imported by netlify/functions/api.mjs instead
if (require.main === module) {
  app.ready().then(() => {
    console.log('CONNECTED TO DB!!');
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`APP IS LISTENING TO PORT ${port}!!`);
    });
  }).catch(error => {
    console.log('CONNECTION TO DB FAILED', error);
  });
}

module.exports = app;
