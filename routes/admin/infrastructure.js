'use strict';

const
	infrastructure = require('../../controllers/infrastructure'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth'),
	language = require('../../controllers/language');


router.post('/', authorise, (req, res) => {
	req.roleAccess = {model:'infrastructure', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req)
				.then(infrastructure.list)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model:'infrastructure', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(infrastructure.save)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/status', authorise, (req, res) => {
	req.roleAccess = {model:'infrastructure', action: 'status'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(infrastructure.status)
				.then(() => res.send({
					status: true,
					message: language.lang({key: 'updatedSuccessfully', lang: req.lang}),
				}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/remove', authorise, (req, res) => {
	req.roleAccess = {model:'infrastructure', action: 'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(infrastructure.remove)
				.then(() => res.send({
					status: true,
					message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
				}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, (req, res) => {
	req.roleAccess = {model:'infrastructure', action: 'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(infrastructure.getById)
				.then(infrastructure => res.send({status: true, infrastructure}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save-type', authorise, (req, res) => {
	req.roleAccess = {model:'infrastructure', action: ['add','edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(infrastructure.saveType)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;