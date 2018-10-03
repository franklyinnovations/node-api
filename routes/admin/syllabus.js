'use strict';

const syllabus = require('../../controllers/syllabus'),
log = require('../../controllers/log'),
router = require('express').Router(),
formData = (require('multer'))().none(),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
auth = require('../../config/auth');

router.post('/', authorise, formData, (req, res) => {
	req.roleAccess = {model:'syllabus', action:'view'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			Promise.resolve(true)
			.then(() => syllabus.list(req)) 
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, formData, (req, res) => {
	req.roleAccess = {model:'syllabus', action:'add'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			Promise.resolve(true)
			.then(() => syllabus.getById(req.body.data ? JSON.parse(req.body.data) : req.body)) 
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/view', authorise, formData, (req, res) => {
	req.roleAccess = {model:'syllabus', action:'view'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			Promise.resolve(true)
			.then(() => syllabus.getById(req.body.data ? JSON.parse(req.body.data) : req.body)) 
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, formData, (req, res) => {
	req.roleAccess = {model:'syllabus', action:['add', 'edit']};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			Promise.resolve(true)
			.then(() => syllabus.save(req.body.data ? JSON.parse(req.body.data) : req.body)) 
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;