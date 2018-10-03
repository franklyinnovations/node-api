var exambulkattendance = require('../../controllers/exambulkattendance');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	req.roleAccess = {model:'exambulkattendance', action:'view'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			exambulkattendance.list(req, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});

/* save  */
router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	req.roleAccess = {model:'exambulkattendance', action:['add', 'edit']};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			exambulkattendance.save(data, function(result){
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
	req.roleAccess = {model:'exambulkattendance', action:'add'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			res.send(data);
		} else {
			res.send(isPermission);
		}
	});
});

/* edit  */
router.post('/edit', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	req.roleAccess = {model:'exambulkattendance', action:'edit'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			exambulkattendance.getById(data, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/getStudents', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	exambulkattendance.getAllStudents(data, function(result){
		res.send(result);
	});
});

router.post('/exams', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	exambulkattendance.getExams(data, function(result){
		res.send(result);
	});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
