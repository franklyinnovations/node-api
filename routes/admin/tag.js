'use strict';

const router = require('express').Router()
, oauth = require('../../config/oauth').oauth
, authorise = oauth.authorise()
, auth = require('../../config/auth')
, tag = require('../../controllers/tag')
, formData = require('multer')().array();

router.post('/', authorise, formData, (req, res) => {
	req.roleAccess = {model:'tag', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			tag.list(req, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/add', authorise, formData, (req, res) => {
	req.roleAccess = {model:'tag', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			res.send({});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit/:id', authorise, formData, (req, res) => {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	req.roleAccess = {model:'tag', action:'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			data.id = req.params.id;
			tag.getById(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, formData, (req, res) => {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	req.roleAccess = {model:'tag', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			tag.save(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/status/:id/:status', authorise, formData, (req, res) => {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	req.roleAccess = {model:'tag', action:'status'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			data.id = req.params.id;
			data.is_active = req.params.status;
			tag.status(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/remove/:id', authorise, formData, (req, res) => {
	req.roleAccess = {model:'tag', action:'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			var data = JSON.parse(req.body.data);
			data.id = req.params.id;
			tag.remove(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/list', authorise, formData, (req, res) => {
	Promise.resolve(true)
		.then(() => tag.getAll(req.body.data ? JSON.parse(req.body.data) : req.body))
		.then(result => res.send(result))
		.catch(console.log);
});

router.post('/copy', authorise, formData, (req, res) => {
	Promise.resolve(true)
		.then(() => tag.copy(req.body.data ? JSON.parse(req.body.data) : req.body))
		.then(result => res.send(result))
		.catch(console.log);
});

router.use(oauth.errorHandler());
module.exports = router;