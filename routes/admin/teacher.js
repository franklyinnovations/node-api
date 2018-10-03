var teacher = require('../../controllers/teacher');
var image = require('../../controllers/image');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var async = require('async');
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var path = require('path'),
crypto = require('crypto');


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
        if (file.fieldname.startsWith('qualification-image')
            && file.originalname.match(/\.(pdf|doc|docx)$/i)) {
            cb(null, true);
        } else if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            cb('Invalid File Type', false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 1000000}
}).any();


const validFileTypes = ['.png', '.jpeg', '.jpg', '.mp4'];
const uploadEmail = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            var destFolder = 'public/uploads/email_attachement/';
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
    limits: {fileSize: 50000000}
}),
uploadEmailFile = uploadEmail.any();


/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'teacher', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            teacher.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
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
        var count = 1;
        req.roleAccess = {model:'teacher', action:['add', 'edit']};
        auth.checkPermissions(req, function(isPermission){
            if (isPermission.status === true) {
                async.forEach(req.files, function (up_files, callback) {
                  if (up_files.path !=='') {
                    data[up_files.fieldname] = up_files.path;
                  }
                  if (req.files.length == count) {
                    callback(req.body);
                  }
                  count++;
                }, function () {
                    if (data.user_image === undefined && data.teacher.gender) {
                        data.user_image = 'public/uploads/icon/'+data.teacher.gender+'.png';
                    } else if(data.user_image === 'public/uploads/icon/male.png' || data.user_image === 'public/uploads/icon/female.png' ){
                        data.user_image = 'public/uploads/icon/'+data.teacher.gender+'.png';
                    }
                    var optmizations = [];
                    var qualifications = JSON.parse(data.teacher_detail.qualifications || '[]');
                    for (var i = qualifications.length - 1; i >= 0; i--) {
                        (function (qualification) {
                            optmizations.push(
                                image.optimizeImageByPath(
                                    data['qualification-image-' + qualification.display_order],
                                    qualifications[i].image
                                )
                                .then(path => {
                                    if (path) qualification.image = path;
                                })
                            )
                        })(qualifications[i]);
                    }
                    Promise.all(optmizations)
                    .then(() => {
                        data.teacher_detail.qualifications = JSON.stringify(qualifications);
                        teacher.save(data, function(result){
                            res.send(result);
                        });
                    });
                });
            } else {
                res.send(isPermission);
            }
        });
    });
});

/* add */
router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'teacher', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            res.send(data);
        } else {
            res.send(isPermission);
        }
    });
});

/* edit  */
router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    req.roleAccess = {model:'teacher', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            teacher.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* status */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'teacher', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            teacher.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/send_login_info/:id', upload.array(), function (req, res) {
    var data = req.body.data ? JSON.parse(req.body.data) : req.body;
    data.id = parseInt(req.params.id);
    req.roleAccess = {model:'teacher', action:'sendsms'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			teacher.sendLoginInfo(data, function (result) {
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/sendsms', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body.data ? JSON.parse(req.body.data) : req.body;
    data.ids = JSON.parse(data.ids);
    req.roleAccess = {model:'teacher', action:'sendsms'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			teacher.sendsms(data, function (result) {
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/viewSubjects', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    teacher.viewSubjects(data, function(result){
        res.send(result);
    });
});

router.post('/sendemail', oauth.oauth.authorise(), (req, res) => {
    uploadEmailFile(req, res, err => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 50 MB';
            return res.send({status: false, message: err, data: []});
        }
        req.roleAccess = {model:'teacher', action:'sendemail'};
        auth.checkPermissions(req, isPermission => {
            if (isPermission.status) {
                var data = req.body;
                data = data.data === undefined ? data : JSON.parse(data.data);
                data.ids = JSON.parse(data.ids);
                var files = [];
                for (var i = req.files.length - 1; i >= 0; i--) {
                    files.push(req.files[i]);
                }
                data.files = files;
                teacher.sendemail(data, result => res.send(result));
            } else {
                res.send(isPermission);
            }
        });
    });
});

router.post('/remove', oauth.oauth.authorise(), (req, res) => {
    req.roleAccess = {model:'teacher', action: 'delete'};
    auth.checkPermissions(req, isPermission => {
        if (isPermission.status === true) {
            Promise.resolve(req.body)
            .then(teacher.remove)
            .then(result => res.send(result))
            .catch(err => res.send(log(req, err)));
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
