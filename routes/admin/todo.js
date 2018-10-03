'use strict';

const
	router = require('express').Router(),
	log = require('../../controllers/log'),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	todo = require('../../controllers/todo');


router.post('/list', authorise, (req, res) => {
	req.body.userId = req.user.id;
	Promise.resolve(req.body)
		.then(todo.list)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/save', authorise, (req, res) => {
	req.body.userId = req.user.id;
	Promise.resolve(req.body)
		.then(todo.save)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/remove', authorise, (req, res) => {
	req.body.userId = req.user.id;
	Promise.resolve(req.body)
		.then(todo.remove)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.use(oauth.errorHandler());
module.exports = router;