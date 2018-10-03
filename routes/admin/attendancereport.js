var attendancereport = require('../../controllers/attendancereport');
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
            req.roleAccess = {model:'attendancereport', action:'view'};
            auth.checkPermissions(req, function(isPermission){
                if (isPermission.status === true) {
                        res.send(data);
                } else {
                    res.send(isPermission);
                }
            });
});

router.post('/getSubjectsByInstitute', upload.array(), function (req, res) {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
                        data = JSON.parse(req.body.data);
            }
            attendancereport.getAllSubjectsByInstitute(data, function(result){
                res.send(result);
            });
});

/* GET  */
router.post('/getSubjectByTeacher', oauth.oauth.authorise(), upload.array(), function (req, res) {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
                        data = JSON.parse(req.body.data);
            }
            attendancereport.getAllSubjectsByTeacher(data, function(result){
                res.send(result);
            });
});

router.post('/getReport', upload.array(), function (req, res) {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
                        data = JSON.parse(req.body.data);
            }
            attendancereport.getReport(data, function(result){
                res.send(result);
            });
});

/* GET  */
router.post('/student', oauth.oauth.authorise(), upload.array(), function (req, res) {
            var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
            req.roleAccess = {model:'attendancereport', action:'view'};
            auth.checkPermissions(req, function(isPermission){
                if (isPermission.status === true) {
                        res.send(data);
                } else {
                    res.send(isPermission);
                }
            });
});

router.post('/getReportByStudent', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    attendancereport.getReportByStudent(data, function(result){
        res.send(result);
    });
});

router.post('/sendsms', oauth.oauth.authorise(), upload.array(), function (req, res) {
            req.roleAccess = {model:'attendancereport', action:'sms'};
            auth.checkPermissions(req, isPermission => {
                if (isPermission.status === true) {
                    var data = JSON.parse(req.body.data);
                    data.ids = JSON.parse(data.ids);
                    attendancereport.sendsms(data, function (result) {
                        res.send(result);
                    });
                } else {
                    res.send(isPermission);
                }
            });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
