'use strict';

const studentbulkedit = require('../../controllers/studentbulkedit'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth'),
	language = require('../../controllers/language'),
	formData = require('multer')().array();

router.post('/getStudents', authorise, formData, (req, res) => {
	req.roleAccess = {model:'studentbulkedit', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(studentbulkedit.getStudents(
				req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, formData, (req, res) => {
	req.roleAccess = {model:'studentbulkedit', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
			.then(studentbulkedit.saveEdit)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;