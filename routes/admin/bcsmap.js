const bcsmap = require('../../controllers/bcsmap');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const oauth = require('../../config/oauth');
const auth = require('../../config/auth');
const log = require('../../controllers/log');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'bcsmap', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            bcsmap.list(req, function(result){
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
    req.roleAccess = {model:'bcsmap', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            bcsmap.save(data, function(result){
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
    req.roleAccess = {model:'bcsmap', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            res.send(data);
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
    req.roleAccess = {model:'bcsmap', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            bcsmap.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* status  */
router.post('/remove/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'bcsmap', action:'delete'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            bcsmap.remove(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* getFilteredSections */
router.post('/getFilteredSections', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    bcsmap.getFilteredSections(data, function(result){
      res.send(result);
    });
});

router.post('/boards', oauth.oauth.authorise(), (req, res) => {
    Promise.resolve(req.body)
    .then(bcsmap.boards)
    .then(boards => res.send({status: true, boards}))
    .catch(err => res.send(log(req, err)));
});

router.post('/all', oauth.oauth.authorise(), (req, res) => {
    Promise.resolve(req.body)
    .then(bcsmap.all)
    .then(data => res.send({status: true, data}))
    .catch(err => res.send(log(req, err)));
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
