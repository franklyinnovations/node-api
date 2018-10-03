var users = require('../controllers/users');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var auth = require('../config/auth');
var contacts = require('../controllers/contacts');
var partner = require('../controllers/partner');
var log = require('../controllers/log');
var demo = require('../controllers/demo');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET login */
router.post('/login', upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.deviceType = req.device.type.toUpperCase();
    auth.isAuthorise(req, function(isAuth){
        if (isAuth.status === true) {
           users.login(data, function(result){
            res.send((result.userdetails && result.userdetails.status === false) ? result.userdetails : result);
        });
        } else {
            res.send(isAuth);
        }
    });
});

/* GET forgot-password */
router.post('/forgot-password', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.deviceType = req.device.type.toUpperCase();
    users.forgotpassword(data, function(result){
        res.send(result);
    });
});

/* GET forgot-password */
router.post('/check-username', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    users.checkUsername(data, function(result){
        res.send(result);
    });
});

/* GET forgot-password */
router.post('/reset-password-otp', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    users.resetpasswordwithOtp(data, function(result){
        res.send(result);
    });
});

/* GET reset-password */
router.post('/reset-password', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    users.resetpassword(data, function(result){
        res.send(result);
    });
});

/* Contact Page */
router.post('/contacts/send', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    contacts.sentQuery(data, function(result){
        res.send(result);
    });
});

router.post('/partners/send', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    partner.sentQuery(data, function(result){
        res.send(result);
    });
});

router.post('/demo/send', (req, res) => {
    Promise.resolve(req.body)
    .then(demo.send)
    .then(result => res.send(result))
    .catch(err => res.send(log(req, err)));
});

module.exports = router;
