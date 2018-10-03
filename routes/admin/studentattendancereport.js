var studentreport = require('../../controllers/studentreport');
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

router.post('/getReport', upload.array(), function (req, res) {
  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
  }
  studentreport.getReport(data, function(result){
      res.send(result);
  });
});

/* GET  */
router.post('/calander', oauth.oauth.authorise(), upload.array(), function (req, res) {
  var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    res.send(data);
});

router.post('/getReportByStudent', upload.array(), function (req, res) {
  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
  }
  studentreport.getReportByStudent(data, function(result){
      res.send(result);
  });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
