'use strict';

const chat = require('../../controllers/chat'),
log = require('../../controllers/log'),
fs = require('fs'),
path = require('path'),
crypto = require('crypto'),
router = require('express').Router(),
multer = require('multer'),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
language = require('../../controllers/language');

const validFileTypes = ['.png','.jpg','.jpeg','.gif','.mp3','.amr', '.m4v', '.jpe', '.ogx',
	'.po', '.aac','.m4a','.mp4','.avi','.wmv','.mov','.pdf','.xls','.xlsx','.csv','.doc','.docx',
	'.txt', '.dot', '.3gp', '.dotx', '.wav',
];

const upload = (require('multer'))({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			let destFolder = 'public/uploads/messagefiles/';
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
			cb("Invalid File Type");
		} else {
			cb(null, true);
		}
	},
    limits: {fileSize: 50000000}
}),
formData = upload.none(),
uploadFile = upload.array('file', 1);

router.post('/nothing', authorise, (req, res) => {
	res.send({status: true});
});

router.post('/time', (req, res) => {
	Promise.resolve(true)
	.then(() => {
		let data = req.body.data ? JSON.parse(req.body.data) : req.body;
		return chat.time(data);
	})
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => {
		let data = req.body.data ? JSON.parse(req.body.data) : req.body;
		return chat.list(data);
	})
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/permissions', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => chat.permissions(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/messages', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => {
		let data = req.body.data ? JSON.parse(req.body.data) : req.body;
		data.limit = req.app.locals.site.page;
		return chat.messages(data);
	})
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/block', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => chat.block(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/unblock', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => chat.unblock(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/profile', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => chat.profile(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/profiles', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => chat.profiles(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/file', authorise, (req, res) => {
	uploadFile(req, res, err => {
		if (err) {
			res.send({
				status: false,
				message: language.lang({key: 'File upload failed', lang: req.body.lang}),
				uid: req.body.uid
			});
		} else {
			if (req.files.length) {
				res.send({
					status: true,
					url: req.files[0].path,
					uid: req.body.uid
				});
			} else {
				res.send({
					status: false,
					message: language.lang({key: 'File upload failed', lang: req.body.lang}),
					uid: req.body.uid
				});
			}

		}
	});
});

router.post('/students', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => chat.students(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/teachers', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => chat.teachers(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/admins', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => chat.admins(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/parents', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => chat.parents(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/institute', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => chat.institute(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/user', authorise, formData, (req, res) => {
	Promise.resolve(chat.user(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.use(oauth.errorHandler());
module.exports = router;