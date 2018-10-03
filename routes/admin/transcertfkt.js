'use strict';

const transcertfkt = require('../../controllers/transcertfkt'),
student = require('../../controllers/student'),
log = require('../../controllers/log'),
router = require('express').Router(),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
auth = require('../../config/auth'),
language = require('../../controllers/language'),
formData = require('multer')().array();

router.post('/getStudents', authorise, formData, (req, res) => {
	req.roleAccess = {model:'transcertfkt', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(transcertfkt.getStudents(
				req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/getSelectedStudents', authorise, formData, (req, res) => {
	req.roleAccess = {model:'transcertfkt', action:'generate'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(transcertfkt.getSelectedStudents(
				req.body
			))
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/savetc', authorise, formData, (req, res) => {
	req.roleAccess = {model:'transcertfkt', action:'generate'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(transcertfkt.saveTC(
				req.body
			))
			.then(result => res.send({status: true}))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/studentDetail', authorise, formData, function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'student', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            student.getStudentDetail(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.errorHandler());
module.exports = router;