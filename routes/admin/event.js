'use strict';

const fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	multer = require('multer'),
	event = require('../../controllers/event'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth'),
	formData = require('multer')().array();

const validFileTypes = ['.pdf', '.docx', '.doc', '.txt', '.xls', '.xlsx', '.xlsm', '.csv', '.png','.jpg','.jpeg','.jpe','.gif','.mp3','.amr','.aac',
	'.m4a','.wav','.3gp','.mp4','.avi','.wmv','.mov','.m4v','.ogx'
];

const uploadFile = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			let destFolder = tmpDir + 'events';
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
		let ext = path.extname(file.originalname).toLowerCase();
		if (validFileTypes.indexOf(ext) === -1) {
			cb('Invalid File Type');
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 5000000},
}).single('event_file');

router.post('/', authorise, formData, (req, res) => {
	req.roleAccess = {model:'event', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(event.list(req))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/add', authorise, formData, (req, res) => {
	req.roleAccess = {model:'event', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			event
				.getMetaInformations(req.body)
				.then(bcsmaps => res.send({status: true, bcsmaps}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, formData, (req, res) => {
	req.roleAccess = {model:'event', action:['edit', 'view']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(event.getById)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/view', authorise, formData, (req, res) => {
	req.roleAccess = {model:'event', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(event.getById)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model:'event', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			uploadFile(req, res, err => {
				if (err) {
					if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 5 MB';
					res.send({status: false, message: err.message || err.toString()});
					return;
				}
				let data = JSON.parse(req.body.event);
				if(req.file)
					data.file = req.file.path;
				Promise.resolve(data)
					.then(event.save)
					.then(result => res.send(result))
					.catch(err => res.send(log(req, err)));
			});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/remove', authorise, formData, (req, res) => {
	req.roleAccess = {model:'event', action:'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(event.remove)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/notification', authorise, formData, (req, res) => {
	req.roleAccess = {model:'event', action:'notification'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(event.notification)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;