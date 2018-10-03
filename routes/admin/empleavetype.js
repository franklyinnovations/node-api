var empleavetype = require('../../controllers/empleavetype');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var log = require('../../controllers/log');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'empleavetype', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleavetype.list(req, function(result){
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
    req.roleAccess = {model:'empleavetype', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleavetype.save(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* add */
router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'empleavetype', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            res.send(data);
        } else {
            res.send(isPermission);
        }
    });
});

/* edit  */
router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'empleavetype', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleavetype.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* status  */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'empleavetype', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleavetype.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* getAllSections */
router.post('/list/:id', upload.array(), function (req, res) {
    var data = JSON.parse(req.body.data);
    data.id = req.params.id;
    empleavetype.getAllSection(data, function(result){
        res.send(result);
    });
});

router.post('/remove', oauth.oauth.authorise(), (req, res) => {
    req.roleAccess = {model:'empleavetype', action: 'delete'};
    auth.checkPermissions(req, isPermission => {
        if (isPermission.status === true) {
            Promise.resolve(req.body)
            .then(empleavetype.remove)
            .then(result => res.send(result))
            .catch(err => res.send(log(req, err)));
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
