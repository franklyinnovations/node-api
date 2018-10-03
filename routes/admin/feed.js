'use strict';

const
	fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	multer = require('multer'),
	router = require('express').Router(),
	log = require('../../controllers/log'),
	feed = require('../../controllers/feed'),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth');

const validFileTypes = ['.png','.jpg','.jpeg','.jpe','.gif','.mp3','.amr','.aac',
	'.m4a','.wav','.3gp','.mp4','.avi','.wmv','.mov','.m4v','.ogx'
];

const uploadMultipleFile = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			let destFolder = tmpDir + 'feeds';
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
	limits: {fileSize: 10000000, fieldSize: 5000000},
}).any();


router.post('/', authorise, (req, res) => {
	req.roleAccess = {model:'feed', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req)
				.then(feed.list)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model:'feed', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			uploadMultipleFile(req, res, err => {
				if (err) {
					if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 5 MB';
					res.send({status: false, message: err});
					return;
				}
				req.body.userId = req.user.id;
				req.body.feedrecords = req.files.map(item => ({
					file: item.path,
				}));
				Promise.resolve(req.body)
					.then(feed.save)
					.then(result => res.send(result))
					.catch(err => res.send(log(req, err)));
			});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/remove', authorise, (req, res) => {
	req.roleAccess = {model:'feed', action: 'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			req.body.userId = req.user.id;
			Promise.resolve(req.body)
				.then(feed.remove)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/like', authorise, (req, res) => {
	req.roleAccess = {model:'feed', action: 'like'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			req.body.userId = req.user.id;
			Promise.resolve(req.body)
				.then(feed.like)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/unlike', authorise, (req, res) => {
	req.roleAccess = {model:'feed', action: 'like'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			req.body.userId = req.user.id;
			Promise.resolve(req.body)
				.then(feed.unlike)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/approve', authorise, (req, res) => {
	req.roleAccess = {model:'feed', action: 'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			req.body.userId = req.user.id;
			Promise.resolve(req.body)
				.then(feed.approve)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/control-users', authorise, (req, res) => {
	req.roleAccess = {model:'feed', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			req.body.userId = req.user.id;
			Promise.resolve(req.body)
				.then(feed.controlUsers)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;