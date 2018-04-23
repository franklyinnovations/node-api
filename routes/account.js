'use strict';

const account = require('../controllers/account'),
	oauth = require('../config/oauth'),
	log = require('../controllers/log'),
	language = require('../controllers/language'),
	authorise = oauth.oauth.authorise(),
	router = require('express').Router();

/**
* @api {post} /account/save Update account details
* @apiGroup AccountSettings
* @apiParam {integer} id required user id
* @apiParam {string} name required 
* @apiParam {string} email required 
* @apiParam {string} mobile required 
* @apiParam {string} langId required 
*/
router.post('/save', authorise, (req, res) => {
	Promise.resolve(req.body)
	.then(account.save)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});


/**
* @api {post} /account/change-password Change Password
* @apiGroup AccountSettings
* @apiParam {integer} id required user id
* @apiParam {string} curr_password required
* @apiParam {string} new_password required
* @apiParam {string} confirm_new_password optional
*/
router.post('/change-password', authorise, (req, res) => {
	Promise.resolve(req.body)
	.then(account.changePassword)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

/**
* @api {post} /account/doctor-app/settings Read doctor settings for app
* @apiGroup AccountSettings
* @apiParam {integer} doctorprofileId required id in doctor_profiles table
* @apiParam {integer} langId required
*/
router.post('/doctor-app/settings', authorise, (req, res) => {
	Promise.resolve(req.body)
	.then(account.doctorAppSettings)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

/**
* @api {post} /account/doctor-app/notification-setting Change notification settings for doctor app
* @apiGroup AccountSettings
* @apiParam {integer} doctorprofileId required id in doctor_profiles table
* @apiParam {string} type required ('available_for_consult' || 'freeqa_notification' || 'chat_notification' || 'feedback_notification' || 'all') any one of them
* @apiParam {integer} value value to be updated(0, 1)
*/
router.post('/doctor-app/notification-setting', authorise, (req, res) => {
	Promise.resolve(req.body)
	.then(account.doctorChangeNotificationSettings)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});


router.use(oauth.oauth.errorHandler());
module.exports = router;
