var dealregistrations = require('../../controllers/dealregistration');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    dealregistrations.list(req, function(result){
        res.send(result);
    });
});

/* edit  */
router.post('/view/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    dealregistrations.getById(data, function(result){
        res.send(result);
    });
});


router.use(oauth.oauth.errorHandler());
module.exports = router;
