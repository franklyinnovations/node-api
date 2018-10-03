var vehicle = require('../../controllers/vehicle');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var mime = require('mime');
var fs = require('fs');
var async = require('async');
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var log = require('../../controllers/log');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var destFolder = 'public/uploads/';
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
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        cb('Only image files are allowed!', false);
    }
    cb(null, true);
  },
   limits: {fileSize: 1000000}
}).any();

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
  req.roleAccess = {model:'vehicle', action:'view'};
  auth.checkPermissions(req, function(isPermission){
      if (isPermission.status === true) {
        vehicle.list(req, function(result){
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
        req.roleAccess = {model:'vehicle', action:['edit','add']};
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
                    vehicle.save(data, function(result){
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
    req.roleAccess = {model:'vehicle', action:'add'};
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
    req.roleAccess = {model:'vehicle', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            vehicle.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* status  */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'vehicle', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            vehicle.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/remove', oauth.oauth.authorise(), (req, res) => {
    req.roleAccess = {model:'vehicle', action: 'delete'};
    auth.checkPermissions(req, isPermission => {
        if (isPermission.status === true) {
            Promise.resolve(req.body)
            .then(vehicle.remove)
            .then(result => res.send(result))
            .catch(err => res.send(log(req, err)));
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
