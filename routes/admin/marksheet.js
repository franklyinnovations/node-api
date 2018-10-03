'use strict';

const marksheet = require('../../controllers/marksheet'),
	log = require('../../controllers/log'),
	language = require('../../controllers/language'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth');

router.post('/studentsAndMarksheetBuilders', authorise, (req, res) => {
	req.roleAccess = {model: 'marksheet', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
			.then(marksheet.studentsAndMarksheetBuilders)
			.then(([marksheetbuilders, students]) => res.send({
				status: true,
				marksheetbuilders,
				students
			}))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/data', authorise, (req, res) => {
	req.roleAccess = {
		model: req.body.preview ? 'marksheetbuilder' : 'marksheet',
		action: req.body.preview ? 'edit' : 'view',
	};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
			.then(marksheet.data)
			.then((result) => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/creator', authorise, (req, res) => {
	req.roleAccess = {model: 'marksheet', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
			.then(marksheet.creator)
			.then(([template, meta]) => res.send({
				status: true,
				meta,
				template,
			}))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model: 'marksheet', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
			.then(marksheet.save)
			.then(() => res.send({status: true}))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/', authorise, (req, res) => {
	req.roleAccess = {model: 'marksheet', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
			.then(marksheet.bcsmaps)
			.then(bcsmaps => res.send({status: true, bcsmaps}))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});


router.use(oauth.errorHandler());
module.exports = router;