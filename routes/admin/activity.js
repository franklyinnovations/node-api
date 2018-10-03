'use strict';

const activity = require('../../controllers/activity'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth'),
	formData = require('multer')().array();

router.post('/', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activity', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(activity.list(req))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/add', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activity', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			activity
				.getMetaInformations(req.body.data ? JSON.parse(req.body.data) : req.body)
				.then(activities => res.send({status: true, data: {}, activities}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, formData, (req, res) => {
	req.roleAccess = {model:'activity', action:'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(activity.getById(
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
	req.roleAccess = {model:'activity', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(activity.save(
				req.body.data ? JSON.parse(req.body.data) : req.body
			))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/remove', authorise, (req, res) => {
	req.roleAccess = {model:'activity', action: 'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(activity.remove)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/activityList', formData, (req, res) => {
	Promise.resolve(activity.activityList(
		req.body.data ? JSON.parse(req.body.data) : req.body
	))
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/getSubActivity', formData, (req, res) => {
	Promise.resolve(activity.subActivityList(
		req.body.data ? JSON.parse(req.body.data) : req.body
	))
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/activitySchedule', formData, (req, res) => {
	Promise.resolve(activity.activityScheduleList(
		req.body.data ? JSON.parse(req.body.data) : req.body
	))
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/checkActivitySchedule', formData, (req, res) => {
	Promise.resolve(activity.checkActivitySchedule(
		req.body.data ? JSON.parse(req.body.data) : req.body
	))
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/removeActivity', formData, (req, res) => {
	Promise.resolve(activity.removeActivity(
		req.body.data ? JSON.parse(req.body.data) : req.body
	))
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});



router.post('/addActivitySchedule', formData, (req, res) => {
	Promise.resolve(activity.addActivitySchedule(
		req.body.data ? JSON.parse(req.body.data) : req.body
	))
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.use(oauth.errorHandler());
module.exports = router;