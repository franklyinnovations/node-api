'use strict';

const router = require('express').Router()
, oauth = require('../../config/oauth').oauth
, authorise = oauth.authorise()
, auth = require('../../config/auth')
, classreport = require('../../controllers/classreport')
, log = require('../../controllers/log')
, formData = require('multer')().none();


router.post('/view/:bcsMapId/:subjectId/:date/:order', authorise, formData, (req, res) => {
	req.roleAccess = {model:'classreport', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			data.bcsMapId = req.params.bcsMapId;
			data.subjectId = req.params.subjectId;
			data.date = req.params.date;
			data.order = req.params.order;
			classreport.view(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/view/:id', authorise, formData, (req, res) => {
	req.roleAccess = {model:'classreport', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			data.id = req.params.id;
			classreport.getById(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, formData, (req, res) => {
	req.roleAccess = {model:'classreport', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			classreport.save(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/status/:id/:status', formData, (req, res) => {
	req.roleAccess = {model:'classreport', action:'status'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			data.id = req.params.id;
			data.is_locked = req.params.status == 1 ? 1 : 0;
			classreport.status(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/meta', authorise, formData, (req, res) => {
	Promise.resolve(classreport.meta(req.body))
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/viewData', authorise, formData, (req, res) => {
	req.roleAccess = {model:'classreport', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			classreport.view(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/:date', authorise, formData, (req, res) => {
	req.roleAccess = {model:'classreport', action:'view'};
	req.query.date = req.params.date;
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			classreport.list(req, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/', authorise, formData, (req, res) => {
	req.roleAccess = {model:'classreport', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			classreport.list(req, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;
