var utils = require('../../controllers/utils');
var {date_formats} = require('../../utils');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var log = require('../../controllers/log');

/* GET  */
router.post('/bcsByInstitute', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	utils.getAllbcsByInstitute(data, function(result){
		res.send(result);
	});
});

/* GET  */
router.post('/bcsByTeacher', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	utils.getAllbcsByTeacher(data, function(result){
		res.send(result);
	});
});

/* GET  */
router.post('/subjectByTeacher', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	utils.getSubjectByTeacher(data, function(result){
		res.send(result);
	});
});

/* GET  */
router.post('/subjectByInstitute', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	utils.getSubjectByInstitute(data, function(result){
		res.send(result);
	});
});

/* GET  */
router.post('/allBcsByMasterId', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	utils.getAllBcsByMasterId(data, function(result){
		res.send(result);
	});
});

/* GET  */
router.post('/filteredBcsByMasterId', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	utils.getFilteredBcsByMasterId(data, function(result){
		res.send(result);
	});
});

/* GET  */
router.post('/getNextAcademicSession', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	utils.getNextAcademicSession(data, function(result){
		res.send(result);
	});
});

/* GET  */
router.post('/getCurrentAcademicSession', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	utils.getAcademicSessionById(data, function(result){
		res.send(result);
	});
});

/* GET  */
router.post('/allBcsByMasterIdForTransfer', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	utils.getAllBcsByMasterIdForTransfer(data, function(result){
		res.send(result);
	});
});

router.post('/subjects', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(utils.subjects)
	.then(subjects => res.send({status: true, subjects}))
	.catch(err => res.send(log(req, err)));
});

/* GET  */
router.post('/studentsByBcsMapId', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(req.body)
		.then(utils.getStudentsByBcsMapId)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/timezones', function (req, res) {
	Promise.resolve(req.body)
		.then(utils.timezones)
		.then(data => res.send({status: true, data}))
		.catch(err => res.send(log(req, err)));
});

router.post('/date-formats', function (req, res) {
	res.send({
		status: true,
		data: date_formats,
	});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
