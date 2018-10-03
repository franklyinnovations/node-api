'use strict';

const
	router = require('express').Router(),
	log = require('../../controllers/log'),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	studentDashboard = require('../../controllers/student-dashboard');

router.post('/classes', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(studentDashboard.classes)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/leaves', authorise, (req, res) => {
	req.body.userId = req.user.id;
	Promise.resolve(req.body)
		.then(studentDashboard.leaves)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/events', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(studentDashboard.events)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/circulars', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(studentDashboard.circulars)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/exams', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(studentDashboard.exams)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/assignments', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(studentDashboard.assignments)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.use(oauth.errorHandler());
module.exports = router;