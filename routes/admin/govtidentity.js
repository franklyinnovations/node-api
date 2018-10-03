var govtidentity = require('../../controllers/govtidentity');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'govtidentity', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            govtidentity.list(req, function(result){
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
    req.roleAccess = {model:'govtidentity', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            govtidentity.save(data, function(result){
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
    req.roleAccess = {model:'govtidentity', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            govtidentity.getMetaInformations(data, function(result){
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
    req.roleAccess = {model:'govtidentity', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            govtidentity.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* Update for React-Redux admin  */
router.post('/edit', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'govtidentity', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            govtidentity.getEditData(data, function(result){
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
    req.roleAccess = {model:'govtidentity', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            govtidentity.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/*list by country id  */
router.post('/listByCountryId', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    govtidentity.getGovtidentityByCountryId(data, function(result){
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
