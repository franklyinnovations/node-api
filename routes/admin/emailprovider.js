'use strict';

const emailprovider = require('../../controllers/emailprovider'),
router = require('express').Router(),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
auth = require('../../config/auth'),
language = require('../../controllers/language'),
formData = require('multer')().array();

router.post('/', authorise, formData, (req, res) => {
	if ((req.body.data ? JSON.parse(req.body.data) : req.body).masterId != 1) {
		return res.send({
			status:false,
			error: true,
			error_description: language.lang({key: "Internal Error", lang: req.lang}),
			url: true
		});
	}
	Promise.resolve(emailprovider.list(req))
	.then(result => res.send(result));
});

router.post('/activate', authorise, formData, (req, res) => {
	var data = req.body.data ? JSON.parse(req.body.data) : req.body;
	if (data.masterId != 1) {
		return res.send({
			status:false,
			error: true,
			error_description: language.lang({key: "Internal Error", lang: req.lang}),
			url: true
		});
	}
	Promise.resolve(emailprovider.status(data))
	.then(result => res.send(result));
});


router.use(oauth.errorHandler());
module.exports = router;