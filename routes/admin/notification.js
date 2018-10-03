var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var notification = require('../../controllers/notification');

router.post('/', upload.array(), oauth.oauth.authorise(), function (req, res) {
  notification.list(req, function(result){
    res.send(result);
  });
});

router.post('/setNotificationStatus', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    notification.notificationStatus(data, function(result){
        res.send(result);
    });
});


router.use(oauth.oauth.errorHandler());
module.exports = router;
