'use strict';

const activitymark = require('../../controllers/activitymark'),
log = require('../../controllers/log'),
router = require('express').Router(),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
auth = require('../../config/auth'),
language = require('../../controllers/language'),
formData = require('multer')().array();


router.post('/', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activitymark', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(activitymark.list(req))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/add', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activitymark', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			activitymark
			.getMetaInformation(req.body.data ? JSON.parse(req.body.data) : req.body)
			.then(examSchedules => res.send({status: true, data: {}, examSchedules}))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activitymark', action:'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(activitymark.getForEdit(
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
	req.roleAccess = {model:'activitymark', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(activitymark.save(
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
	req.roleAccess = {model:'activitymark', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(activitymark.save2(
				req.body.data ? JSON.parse(req.body.data) : req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/getSectionsAndActivities', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activitymark', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			activitymark
			.getSectionsAndActivities(req.body.data ? JSON.parse(req.body.data) : req.body)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/mark-activities', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activitymark', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			activitymark
			.markActivities(req.body.data ? JSON.parse(req.body.data) : req.body)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/students', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activitymark', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			activitymark
			.students(req.body.data ? JSON.parse(req.body.data) : req.body)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/students2', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activitymark', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			activitymark
			.students2(req.body.data ? JSON.parse(req.body.data) : req.body)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});


router.post('/view', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activitymark', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			activitymark
			.view(req.body.data ? JSON.parse(req.body.data) : req.body)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/view-student-mark', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activitymark', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			activitymark
			.viewStudentMark(req.body.data ? JSON.parse(req.body.data) : req.body)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/view-activities', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activitymark', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			activitymark
			.viewActivities(req.body.data ? JSON.parse(req.body.data) : req.body)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});


router.use(oauth.errorHandler());
module.exports = router;