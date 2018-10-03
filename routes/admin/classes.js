var classes = require('../../controllers/classes');
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

/* getweekdayClasses */
router.post('/teacherClass', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	classes.getAllTeacherClasses(data, function(result){
		res.send(result);
	});
});

/* getAllWeeklyClasses */
router.post('/teacherClassWeekly', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	classes.getAllTeacherClassesWeekly(data, function(result){
		res.send(result);
	});
});

/* get class Schedule  */
router.post('/classSchedule', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	classes.getAllClassSchedule(data, function(result){
		res.send(result);
	});
});

router.post('/teacherTimetable', oauth.oauth.authorise(), upload.none(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	classes.timetable(data, function(result){
		res.send(result);
	});
});

/* getStudentWeekdayClasses */
router.post('/studentClasses', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	classes.getStudentClasses(data, function(result){
		res.send(result);
	});
});

/* getStudentWeeklyClasses */
router.post('/studentClassWeekly', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	classes.getStudentClassesWeekly(data, function(result){
		res.send(result);
	});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
