var studentreport = require('../../controllers/studentreport');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
            var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
            req.roleAccess = {model:'mark', action:'view'};
            auth.checkPermissions(req, function(isPermission){
                if (isPermission.status === true) {
                        res.send(data);
                } else {
                    res.send(isPermission);
                }
            });
});

router.post('/getSubjectsByStudent', upload.array(), function (req, res) {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
                        data = JSON.parse(req.body.data);
            }
            studentreport.getAllSubjectsByInstitute(data, function(result){
                res.send(result);
            });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
