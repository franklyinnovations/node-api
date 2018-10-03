'use strict';

const ticket = require('../../controllers/ticket'),
fs = require('fs'),
path = require('path'),
crypto = require('crypto'),
router = require('express').Router(),
multer = require('multer'),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
auth = require('../../config/auth'),
language = require('./language');

const validFileTypes = ['.png', '.jpeg', '.jpg', '.mp4'];

const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			var destFolder = 'public/uploads/ticketfiles/';
			fs.access(destFolder, err => {
				if (err) {
					fs.mkdir(destFolder, () => cb(null, destFolder));
				} else {
					cb(null, destFolder);
				}
			});
		},
		filename: (req, file, cb) => {
			cb(
				null,
				Date.now() + crypto.randomBytes(8).toString('hex') +
				path.extname(file.originalname).toLowerCase()
			);
		}
	}),
	fileFilter: function (req, file, cb) {
		var ext = path.extname(file.originalname).toLowerCase();
		if (validFileTypes.indexOf(ext) === -1) {
			cb("Invalid File Type");
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 50000000},
}),
formData = upload.none(),
uploadFile = upload.any();

router.post('/', authorise, formData, (req, res) => {
	req.roleAccess = {model:'ticket', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status) {
			ticket.list(req, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/add', authorise, formData, (req, res) => {
	req.roleAccess = {model:'ticket', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status) {
			res.send({});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	uploadFile(req, res, err => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 50 MB';
			return res.send({status: false, message: err, data: []});
		}
		req.roleAccess = {model:'ticket', action:['add', 'edit']};
		auth.checkPermissions(req, isPermission => {
			if (isPermission.status) {
				var data = req.body;
				data = data.data === undefined ? data : JSON.parse(data.data);
				var files = [];
				for (var i = req.files.length - 1; i >= 0; i--) {
					files.push(req.files[i].path);
				}
				data.ticket.ticketmessage.files = JSON.stringify(files);
				ticket.save(data, result => res.send(result));
			} else {
				res.send(isPermission);
			}
		});
	});
});

router.post('/edit/:id', authorise, formData, (req, res) => {
	req.roleAccess = {model:'ticket', action: ['edit', 'view']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status) {
			req.body.id = req.params.id;
			ticket.getById(req.body, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/message', authorise, (req, res) => {
	uploadFile(req, res, err => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 50 MB';
			return res.send({status: false, message: err, data: []});
		}
		req.roleAccess = {model:'ticket', action:'edit'};
		auth.checkPermissions(req, isPermission => {
			if (isPermission.status) {
				var data = req.body;
				data = data.data === undefined ? data : JSON.parse(data.data);
				var files = [];
				for (var i = req.files.length - 1; i >= 0; i--) {
					files.push(req.files[i].path);
				}
				data.ticketmessage.files = JSON.stringify(files);
				ticket.message(data, result => res.send(result));
			} else {
				res.send(isPermission);
			}
		});
	});
});

router.post('/status/:id/:status', authorise, formData, (req, res) => {
	req.roleAccess = {model:'ticket', action:'status'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			req.body.id = req.params.id;
			req.body.status = req.params.status;
			ticket.status(req.body, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});
router.use(oauth.errorHandler());
module.exports = router;
