'use strict';

const complaint = require('../../controllers/complaint'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth'),
	fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	multer = require('multer');

const validFileTypes = ['.png', '.jpeg', '.jpg', '.mp4'];

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		let destFolder = 'public/uploads/complaintfiles/';
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
});

const uploadFile = multer({
	storage: storage,
	fileFilter: function (req, file, cb) {
		if (validFileTypes.indexOf(path.extname(file.originalname).toLowerCase()) === -1) {
			cb('Invalid File Type');
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 5000000}
}).single('image');


router.post('/', authorise, (req, res) => {
	req.roleAccess = {model:'complaints', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req)
				.then(complaint.list)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/add', authorise, (req, res) => {
	req.roleAccess = {model:'complaints', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(complaint.tags)
				.then(tags => res.send({status: true, tags}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

/* add */
router.post('/listStudents', authorise, (req, res) => {
	req.roleAccess = {model:'complaints', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(complaint.getStudentsByBcsmap)
				.then(({data}) => res.send({status: true, data}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});


router.post('/save', authorise, (req, res) => {
	uploadFile(req, res, function (err) {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 5 MB';
			return res.send({status: false, message: err, data: []});
		}
		req.body.image = req.file ? req.file.path : null;
		req.roleAccess = {model:'complaints', action:['add', 'edit']};
		auth.checkPermissions(req, function(isPermission){
			if (isPermission.status === true) {
				Promise.resolve(req.body)
					.then(complaint.save)
					.then((result) => res.send(result))
					.catch(err => res.send(log(req, err)));
			} else {
				res.send(isPermission);
			}
		});
	});
});

router.post('/view', authorise, (req, res) => {
	req.roleAccess = {model:'complaints', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(complaint.getById)
				.then(complaint => res.send({status: true, complaint}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;
