var studentcomplaint = require('../../controllers/studentcomplaint');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var log = require('../../controllers/log');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(req.body)
	.then(studentcomplaint.list)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

/* GET  */
router.post('/sendemail', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    studentcomplaint.sendemail(data, function(result){
        res.send(result);
    });
});

router.post('/view', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    studentleave.view(data, function(result){
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
