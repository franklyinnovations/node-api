var mark = require('../../controllers/mark');
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
            mark.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* GET  */
router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'mark', action:['view', 'add']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
                mark.getScheduleExam(data, function(result){
                     res.send(result);
                });
        } else {
            res.send(isPermission);
        }
    });
});

/* save  */
router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    mark.save(data, function(result){
        res.send(result);
    });
});


router.post('/getStudents', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    mark.getAllStudents(data, function(result){
        res.send(result);
    });
});

router.post('/getSectionAndSubjects', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    mark.getSectionAndSubjects(data, function(result){
        res.send(result);
    });
});

router.post('/viewSubjects', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'mark', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            mark.viewSubjects(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'mark', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
                mark.getById(data, function(result){
                     res.send(result);
                });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/view/:examScheduleId/:bcsMapId', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.examScheduleId = req.params.examScheduleId;
    data.bcsMapId = req.params.bcsMapId;
    req.roleAccess = {model:'mark', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
                mark.view(data, function(result){
                     res.send(result);
                });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/viewMark', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'mark', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
                mark.viewMark(data, function(result){
                     res.send(result);
                });
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
