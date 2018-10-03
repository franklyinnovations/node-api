'use strict';

const marksheetbuilder = require('../../controllers/marksheetbuilder'),
	log = require('../../controllers/log'),
	language = require('../../controllers/language'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth');

router.post('/', authorise, (req, res) => {
	req.roleAccess = {model:'marksheetbuilder', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req)
				.then(marksheetbuilder.list)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/add', authorise, (req, res) => {
	req.roleAccess = {model:'marksheetbuilder', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			res.send({status: true});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model:'marksheetbuilder', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(marksheetbuilder.save)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/status', authorise, (req, res) => {
	req.roleAccess = {model:'marksheetbuilder', action: 'status'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(marksheetbuilder.status)
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
	req.roleAccess = {model:'marksheetbuilder', action: 'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(marksheetbuilder.remove)
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
	req.roleAccess = {model:'marksheetbuilder', action: 'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(marksheetbuilder.getById)
				.then(marksheetbuilder => res.send({status: true, marksheetbuilder}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/settings', authorise, (req, res) => {
	req.roleAccess = {model:'marksheetbuilder', action: 'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(marksheetbuilder.settings)
				.then(
					({settings, template, options, id}) => res.send({
						status: true,
						id,
						settings,
						template,
						options,
					})
				)
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save-settings', authorise, (req, res) => {
	req.roleAccess = {model:'marksheetbuilder', action: 'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(marksheetbuilder.saveSettings)
				.then(() => res.send({
					status: true,
					message: language.lang({key: 'Saved successfully', lang: req.lang}),
				}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;