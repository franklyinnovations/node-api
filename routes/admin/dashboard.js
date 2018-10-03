var dashboard = require('../../controllers/dashboard');
var fee = require('../../controllers/fee');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
  res.send(data);
});

router.post('/teacherbyinstitute', upload.array(), function (req, res) {
	let data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	dashboard.getTeacherbyinstitute(data, function(result){
		res.send(result);
	});
});


/* getAllTeacher */
router.post('/teacherbyinstitute/:masterId', upload.array(), function (req, res) {
  var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.masterId = req.params.masterId;
	dashboard.getTeacherbyinstitute(data, function(result){
			res.send(result);
	});
});

/* getAllStudent */
router.post('/studentbyinstitute/:id', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    dashboard.getStudentbyinstitute(data, function(result){
        res.send(result);
    });
});

/* getAllStudentBySession */
router.post('/studentbyinstitutesession/:id', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    dashboard.getStudentbyinstitutesession(data, function(result){
        res.send(result);
    });
});

/* getAllLastThreeSessionsStudents */
router.post('/fewsessionstudents/:id', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    dashboard.getFewsessionstudents(data, function(result){
        res.send(result);
    });
});


/* getAllClasses */
router.post('/classesbyinstitute/:id', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    dashboard.getClassesbyinstitute(data, function(result){
        res.send(result);
    });
});

/* getAllAssignedClasses */
router.post('/totalAssignedClassesByTeacher', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    dashboard.getTotalAssignedClasses(data, function(result){
        res.send(result);
    });
});

/* getAllAssignedClasses */
router.post('/totalAssignedPeriodsByTeacher', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    dashboard.getTotalAssignedPeriods(data, function(result){
        res.send(result);
    });
});

/* getAllAssignmentPosted */
router.post('/totalAssignmentByTeacher', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    dashboard.getTotalAssignment(data, function(result){
        res.send(result);
    });
});

/*  emailSend */
router.post('/mailsenddashboard', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    dashboard.sendMaildashboard(data, function(result){
        res.send(result);
    });
});

/* getTimetableByClasses */
router.post('/timetable', upload.array(), function (req, res) {
  var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	dashboard.getTimetable(data, function(result){
		res.send(result);
	});
});

router.post('/userinfo', upload.array(), function (req, res) {
  var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	dashboard.useInfo(data, function(result){
		res.send(result);
	});
});

router.post('/superadmin', upload.none(), function (req, res) {
	dashboard.superadmin(
		req.body.data ? JSON.parse(req.body.data) : req.body,
		result => res.send(result)
	);
});

router.post('/teacher-app', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	dashboard.teacherApp(data, function(result){
		res.send(result);
	});
});

/*
* Functions for redux admin
*/
router.post('/dashboard', oauth.oauth.authorise(), upload.array(), function (req, res) {
  	let data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	if(data.user_type === 'institute' || data.user_type === 'admin'){
		dashboard.getDashboardInstitute(data, function(result){

			result['due_fee']= 0;
			result['pay_fee']= 0;

			res.send(result);

		});
	} else {
		res.send({
	        status:true,
	        teachers: {count:0},
	        totalstudents: 0,
	        classes: 0,
	        academicsession_students: 0,
	        due_fee:0,
	        pay_fee:0	
      	});
	}
});


router.use(oauth.oauth.errorHandler());
module.exports = router;
