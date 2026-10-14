const mongoose = require('mongoose');
require('dotenv').config();

const mongoPath = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`;

// one connection per process, reused by every call (and every warm serverless invocation)
let connection;

module.exports = async () => {
  if (!connection) {
    connection = mongoose.connect(mongoPath).catch(error => {
      connection = undefined;
      throw error;
    });
  }
  await connection;

  return mongoose;
}
