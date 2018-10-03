var imp = require('../../controllers/import');
var express = require('express');
var router = express.Router();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
const
	fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	multer = require('multer'),
	log = require('../../controllers/log');

const validFileTypes = ['.zip'];

const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			let destFolder = tmpDir + file.fieldname;
			fs.mkdir(destFolder, err => {
				if (err && err.code !== 'EEXIST') {
					cb('Internal Error');
				} else {
					cb(null, destFolder);
				}
			});
		},
		filename: (req, file, cb) => {
			cb(
				null,
				Date.now().toString(16) + crypto.randomBytes(4).toString('hex') +
				path.extname(file.originalname).toLowerCase()
			);
		}
	}),
	fileFilter: function (req, file, cb) {
		if (false && validFileTypes.indexOf(path.extname(file.originalname).toLowerCase()) === -1) {
			cb('Invalid File Type');
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 100000000}
});

const uploadZip = upload.single('sii-file');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	req.roleAccess = {model:'student', action:'importdata'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			res.send(data);
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/importStudent', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	req.roleAccess = {model:'student', action:'importdata'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			imp.importStudent(data, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/image', oauth.oauth.authorise(), (req, res) => {
	req.roleAccess = {model:'student', action:'importimage'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			uploadZip(req, res, err => {
				if (err) {
					if (err.code === 'LIMIT_FILE_SIZE') err = 'File size should less than 100 MB';
					res.send({status: false, message: err});
					return;
				}
				if (!req.file) {
					res.send({status: false, message: 'Please select a file.'});
					return;
				}
				req.body.file = req.file.path;
				Promise.resolve(req.body)
					.then(imp.image)
					.then(res.send.bind(res))
					.catch(err => res.send(log(req, err)));
			});
		} else {
			res.send(isPermission);
		}
	});
	
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
