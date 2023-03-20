const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/common');

const schedules = require('../controllers/schedule');

// SCHEDULES
router.get('/', verifyToken, schedules.getAll);
router.get('/:id', verifyToken, schedules.getSingle);

router.get('/for/user', verifyToken, schedules.getForUser);
router.get('/for/user/upcoming', verifyToken, schedules.getForUserUpcoming);

router.post('/', verifyToken, schedules.addNew);

router.patch('/:id', verifyToken, schedules.edit);

router.delete('/:id', verifyToken, schedules.delete);

// LOCATIONS
router.get('/locations/all', verifyToken, schedules.getAllLocations);
router.get('/:id/locations', verifyToken, schedules.getLocationsForSchedule);

router.post('/:id/locations', verifyToken, schedules.addNewLocation);

router.patch('/:id/locations/:location_id', verifyToken, schedules.editLocation);

router.delete('/:id/locations/:location_id', verifyToken, schedules.deleteLocation);

module.exports = router;
