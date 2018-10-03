var route = require('../../controllers/route');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var log = require('../../controllers/log');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
  req.roleAccess = {model:'route', action:'view'};
  auth.checkPermissions(req, function(isPermission){
      if (isPermission.status === true) {
        route.list(req, function(result){
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
    req.roleAccess = {model:'route', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            route.save(data, function(result){
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
    req.roleAccess = {model:'route', action:'add'};
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
    req.roleAccess = {model:'route', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            route.getById(data, function(result){
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
    req.roleAccess = {model:'route', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            route.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});


/* status  */
router.post('/getRoutes', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    route.getRoutes(data, function(result){
        res.send(result);
    });
});

router.post('/removeAddress', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    route.removeAddress(data, function(result){
        res.send(result);
    });
});

router.post('/viewAddress', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    route.viewAddress(data, function(result){
        res.send(result);
    });
});

router.post('/remove', oauth.oauth.authorise(), (req, res) => {
    req.roleAccess = {model:'route', action: 'delete'};
    auth.checkPermissions(req, isPermission => {
        if (isPermission.status === true) {
            Promise.resolve(req.body)
            .then(route.remove)
            .then(result => res.send(result))
            .catch(err => res.send(log(req, err)));
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
