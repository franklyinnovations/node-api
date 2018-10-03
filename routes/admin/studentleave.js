var studentleave = require('../../controllers/studentleave');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	studentleave.list(req, function(result){
		res.send(result);
	});
});

/* GET  */
router.post('/list', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	if (data.user_type == 'teacher') {
		studentleave.teacherlist(req, function(result){
			res.send(result);
		});
	} else {
		studentleave.institutelist(req, function(result){
			res.send(result);
		});
	}
});

/* save  */
router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}

	studentleave.save(data, function(result){
		res.send(result);
	});
});

/* add */
router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	studentleave.leaveTags(data, function(result){
		res.send(result);
	});
});

/* status  */
router.post('/status/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;
	data.leavestatus = 2;
	studentleave.st_status(data, function(result){
		res.send(result);
	});
});

/* status  */
router.post('/leavestatus/:id/:leavestatus', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;
	data.leavestatus = req.params.leavestatus;
	studentleave.status(data, function(result){
		res.send(result);
	});
});

router.post('/view', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	studentleave.view(data, function(result){
		res.send(result);
	});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
