var studentmark = require('../../controllers/studentmark');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'mark', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            studentmark.getScheduleExam(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/getExamScheduleHead', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    studentmark.getExamScheduleHead(data, function(result){
        res.send(result);
    });
});

router.post('/getSectionAndSubjects', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    studentmark.getSectionAndSubjects(data, function(result){
        res.send(result);
    });
});

router.post('/getMarks', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    studentmark.getMarks(data, function(result){
        res.send(result);
    });
});



router.use(oauth.oauth.errorHandler());
module.exports = router;
