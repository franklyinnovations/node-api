var question = require('../../controllers/question');
var utils = require('../../controllers/utils');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var async = require('async');
var log = require('../../controllers/log');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var destFolder = 'public/uploads/';
        if (!fs.existsSync(destFolder+file.fieldname)) {
            fs.mkdirSync(destFolder+file.fieldname);
        }
        //cb(null, destFolder);
        cb(null, "public/uploads/question_image")
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.' + mime.extension(file.mimetype));
    }
});
var uploadFile = multer({
  storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            cb('Only image files are allowed!', false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 1000000}
}).any();

var bulkUpload = multer({
  storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(xlsx|XLSX|xls|XLS)$/)) {
            cb('Only xlsx files are allowed!', false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 1000000}
}).any();

router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    question.getAddData(data, function(result){
        res.send(result);
    });
})

router.post('/save', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        var data = req.body;
        question.save(data, function(result) {
            res.send(result);
        })
    });
})

router.post('/upload-image', function (req, res) {
    uploadFile(req, res, function (err) {
        if(err) {
            res.send({status: false, message: err});
        } else {
            res.send({status: true, image_url: req.files[0].path});
        }
    });
})

router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;

    question.getById(data, function(result){
        res.send(result);
    });
})

router.post('/bulk-upload', oauth.oauth.authorise(), function (req, res) {
    bulkUpload(req, res, function (err) {
        if(err) {
            res.send({status: false, message: err});
        } else {
            //res.send({status: true, image_url: req.files[0].path});
            var data = req.body;
            data.file = req.files[0].path;
            question.bulkupload(data, function(result) {
                res.send(result);
            })
        }
    });
})

router.post('/save-bulk-question', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    question.saveBulkQuestions(data, function(result) {
        res.send(result);
    })
})

router.post('/', upload.array(), function (req, res) {
    question.list(req, function(result){
        res.send(result);
    });
})

router.post('/remove', oauth.oauth.authorise(), (req, res) => {
    Promise.resolve(req.body)
        .then(question.remove)
        .then(result => res.send(result))
        .catch(err => res.send(log(req, err)));
});

router.use(oauth.oauth.errorHandler());
module.exports = router;