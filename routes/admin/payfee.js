var fee = require('../../controllers/payfee');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'fee', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            fee.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* save  */
router.post('/save', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'fee', action:['add', 'edit']};
    //auth.checkPermissions(req, function(isPermission){
        //if (isPermission.status === true) {
        if(1){	
            fee.save(data, function(result){
               res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    //});
});

/* add */
router.post('/add', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'fee', action:'add'};
    //auth.checkPermissions(req, function(isPermission){
        //if (isPermission.status === true) {
        if(1){	
            fee.getMetaInformations(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    //});
});

/* edit  */
router.post('/edit/:id', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'fee', action:'edit'};
    //auth.checkPermissions(req, function(isPermission){
        //if (isPermission.status === true) {
        if (1) {	
            fee.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    //});
});

/* status  */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'fee', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            fee.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});


/* status  */
router.post('/fee-calc', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {

    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'fee', action:'status'};
    //auth.checkPermissions(req, function(isPermission){
        //if (isPermission.status === true) {
        if (1) {
        	
            fee.feeCalc(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    //});
});


router.post('/fee-calc-month', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {

    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'fee', action:'status'};
    //auth.checkPermissions(req, function(isPermission){
        //if (isPermission.status === true) {
        if (1) {
        	
            fee.feeCalcByMonth(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    //});
});



router.use(oauth.oauth.errorHandler());
module.exports = router;
