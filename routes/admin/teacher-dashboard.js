'use strict';

const
	router = require('express').Router(),
	log = require('../../controllers/log'),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	teacherDashboard = require('../../controllers/teacher-dashboard');

router.post('/classes', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(teacherDashboard.classes)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});


router.post('/leaves', authorise, (req, res) => {
	req.body.userId = req.user.id;
	Promise.resolve(req.body)
		.then(teacherDashboard.leaves)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/student-leaves', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(teacherDashboard.studentLeaves)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});


router.post('/events', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(teacherDashboard.events)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/exams', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(teacherDashboard.exams)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/assignments', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(teacherDashboard.assignments)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.use(oauth.errorHandler());
module.exports = router;