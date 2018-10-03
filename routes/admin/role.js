var role = require('../../controllers/role');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var log = require('../../controllers/log');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'role', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            role.list(req, function(result){
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
    req.roleAccess = {model:'role', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            role.save(data, function(result){
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
    req.roleAccess = {model:'role', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            role.getMetaInformations(data, function(result){
                res.send(result);
            });
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
    req.roleAccess = {model:'role', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            role.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/*
Update for React-Redux admin
*/
router.post('/edit', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'role', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            role.getEditData(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* status */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'role', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            role.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});


/* getAllRole */
router.post('/list/:masterId', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.masterId = req.params.masterId;
    role.getAllRole(data, function(result){
        res.send(result);
    });
});

/* getEmpAttendanceRole */
router.post('/attrolelist/:masterId', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.masterId = req.params.masterId;
    role.getEmpAttendanceRole(data, function(result){
        res.send(result);
    });
});

/* getAllRole */
router.post('/getAutoRoleId/:id/:slug', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.masterId = req.params.id;
    data.slug = req.params.slug;
    role.getAutoRoleId(data, function(result){
        res.send(result);
    });
});

router.post('/remove', oauth.oauth.authorise(), (req, res) => {
    req.roleAccess = {model:'role', action: 'delete'};
    auth.checkPermissions(req, isPermission => {
        if (isPermission.status === true) {
            Promise.resolve(req.body)
            .then(role.remove)
            .then(result => res.send(result))
            .catch(err => res.send(log(req, err)));
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
