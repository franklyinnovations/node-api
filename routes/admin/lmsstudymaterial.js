'use strict';

const lmsstudymaterial = require('../../controllers/lmsstudymaterial'),
log = require('../../controllers/log'),
router = require('express').Router(),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
auth = require('../../config/auth'),
language = require('../../controllers/language'),
formData = require('multer')().array();

router.post('/', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmsstudymaterial', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmsstudymaterial.list(req.body))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/loadStudyMaterial', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmsstudymaterial', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmsstudymaterial.loadStudyMaterial(req.body))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/getSubjects', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmsstudymaterial', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmsstudymaterial.getSubjects(
				req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/getChapters', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmsstudymaterial', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmsstudymaterial.getChapters(
				req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/getTopics', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmsstudymaterial', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmsstudymaterial.getTopics(
				req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;