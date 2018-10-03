'use strict';

const
	fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	parentvehicle = require('../../controllers/parentvehicle'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth'),
	multer = require('multer'),
	language = require('../../controllers/language');


const validFileTypes = ['.png','.jpg','.jpeg','.gif','.mp3','.amr', '.m4v', '.jpe', '.ogx',
	'.po', '.aac','.m4a','.mp4','.avi','.wmv','.mov','.pdf','.xls','.xlsx','.csv','.doc','.docx',
	'.txt', '.dot', '.3gp', '.dotx', '.wav',
];

const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			let destFolder = 'public/uploads/' + file.fieldname;
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
		if (validFileTypes.indexOf(path.extname(file.originalname).toLowerCase()) === -1) {
			cb('Invalid File Type');
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 1000000}
});


const uploadFiles = upload.fields([
	{ name: 'vehicle_image', maxCount: 1 },
	{ name: 'vehicle_document', maxCount: 1 },
	{ name: 'pollution_control_certificate', maxCount: 1 },
	{ name: 'insurance_certificate', maxCount: 1 },
]);

router.post('/', authorise, (req, res) => {
	req.roleAccess = {model:'parentvehicle', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req)
				.then(parentvehicle.list)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, (req, res) => {
	req.roleAccess = {model:'parentvehicle', action: ['add', 'edit']};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			uploadFiles(req, res, err => {
				if (err) {
					if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 1 MB';
					return res.send({status: false, message: err, data: []});
				}
				const data = req.body;
				addFile(req, data, 'vehicle_image');
				addFile(req, data, 'vehicle_document');
				addFile(req, data, 'pollution_control_certificate');
				addFile(req, data, 'insurance_certificate');
				Promise.resolve(data)
					.then(parentvehicle.save)
					.then(data => res.send(data))
					.catch(err => res.send(log(req, err)));
			});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit', authorise, (req, res) => {
	req.roleAccess = {model:'parentvehicle', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(parentvehicle.get)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/remove', authorise, (req, res) => {
	req.roleAccess = {model:'parentvehicle', action: 'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(parentvehicle.remove)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/status', authorise, (req, res) => {
	req.roleAccess = {model:'parentvehicle', action: 'status'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(parentvehicle.status)
				.then(() => res.send({
					status: true,
					message: language.lang({key: 'updatedSuccessfully', lang: req.lang}),
				}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/sendemail', authorise, (req, res) => {
	req.roleAccess = {model:'parentvehicle', action:'sendemail'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status) {
			Promise.resolve(req.body)
				.then(parentvehicle.sendemail)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

function addFile(req, data, name) {
	if (req.files[name] && req.files[name].length) {
		data[name] = req.files[name][0].path;
	}
}

router.use(oauth.errorHandler());
module.exports = router;
