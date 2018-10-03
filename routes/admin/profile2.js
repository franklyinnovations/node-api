'use strict';

const
	fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	multer = require('multer'),
	router = require('express').Router(),
	log = require('../../controllers/log'),
	image = require('../../controllers/image'),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	profile2 = require('../../controllers/profile2');

const validFileTypes = ['.png', '.jpeg', '.jpg'],
	validDocuments = ['.pdf', '.doc', '.docx'];

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
		let ext = path.extname(file.originalname).toLowerCase();
		if (file.fieldname.startsWith('qualification-image') && validDocuments.indexOf(ext) === -1) {
			cb(null, true);
		} else if (validFileTypes.indexOf(ext) === -1) {
			cb('Invalid File Type');
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 1000000}
});

const uploadUserProfileFiles = upload.fields([
	{ name: 'user_image', maxCount: 1 },
	{ name: 'signature', maxCount: 1 },
]);

const uploadDocuments = upload.any();
const formData = upload.none();

router.post('/', authorise, (req, res) => {
	req.body.userId = req.user.id;
	Promise.resolve(req.body)
		.then(profile2.getById)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/save-user', authorise, (req, res) => {
	uploadUserProfileFiles(req, res, err => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 1 MB';
			res.send({status: false, message: err});
			return;
		}
		req.body.userId = req.user.id;
		req.body.id = req.user.id;
		if (req.files.user_image) req.body.user_image = req.files.user_image[0].path;
		if (req.files.signature) req.body.signature = req.files.signature[0].path;
		Promise.resolve(req.body)
			.then(profile2.saveUserProfile)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
	});
});

router.post('/save-teacher', authorise, (req, res) => {
	uploadDocuments(req, res, err => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 1 MB';
			res.send({status: false, message: err});
			return;
		}
		req.body.userId = req.user.id;
		for (let i = 0; i < req.files.length; i++)
			req.body[req.files[i].fieldname]  = req.files[i].path;
		let optmizations = [],
			qualifications = JSON.parse(req.body.teacherdetail.qualifications || '[]');
		for (let i = qualifications.length - 1; i >= 0; i--) {
			optmizations.push(
				image.optimizeImageByPath(
					req.body['qualification-image-' + qualifications[i].display_order],
					qualifications[i].image,
				)
					.then(path => {
						if (path) qualifications[i].image = path;
					})
			);
		}
		Promise.all(optmizations)
			.then(() => {
				req.body.qualifications = JSON.stringify(qualifications);
				return req.body;
			})
			.then(() => req.body)
			.then(profile2.saveTeacherProfile)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
	});
});

router.post('/save-institute', authorise, formData, (req, res) => {
	Promise.resolve(req.body)
		.then(profile2.saveInstituteProfile)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/save-digests', authorise, (req, res) => {
	req.body.userId = req.user.id;
	Promise.resolve(req.body)
		.then(profile2.saveDigests)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.use(oauth.errorHandler());
module.exports = router;