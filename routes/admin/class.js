const classes = require('../../controllers/class');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const oauth = require('../../config/oauth');
const auth = require('../../config/auth');
const log = require('../../controllers/log');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'class', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            classes.list(req, function(result){
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
    req.roleAccess = {model:'class', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            classes.save(data, function(result){
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
    req.roleAccess = {model:'class', action:'add'};
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
    req.roleAccess = {model:'class', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            classes.getById(data, function(result){
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
    req.roleAccess = {model:'class', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            classes.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* getAllClasses */
router.post('/list/:id', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.masterId = req.params.id;
    classes.getAllClasses(data, function(result){
        res.send(result);
    });
});

router.post('/remove', (req, res) => {
    Promise.resolve(req.body)
    .then(classes.remove)
    .then(result => res.send(result))
    .catch(err => res.send(log(req, err)));
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
