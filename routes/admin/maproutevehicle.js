'use strict';

const
	auth = require('../../config/auth'),
	router = require('express').Router(),
	log = require('../../controllers/log'),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	maproutevehicle = require('../../controllers/maproutevehicle');

router.post('/vehicle-rvdhsmap', authorise, (req, res) => {
	req.roleAccess = {model:'rvdhsmap', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(maproutevehicle.vehicleRvdhsmap)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/route-addresses', authorise, (req, res) => {
	req.roleAccess = {model:'rvdhsmap', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(maproutevehicle.routeAddresses)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model:'rvdhsmap', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(maproutevehicle.save)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;