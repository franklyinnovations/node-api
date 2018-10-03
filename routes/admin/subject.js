'use strict';

const
	subject = require('../../controllers/subject'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth'),
	language = require('../../controllers/language');


router.post('/', authorise, (req, res) => {
	req.roleAccess = {model:'subject', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req)
				.then(subject.list)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/add', authorise, (req, res) => {
	req.roleAccess = {model:'subject', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			res.send({status: true});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model:'subject', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(subject.save)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/status', authorise, (req, res) => {
	req.roleAccess = {model:'subject', action: 'status'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(subject.status)
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
	req.roleAccess = {model:'subject', action: 'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(subject.remove)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, (req, res) => {
	req.roleAccess = {model:'subject', action: 'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(subject.getById)
				.then(subject => res.send({status: true, subject}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

/* getAllSubject */
router.post('/list/:id', function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.masterId = req.params.id;
	subject.getAllSubject(data, function(result){
		res.send(result);
	});
});

/* getAllSubject */
router.post('/list', function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.masterId = data.masterId;
	subject.getAllSubject(data, function(result){
		res.send(result);
	});
});


router.use(oauth.errorHandler());
module.exports = router;