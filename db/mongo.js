const mongoose = require('mongoose');
require('dotenv').config();

const mongoPath = `mongodb+srv://${ process.env.DB_USERNAME }:${ process.env.DB_PASSWORD }@${ process.env.DB_CLUSTER }.mongodb.net/?retryWrites=true&w=majority`;

module.exports = async() => {
    await mongoose.connect(mongoPath, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    return mongoose;
}