var exampaper = require('../../controllers/exampapers');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var oauth = require('../../config/oauth');
var async = require('async');
var log = require('../../controllers/log');

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

/* edit */
router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;

	exampaper.getById(data, function(result){
		res.send(result);
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

		data.sections = data.sections ? data.sections.split(',') : [];

		var count = 1;
		async.forEach(req.files, function (up_files, callback) {
			if (up_files.path !=='') {
				data[up_files.fieldname] = up_files.path;
			}
			if (req.files.length == count) {
				callback(req.body);
			}
			count++;
		}, function () {
			exampaper.save(data, function(result){
				res.send(result);
			});
		});
	});
});

/* status update */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;
	data.is_active = req.params.status;

	exampaper.status(data, function(result){
		res.send(result);
	});
});

/* publish status update */
router.post('/publish/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;
	data.is_published = req.params.status;

	exampaper.status(data, function(result){
		res.send(result);
	});
});

/* index */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	exampaper.list(req, function(result){
		res.send(result);
	});
});

/* get mapped queestion */
router.post('/get-mapped-question/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;

	exampaper.getMappedQuestion(data, function(result){
		res.send(result);
	});
});

router.post('/remove', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
		.then(exampaper.remove)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.use(oauth.oauth.errorHandler());
module.exports = router;