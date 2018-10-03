var empleave = require('../../controllers/empleave');
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
    req.roleAccess = {model:'empleave', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            if (data.user_type == 'institute' || data.user_type == 'admin') {
                empleave.institutelist(req, function(result){
                    res.send(result);
                });
            } else {
                empleave.list(req, function(result){
                    res.send(result);
                });
            }
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/view/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'empleave', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleave.view(data, function(result){
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
    req.roleAccess = {model:'empleave', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleave.save(data, function(result){
                res.send(result);
            });
         } else {
            res.send(isPermission);
        }
    });
});

/* add */
router.post('/apply', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'empleave', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleave.leaveTagsAndLeaveTypes(data, function(result){
                res.send(result);
            });
         } else {
            res.send(isPermission);
        }
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
    req.roleAccess = {model:'empleave', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleave.empleave_status(data, function(result){
                res.send(result);
            });
         } else {
            res.send(isPermission);
        }
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
    req.roleAccess = {model:'empleave', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            if(parseInt(data.leavestatus) === 2){
                empleave.empleave_status(data, function(result){
                    res.send(result);
                });
            } else {
                empleave.status(data, function(result){
                    res.send(result);
                });
            }
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/reject', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'empleave', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleave.reject(data, function(result){
                res.send(result);
            });
         } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
