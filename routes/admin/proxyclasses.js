'use strict';

const proxy = require('../../controllers/proxy'),
log = require('../../controllers/log'),
router = require('express').Router(),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
auth = require('../../config/auth'),
language = require('../../controllers/language'),
formData = require('multer')().array();

router.post('/', authorise, formData, function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'proxy_classes', action:['add', 'view']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            proxy.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* add */
router.post('/add', authorise, formData, function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'proxy_classes', action:['add', 'view']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            proxy.getClasses(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* add */
router.post('/listPeriods', authorise, formData, function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'proxy_classes', action:['add', 'view']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            proxy.periods(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* add */
router.post('/listTeachers', authorise, formData, function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'proxy_classes', action:['add', 'view']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            proxy.teachers(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/save',authorise, formData, function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'proxy_classes', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            proxy.save(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/remove', authorise, formData, (req, res) => {
     var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'proxy_classes', action:'delete'};
    auth.checkPermissions(req, isPermission => {
        if (isPermission.status === true) {
            proxy.remove(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }

    });
}); 

router.use(oauth.errorHandler());
module.exports = router;
