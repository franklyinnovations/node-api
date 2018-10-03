var mystudent = require('../../controllers/mystudent');
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
    res.send(data);
});

/* getAllClasses */
router.post('/teacherStudent', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    mystudent.getAllTeacherStudents(data, function(result){
        res.send(result);
    });
});

router.post('/sendsms', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    mystudent.sendsms(data, function (result) {
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
