var studentexamschedule = require('../../controllers/studentexamschedule');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	req.roleAccess = {model:'examschedule', action:'view'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			studentexamschedule.list(req, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});

/* add */
router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	req.roleAccess = {model:'examschedule', action:'add'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			res.send(data);
		} else {
			res.send(isPermission);
		}
	});
});

/* edit  */
router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;
	req.roleAccess = {model:'examschedule', action:'edit'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			studentexamschedule.getById(data, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/examSchedule', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	studentexamschedule.examSchedule(data, function(result){
		res.send(result);
	});     
});

router.post('/viewSchedule', upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	studentexamschedule.viewSchedule(data, function(result){
		res.send(result);
	});
});

router.post('/viewSyllabus', upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	studentexamschedule.viewSyllabus(data, function(result){
		res.send(result);
	});
});


router.use(oauth.oauth.errorHandler());
module.exports = router;
