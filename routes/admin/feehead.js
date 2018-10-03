'use strict';

const
	feehead = require('../../controllers/feehead'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth'),
	language = require('../../controllers/language');


router.post('/', authorise, (req, res) => {
	req.roleAccess = {model:'feehead', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req)
				.then(feehead.list)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/routes', authorise, (req, res) => {
	req.roleAccess = {model:'feehead', action: ['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(feehead.routes)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/route-addresses', authorise, (req, res) => {
	req.roleAccess = {model:'feehead', action: ['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(feehead.routeAddresses)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model:'feehead', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(feehead.save)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/status', authorise, (req, res) => {
	req.roleAccess = {model:'feehead', action: 'status'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(feehead.status)
				.then(() => res.send({
					status: true,
					message: language.__('updatedSuccessfully', req.lang),
				}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/remove', authorise, (req, res) => {
	req.roleAccess = {model:'feehead', action: 'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(feehead.remove)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, (req, res) => {
	req.roleAccess = {model:'feehead', action: 'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(feehead.getById)
				.then(data => res.send({status: true, data}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});


router.use(oauth.errorHandler());
module.exports = router;