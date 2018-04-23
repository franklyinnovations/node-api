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
var country = require('../controllers/country');
var state = require('../controllers/state');
var city = require('../controllers/city');
var language = require('../controllers/language');
var otp = require('../controllers/otpmessage');

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

            if(result.status && result.data.roleId==2) {
                
                res.send(result);
            }else{
                 res.send({status:false,message:language.lang({key: "invalid_detail",lang: req.lang})}); 
            }
            });
        } else {
            res.send(isAuth);
        }
    });
});

/* GET weblogin */
router.post('/weblogin', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.deviceType = req.device.type.toUpperCase();
    auth.isAuthorise(req, function(isAuth){
        if (isAuth.status === true) {
            users.weblogin(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isAuth);
        }
    });
});

/**
 * @api {post} /doctor-login doctor login
 * @apiName doctor-login
 * @apiGroup Doctor
 * @apiParam {string} username required
 * @apiParam {string} userpassword required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 * 
 */
/* GET doctor app login */
router.post('/doctor-login', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.deviceType = req.device.type.toUpperCase();
    auth.isAuthorise(req, function(isAuth){
        if (isAuth.status === true) {
            users.weblogin(data, function(result){
                if(result.status) {
                     if(result.data.roleId==3 || result.data.roleId==4) {
                    users.checkClaimStatus(result.data.id, function(claimRsult){
                        if(claimRsult.resData!=null){
                            result.data.check_claim_status=1;
                        }else{
                            result.data.check_claim_status=0;
                        }
                         res.send(result);
                    })
                }else{
                   res.send({status:false,errors:[{message:language.lang({key: "invalid_detail",lang: req.lang})}]}); 
                }
                }else{
                     res.send(result);
                }
               
            });
        } else {
            res.send(isAuth);
        }
    });
});
/**
 * @api {post} /doctor-register doctor registration
 * @apiName doctor-register
 * @apiGroup Doctor
 * @apiParam {integer} roleId required
 * @apiParam {string} name required
 * @apiParam {string} email required
 * @apiParam {string} mobile required
 * @apiParam {string} password required
 * @apiParam {string} user_type required
 * @apiParam {integer} agreed_to_terms required 
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 * 
 */
router.post('/doctor-register',  upload.array(), function(req, res, next) {

    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    auth.isAuthorise(req, function(isAuth){
        if (isAuth.status === true) {
           users.doctorRegister(data, function(result){
            res.send(result);
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


/**
 * @api {post} /country/list list all countries
 * @apiName listCountry
 * @apiGroup Common Api
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * 
 */
router.post('/country/list', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    country.getAllCountry(data, function(result){
        res.send({status:true, message:'', data:result});
    });
});


/**
 * @api {post} /state/list list all states by country id
 * @apiName listState
 * @apiGroup Common Api
 * @apiParam {integer} countryId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * 
 */
router.post('/state/list', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    state.getAllState(data, function(result){
        res.send({status:true, message:'', data:result.data});
    });
});

/**
 * @api {post} /city/list list all cities by state id
 * @apiName listCity
 * @apiGroup Common Api
 * @apiParam {integer} stateId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * 
 */
router.post('/city/list', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    city.getAllCity(data, function(result){
        res.send({status:true, message:'', data:result.data});
    });
});

router.post('/get-otp', (req, res) => {
    Promise.resolve(req.body)
    .then(otp.sendOtp)
    .then(result => res.send(result))
    .catch(console.log);
});

module.exports = router;
