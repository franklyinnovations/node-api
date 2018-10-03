'use strict';

const grade = require('../../controllers/grade'),
log = require('../../controllers/log'),
router = require('express').Router(),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
auth = require('../../config/auth'),
formData = require('multer')().array();


router.post('/', authorise, formData, (req, res) => {
	req.roleAccess = {model:'grade', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(grade.list(req))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/add', authorise, formData, (req, res) => {
	req.roleAccess = {model:'grade', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			grade
			.getMetaInformations(req.body.data ? JSON.parse(req.body.data) : req.body)
			.then(bcsmaps => res.send({status: true, data: {}, bcsmaps}))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, formData, (req, res) => {
	req.roleAccess = {model:'grade', action:'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(grade.getById(
				req.body.data ? JSON.parse(req.body.data) : req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, formData, (req, res) => {
	req.roleAccess = {model:'grade', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(grade.save(
				req.body.data ? JSON.parse(req.body.data) : req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save2', authorise, formData, (req, res) => {
	req.roleAccess = {model:'grade', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(grade.save(
				req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/remove', authorise, formData, (req, res) => {
	req.roleAccess = {model:'grade', action:'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(grade.remove(
				req.body.data ? JSON.parse(req.body.data) : req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/notification', authorise, formData, (req, res) => {
	req.roleAccess = {model:'grade', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(grade.notification(
				req.body.data ? JSON.parse(req.body.data) : req.body
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