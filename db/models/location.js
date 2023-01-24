const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
	title: {
		type: String,
		required: true
	},
	place: {
		type: String
	},

	date: {
		type: String
	},
	time: {
		type: String
	},

	location_n: { // Location index
		type: Number
	},

	schedule_id: {
		type: String
	},
	user_id: {
		type: String
	}
});

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;