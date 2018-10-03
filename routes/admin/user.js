var users = require('../../controllers/users');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var models = require('../../models');
var upload = multer();
var fs = require('fs');
var async = require('async');
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');


var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		var destFolder = tmpDir;
		if (!fs.existsSync(destFolder+file.fieldname)) {
			fs.mkdirSync(destFolder+file.fieldname);
		}
		cb(null, destFolder);
	},
	filename: function (req, file, cb) {
		cb(null, file.fieldname+'/'+Date.now() + '.' + mime.extension(file.mimetype));
	}
});
var uploadFile = multer({
  storage: storage,
	fileFilter: function (req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
			cb('Only image files are allowed!', false);
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 1000000}
}).any();


/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
  req.roleAccess = {model:'user', action:'view'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			users.list(req, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});

/* save */
router.post('/save', oauth.oauth.authorise(), function (req, res) {
	uploadFile(req, res, function (err) {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 1 MB';
			return res.send({status: false, message: err, data: []});
		}
		var data = req.body;
		if(typeof req.body.data !== 'undefined'){
			data = JSON.parse(req.body.data);
		}
		var count = 1;
		req.roleAccess = {model:'user', action:['add', 'edit']};
		auth.checkPermissions(req, function(isPermission){
			if (isPermission.status === true) {
				async.forEach(req.files, function (up_files, callback) {
				  if (up_files.path !=='') {
					data[up_files.fieldname] = up_files.path;
				  }
				  if (req.files.length == count) {
					callback(req.body);
				  }
				  count++;
				}, function () {
					users.save(data, function(result){
						res.send(result);
					});
				});
			} else {
				res.send(isPermission);
			}
		});
	});
});

/* add */
router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	req.roleAccess = {model:'user', action:'add'};
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
	req.roleAccess = {model:'user', action:'edit'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			users.getById(data, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});

/* status */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;
	data.is_active = req.params.status;
	req.roleAccess = {model:'user', action:'status'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			users.status(data, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});


/* getAllCountry */
router.post('/list', upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	users.getAllCountry(data, function(result){
		res.send(result);
	});
});

/* state list by country id  */
router.post('/userdetail/:id/:langId/:masterId', upload.array(), function (req, res) {

	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;
	data.languageId = req.params.langId;
	data.masterId = req.params.masterId;
	users.useInfo(data, function(result){
		res.send(result);
	});
});

/* state list by country id  */
router.post('/userdetails/:id/:langId/:masterId', upload.array(), function (req, res) {

	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;
	data.languageId = req.params.langId;
	data.masterId = req.params.masterId;
	users.useInfo(data, async function(result){
		if (result && result.status === false) {
			await Promise.all([
				models.oauthaccesstoken.destroy({
					where: {user_id: req.params.id},
				}),
				models.saverefreshtoken.destroy({
					where: {user_id: req.params.id},
				}),
			]);
			res.status(401).end();
		} else {
			res.send({status: true, data: result});
		}
	});
});

/* Notification ON/OFF */
router.post('/setNotificationStatus', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	users.notificationStatus(data, function(result){
		res.send(result);
	});
});

/* Log out from app */
router.post('/appLogOut', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	users.appLogOut(data, function(result){
		res.send(result);
	});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
