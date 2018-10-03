var assignment = require('../../controllers/assignment');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var path = require('path');
var async = require('async');
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

const validFileTypes = [".wav", ".mp3", ".weba", ".3gp", ".mp4", ".pdf", ".docx", ".doc", ".txt", ".ogg", ".png", ".jpg", ".jpeg", ".xls", ".xlsx", ".xlsm", ".wmv", ".csv"];

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var destFolder = tmpDir;
        if (!fs.existsSync(destFolder+file.fieldname)) {
            fs.mkdirSync(destFolder+file.fieldname);
        }
        cb(null, destFolder);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname+'/'+Date.now() + path.extname(file.originalname).toLowerCase());
    }
});
var uploadFile = multer({
  storage: storage,
	fileFilter: function (req, file, cb) {
        var ext = path.extname(file.originalname).toLowerCase();
        if (validFileTypes.indexOf(ext) === -1) {
          cb("Invalid File Type");
        } else {
          cb(null, true);
        }
    },
    limits: {fileSize: 50000000, fieldSize: 5000000}
}).any();


/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'assignment', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            assignment.list(req, function(result){
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
            if (err.code === 'LIMIT_FILE_SIZE') err = 'File size should be less than 50 MB';
            return res.send({status: false, message: err, data: []});
        }
        var data = req.body;
        if(typeof req.body.data !== 'undefined'){
            data = JSON.parse(req.body.data);
        }
        var count = 1;
        req.roleAccess = {model:'assignment', action:['add', 'edit']};
        auth.checkPermissions(req, function(isPermission){
            if (isPermission.status === true) {
                async.forEach(req.files, function (up_files, callback) {
                  if (up_files.path !=='') {
                    data[up_files.fieldname] = up_files.path;
                    data['assignment_type'] = up_files.mimetype;
                    data['assignment_size'] = up_files.size;
                    data['assignment_file_name'] = up_files.originalname;
                  }
                  if (req.files.length === count) {
                    callback(req.body);
                  }
                  count++;
                }, function () {
                    assignment.save(data, function(result){
                        res.send(result);
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
    req.roleAccess = {model:'assignment', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            assignment.getMetaInformations(data, function(result){
                res.send(result);
            });
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
    req.roleAccess = {model:'assignment', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            assignment.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/*
Update for React-Redux admin
*/
router.post('/edit', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    req.roleAccess = {model:'assignment', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            assignment.getEditData(data, function(result){
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
    data.assignment_status = req.params.status;
    req.roleAccess = {model:'assignment', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            assignment.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* delete assignment */
router.post('/delete/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'assignment', action:'delete'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            assignment.delete(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* getAllStudents */
router.post('/getStudents', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
                data = JSON.parse(req.body.data);
    }
    assignment.getAllStudents(data, function(result){
        res.send(result);
    });
});

/* save Remark  */
router.post('/saveRemark', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    assignment.saveRemark(data, function(result){
        res.send(result);
    });
});


router.post('/getSubjects', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    assignment.getSubjects(data, function(result){
        res.send(result);
    });
});

router.post('/bcsmaps', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    assignment.getMetaInformations(data, function(result){
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
