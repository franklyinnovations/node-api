'use strict';

const broadcast = require('../../controllers/broadcast'),
router = require('express').Router(),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
auth = require('../../config/auth'),
language = require('../../controllers/language'),
formData = require('multer')().array();


router.post('/teachers', authorise, formData, (req, res) => {
	req.roleAccess = {model:'broadcast', action:'teacher'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			if (data.permission) return res.send({status: true});
			broadcast.teachers(data)
			.then(result => res.send(result))
			.catch(console.log);
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/students', authorise, formData, (req, res) => {
	req.roleAccess = {model:'broadcast', action:'student'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			if (data.permission) return res.send({status: true});
			broadcast.students(data)
			.then(result => res.send(result))
			.catch(console.log);
		} else {
			res.send(isPermission);
		}
	});
});




router.use(oauth.errorHandler());
module.exports = router;