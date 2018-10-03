var holiday = require('../../controllers/holiday');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* add */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'holiday', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            res.send(data);
        } else {
            res.send(isPermission);
        }
    });
});

/* save  */
router.post('/addEvent', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'holiday', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            holiday.save(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* GET  */
router.post('/events', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'holiday', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            holiday.eventList(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/removeEvent', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'holiday', action:'delete'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            holiday.removeEvent(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
