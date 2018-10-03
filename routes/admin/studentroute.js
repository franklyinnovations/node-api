'use strict';

const
	auth = require('../../config/auth'),
	router = require('express').Router(),
	log = require('../../controllers/log'),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	studentroute = require('../../controllers/studentroute');

router.post('/bcsmaps-routes', authorise, (req, res) => {
	req.roleAccess = {model:'rvdhsmap', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(studentroute.bcsmapAndRoutes)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/rvdhsmaps', authorise, (req, res) => {
	req.roleAccess = {model:'rvdhsmap', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(studentroute.rvdhsmaps)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/students', authorise, (req, res) => {
	req.roleAccess = {model:'rvdhsmap', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(studentroute.students)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});


router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model:'rvdhsmap', action: 'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(studentroute.save)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;