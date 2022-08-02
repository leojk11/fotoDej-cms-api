const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const mainRouter = require('./main-router/main-router');

const mongo = require('./db/mongo');
const connectToMongoDb = async() => {
    await mongo().then(_ => {
        try {
            console.log('CONNECTED TO DB!!')
            const port = process.env.PORT || 5000;
            app.listen(port, () => {
                console.log(`APP IS LISTENING TO PORT ${ port }!!`);
            });
        } catch (error) {
            console.log('CONNECTION TO DB FAILED', error);
        }
    })
}

const app = express();
app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true
    }),
    cors({
        origin: '*',
        optionsSuccessStatus: 200
    }),
    express.json(),
    fileUpload(),
    bodyParser.urlencoded({ extended: false }),
    bodyParser.json(),
    mainRouter
)

// connect app to db and start it 
connectToMongoDb();
