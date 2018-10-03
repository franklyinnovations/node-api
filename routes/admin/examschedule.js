var examschedule = require('../../controllers/examschedule');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var log = require('../../controllers/log');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'examschedule', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            examschedule.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/save2', oauth.oauth.authorise(), upload.array(), (req, res) => {
    req.roleAccess = {'model': 'examschedule', action: ['add', 'edit']};
    auth.checkPermissions(req, isPermission => {
        if (isPermission.status === true) {
            Promise.resolve(
                examschedule.save2(
                    req.body.data ? JSON.parse(req.body.data) : req.body
                )
            )
            .then(result => res.send(result))
            .catch(err => res.send(log(req, err)))
        } else {
            res.send(isPermission);
        }
    })
});

/* save  */
router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'examschedule', action:['edit', 'add']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            examschedule.save(data, function(result){
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
    req.roleAccess = {model:'examschedule', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            res.send(data);
        } else {
            res.send(isPermission);
        }
    });
});

/* edit  */
router.post('/edit/:id/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'examschedule', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            examschedule.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/edit', oauth.oauth.authorise(), upload.array(), (req, res) => {
    req.roleAccess = {'model': 'examschedule', action: 'edit'};
    auth.checkPermissions(req, isPermission => {
        if (isPermission.status === true) {
            Promise.resolve(
                examschedule.getDataById(
                    req.body.data ? JSON.parse(req.body.data) : req.body
                )
            )
            .then(result => res.send(result))
            .catch(err => res.send(log(req, err)))
        } else {
            res.send(isPermission);
        }
    })
});

/* status  */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'examschedule', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            examschedule.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* status  */
router.post('/hasactivity/:id/:has_activity', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    data.has_activity = req.params.has_activity;
    //req.roleAccess = {model:'examschedule', action:'status'};
        examschedule.status(data, function(result){
            res.send(result);
        });
});


router.post('/scheduleClasses', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    examschedule.scheduleClasses(data, function(result){
        res.send(result);
    });
});

router.post('/examSchedule', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    examschedule.examSchedule(data, function(result){
        res.send(result);
    });
});

router.post('/viewSchedule', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    examschedule.viewSchedule(data, function(result){
        res.send(result);
    });
});

router.post('/classSubjects', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    examschedule.classSubjects(data, function(result){
        res.send(result);
    });
});

router.post('/removeSchedule', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    examschedule.removeSchedule(data, function(result){
        res.send(result);
    });
});


router.post('/editSchedule', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    examschedule.editSchedule(data, function(result){
        res.send(result);
    });
});

router.post('/saveEdit', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'examschedule', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            examschedule.saveEdit(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/notification/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    req.roleAccess = {model:'examschedule', action:'notification'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            examschedule.exam_notification(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/addCategories', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    examschedule.addCategories(data, function(result){
        res.send(result);
    });
});

router.post('/saveCategories', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    examschedule.saveCategories(data, function(result){
        res.send(result);
    });
});

router.post('/removeCategories', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    examschedule.removeCategories(data, function(result){
        res.send(result);
    });
});

router.post('/remove', oauth.oauth.authorise(), (req, res) => {
    req.roleAccess = {model:'examhead', action: 'delete'};
    auth.checkPermissions(req, isPermission => {
        if (isPermission.status === true) {
            Promise.resolve(req.body)
                .then(examschedule.remove)
                .then(result => res.send(result))
                .catch(err => res.send(log(req, err)));
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
