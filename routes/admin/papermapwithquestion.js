var papermapwithquestion = require('../../controllers/papermapwithquestion');
var exampaper = require('../../controllers/exampapers');
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

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
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

router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    papermapwithquestion.list(data, function(result){
        res.send(result);
    });
})

router.post('/exampaperlist', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    exampaper.listForMapQustion(data, function(result){
        res.send(result);
    });
})

router.post('/getpaperandquestion', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    papermapwithquestion.paperandquestiondata(data, function(result){
        res.send(result);
    });
})

router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    papermapwithquestion.save(data, function(result){
        res.send(result);
    });
})

router.use(oauth.oauth.errorHandler());
module.exports = router;