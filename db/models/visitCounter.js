const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const visitCounter = new Schema({
  date: {
    type: String
  }
});

const VisitCounter = mongoose.model('VisitCounter', visitCounter);
module.exports = VisitCounter;
