const mongoose = require('mongoose');
require('dotenv').config();

const mongoPath = `mongodb+srv://leojk11:${ process.env.DB_PASSWORD }@cluster0.mr3oomx.mongodb.net/?retryWrites=true&w=majority`;

module.exports = async() => {
    await mongoose.connect(mongoPath, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    return mongoose;
}