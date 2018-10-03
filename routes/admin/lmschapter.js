'use strict';

const lmschapter = require('../../controllers/lmschapter'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth'),
	multer = require('multer'),
	fs = require('fs'),
	formData = multer().array(),
	path = require('path'),
	crypto = require('crypto');

const validFileTypes = ['.png','.jpg','.jpeg','.gif', '.mp4','.avi','.wmv','.mov','.pdf','.xls','.xlsx', '.ppt', '.pptx',
	'.doc','.docx', '.txt', '.webm', '.pps', '.3gp', '.WebM', '.MP4'
];
const uploadMultipleFile = multer({
		storage: multer.diskStorage({
			destination: (req, file, cb) => {
				let destFolder = tmpDir + 'lmsdocuments';
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
					Date.now() + crypto.randomBytes(8).toString('hex') +
					path.extname(file.originalname).toLowerCase()
				);
			}
		}),
		fileFilter: function (req, file, cb) {
			var ext = path.extname(file.originalname).toLowerCase();
			if (validFileTypes.indexOf(ext) === -1) {
				cb('Invalid File Type');
			} else {
				cb(null, true);
			}
		},
		limits: {fileSize: 25000000, fieldSize: 5000000},
	}),
	uploadDocsFile = uploadMultipleFile.any();

router.post('/', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmschapter', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmschapter.list(req))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/add', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmschapter', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			lmschapter
				.getMetaInformations(req.body.data ? JSON.parse(req.body.data) : req.body)
				.then(({bcsmaps, subjects}) => res.send({status: true, data: {}, bcsmaps, subjects}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmschapter', action:'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmschapter.getById(
				req.body.data ? JSON.parse(req.body.data) : req.body
			))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmschapter', action:['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmschapter.save(
				req.body.data ? JSON.parse(req.body.data) : req.body
			))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save-many', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmschapter', action: 'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(lmschapter.saveMany)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/status', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmschapter', action:'status'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmschapter.status(
				req.body.data ? JSON.parse(req.body.data) : req.body
			))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/topicList', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmschapter', action:'viewtopic'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmschapter.topicList(req.body))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/saveTopic', authorise, (req, res) => {
	uploadDocsFile(req, res, err => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') err = 'File size should less than 25 MB';
			return res.send({status: false, message: err, data: []});
		}
		req.roleAccess = {model:'lmschapter', action:['addtopic', 'edittopic']};
		auth.checkPermissions(req, isPermission => {
			if (isPermission.status) {
				let data = req.body.data ? JSON.parse(req.body.data) : req.body;
				let files = [];
				for (let i = req.files.length - 1; i >= 0; i--) {
					files.push({
						name: req.files[i].originalname,
						path: req.files[i].path,
						type: path.extname(req.files[i].originalname).toLowerCase(),
					});
				}
				data.lmstopicdocuments = files;
				Promise.resolve(lmschapter.saveTopic(data))
					.then(result => res.send(result))
					.catch(err => res.send(log(req, err)));
			} else {
				res.send(isPermission);
			}
		});
	});
});

router.post('/topicstatus', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmschapter', action:'topicstatus'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmschapter.topicstatus(
				req.body.data ? JSON.parse(req.body.data) : req.body
			))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/editTopic', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmschapter', action:'edittopic'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmschapter.getEditTopic(
				req.body.data ? JSON.parse(req.body.data) : req.body
			))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/deleteTopic', authorise, formData, (req, res) => {
	req.roleAccess = {model:'lmschapter', action:'deletetopic'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(lmschapter.deleteTopic(
				req.body
			))
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;