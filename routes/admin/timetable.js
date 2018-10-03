var timetable = require('../../controllers/timetable');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');


/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
  req.roleAccess = {model:'timetable', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* save  */
router.post('/saveSubjectTeacher', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'timetable', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.saveSubjectTeacher(data, function(result){
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
    req.roleAccess = {model:'timetable', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.getMetaInformations(data, function(result){
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
    req.roleAccess = {model:'timetable', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.getById(data, function(result){
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
    req.roleAccess = {model:'timetable', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/*list by subject id  */
router.post('/listBySubjectId/:id', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    timetable.getTeacherBySubjectId(data, function(result){
        res.send(result);
    });
});


/* classTeacher  */
router.post('/classTeacher/:id', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.masterId = req.params.id;
    timetable.getClassTeacher(data, function(result){
        res.send(result);
    });
});

router.post('/changeClassTeacher/:id', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    timetable.changeClassTeacher(data, function(result){
        res.send(result);
    });
});

router.post('/timeshift', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    timetable.timeShift(data, function(result){
        res.send(result);
    });
});

router.get('/change', function (req, res) {
    timetable.updateTable({}, function(result){
        console.log(result);
    });
});

router.post('/copyTimetable', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'timetable', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.copyTimetable(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/changeTeacher', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'timetable', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.changeTeacher(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/remove/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    req.roleAccess = {model:'timetable', action:'delete'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.remove(data, function(result){
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
    req.roleAccess = {model:'timetable', action:'notification'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.notification(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* update save function for react-redux admin */
router.post('/newsave', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'timetable', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.newsave(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* update function for react-redux admin */
router.post('/saveTimeSubjectTeacher', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'timetable', action:['edit', 'add']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.saveTimeSubjectTeacher(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* update function for react-redux admin */
router.post('/copyTimetableNew', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'timetable', action:['edit','add']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.copyTimetableNew(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* pdf  */
router.post('/pdf/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    req.roleAccess = {model:'timetable', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            timetable.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/newtimeshift', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    timetable.newTimeShift(data, function(result){
        res.send(result);
    });
});

router.post('/tags', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    timetable.tags(data, function(result){
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
