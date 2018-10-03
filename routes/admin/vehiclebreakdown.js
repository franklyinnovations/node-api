'use strict';

const
	auth = require('../../config/auth'),
	router = require('express').Router(),
	log = require('../../controllers/log'),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	vehiclebreakdown = require('../../controllers/vehiclebreakdown');

router.post('/', authorise, (req, res) => {
	req.roleAccess = {model:'vehiclebreakdown', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req)
				.then(vehiclebreakdown.list)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, (req, res) => {
	req.roleAccess = {model:'vehiclebreakdown', action: 'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(vehiclebreakdown.edit)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model:'vehiclebreakdown', action: ['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(vehiclebreakdown.save)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/remove', authorise, (req, res) => {
	req.roleAccess = {model:'vehiclebreakdown', action: 'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(vehiclebreakdown.remove)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;