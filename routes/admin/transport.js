'use strict';

const transport = require('../../controllers/transport'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	language = require('../../controllers/language'),
	formData = require('multer')().array();

router.post('/driver-dashboard', authorise, formData, (req, res) => {
	let data = req.body.data ? JSON.parse(req.body.data) : req.body;
	Promise.resolve(data)
		.then(transport.getRoutes)
		.then(result => res.send({
			status: true,
			message: language.lang({key: 'driver-dashboard', lang: data.lang}),
			rvdhsmaps: result
		}))
		.catch(err => res.send(log(req, err)));
});

router.post('/trip', authorise, formData, (req, res) => {
	Promise.resolve(req.body.data ? JSON.parse(req.body.data) : req.body)
		.then(transport.getTrip)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/trip-info', authorise, formData, (req, res) => {
	Promise.resolve(req.body)
		.then(transport.getTripInfo)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});


router.post('/student-rvdhsmap', authorise, formData, (req, res) => {
	let data = req.body.data ? JSON.parse(req.body.data) : req.body;
	Promise.resolve(data)
		.then(transport.getStudentRVDHSMap)
		.then(result => res.send({
			status: result.length !== 0,
			message: language.lang({
				key: result.length ? 'student rvdhsmap' : 'No routes found',
				lang: data.lang
			}),
			data: result
		}))
		.catch(err => res.send(log(req, err)));
});

router.post('/trips', authorise, formData, (req, res) => {
	Promise.resolve(req.body)
		.then(transport.trips)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/active-trips', authorise, formData, (req, res) => {
	Promise.resolve(req.body)
		.then(transport.activeTrips)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/rvdhsmaps', authorise, formData, (req, res) => {
	Promise.resolve(req.body)
		.then(transport.rvdhsmaps)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.use(oauth.errorHandler());
module.exports = router;