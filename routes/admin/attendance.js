var attendance = require('../../controllers/attendance');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var notification = require('../../controllers/notification');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	attendance.init(data, function(result){
		res.send(result);
	});
});

/* save  */
router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	attendance.save(data, function(result){
		res.send(result);
	});
});

/* save  */
router.post('/update', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
  attendance.update(data, function(result){
      res.send(result);
  });
});


/* getAllClasses */
router.post('/getStudents', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
    data = JSON.parse(req.body.data);
  }
  attendance.getAllStudents(data, function(result){
      res.send(result);
  });
});

router.post('/pushNotiTest', upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	var deviceTokens = ['fU1klaQKUBA:APA91bEPovAMf6pZ7QawombK-qMTJU8I30A7WdM7j6RH11pC7Mgp0nU5qkxB7h5_QELYV5hjlxgULrr5HbeUzj6Y9_YeEBHFg1jXEJT_QDEhGYJ4prQ9liKnhis12c16NLSpV9ZqdPCx','e7tbVZ-QpIs:APA91bH0SbnbYVsJWLLdW2eDjPyjtfb1KgJB5AmfWIb3Rxr35qV8yg2Z_oUNL0aZ-5tGjElGPGptEHaXUwUFvQJUoraOm63lvu1KLglNNgRMLxP6U0WG3sYFp6Y37uE3_s7hENgxuGqg'];
	notification.sendNotification(data, deviceTokens, function(result){
		res.send(result);
	});
});

/*
* For react-redux admin 
*/
router.post('/list', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
    data = JSON.parse(req.body.data);
  }
  req.roleAccess = {model:'attendance', action:'view'};
  auth.checkPermissions(req, function(isPermission){
      if (isPermission.status === true) {
          attendance.list(data, function(result){
              res.send(result);
          });
      } else {
          res.send(isPermission);
      }
  });
});

/* get Class Students */
router.post('/getClassStudents', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
    data = JSON.parse(req.body.data);
  }
  attendance.getClassStudents(data, function(result){
      res.send(result);
  });
});

/* get Class Students */
router.post('/savenew', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
    data = JSON.parse(req.body.data);
  }
  attendance.savenew(data, function(result){
      res.send(result);
  });
});

router.post('/getFullDayData', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
    data = JSON.parse(req.body.data);
  }
  attendance.fullDayRecord(data, function(result){
    res.send(result);
  });
});

router.post('/bcsmaps', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
    data = JSON.parse(req.body.data);
  }
  attendance.getBcsmaps(data, function(result){
    res.send(result);
  });
});

router.post('/slot', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
    data = JSON.parse(req.body.data);
  }
  attendance.slot(data, function(result){
    res.send(result);
  });
});

router.post('/save-attendance', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
    data = JSON.parse(req.body.data);
  }
  attendance.saveAttendance(data, function(result){
    res.send(result);
  });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
