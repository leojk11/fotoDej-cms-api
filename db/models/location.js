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
	schedule: {
		type: Object
	},
	user_id: {
		type: String
	},

	// internal data
	created_by: {
		type: Object,
		required: true
	},
	created_by_id: {
		type: String,
		required: true
	},
	created_date: {
		type: String,
		required: true
	},
	created_time: {
		type: String,
		required: true
	},
	
	modified_by: {
		type: String
	},
	modified_by_id: {
		type: String
	},
	modified_date: {
		type: String
	},
	modified_time: {
		type: String
	}
});

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;