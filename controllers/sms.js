const extend = require('extend')
, config = require('../config/config')[process.env.NODE_ENV || 'development']
, language = require('./language')
, utils = require('./utils')
, querystring = require('querystring')
, request = require('request')
, ejs = require('ejs')
, AWS = require('aws-sdk/global')
, fs = require('fs')
, bitly = new (require('bitly'))(config.bitlyAuthKey)
, messagebird = require('messagebird')(config.messageBirdKey)
, SendOtp = require('sendotp')
, moment = require('moment');

const otpExpires = 900; //in seconds
const otpRetry = 180;   //in seconds

// default options for msg91
const defaultSMSOptions = {
	authkey : config.msg91AuthKey
	, sender: 'PATEST'
	, response: 'json'
	, campaign: 'Pateast'
	, route: '4'
	, unicode: '1'
}
, defaultOtpOptions = {
	authkey: config.msg91AuthKey
	, sender: 'PATEST'
	, response: 'json'
};
const sendOtp = new SendOtp(config.msg91AuthKey);
sendOtp.setOtpExpiry('15'); // in minute

// configure the aws-sdk
AWS.config.loadFromPath(__dirname + '/../config/aws.json');
AWS.config.update({
	logger: console
});

const SNS = new (require('aws-sdk/clients/sns'))();

const registerSMSTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/sms/register.ejs', 'utf8')
),
registerSMSTemplateStudent = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/sms/register_student.ejs', 'utf8')
),
registerSMSTemplateTeacher = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/sms/register_teacher.ejs', 'utf8')
),
registerSMSTemplateEmp = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/sms/register_emp.ejs', 'utf8')
),
forgotPasswordSMSTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/sms/forgot-password.ejs', 'utf8')
),
forgotPasswordSMSTemplateStudent = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/sms/forgot-password-student.ejs', 'utf8')
),
leaveStatusSMSTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/sms/leave-status.ejs', 'utf8')
);

function SMS() {
	this.sendByMsg91 = function (mobile, message, options, masterId) {
		//Get Auth Key
        utils.getAuthKeyByMasterId({masterId:masterId}, function(data){
        	let msg91AuthKey  = (data.smsProviderAuthKey)?data.smsProviderAuthKey:config.msg91AuthKey;
        	let msg91SenderName  = (data.smsSenderName)?data.smsSenderName:'PATEST';
        	if(msg91AuthKey){
        		options = options || {};
        		defaultSMSOptions.authkey = msg91AuthKey;
        		defaultSMSOptions.sender = msg91SenderName;
				extend(options, defaultSMSOptions);
				if (mobile instanceof Array) {
					options.mobiles = mobile.join(',');
				} else {
					options.mobiles = mobile;
				}
				options.message = message;
				return new Promise((resolve, reject) => {
					request({
					method: 'post',
					uri: 'https://control.msg91.com/api/sendhttp.php',
						form: options
					}, (err, res, body) => {
						if (err) {
							console.log('error', err)
							reject(err);
						} else {
							resolve(body);
						}
					});
				});
        	}else{
        		console.log('Auth key not updated');
        	}
        });
	};

	this.sendByAWS = function (mobile, message) {
		return SNS.publish({
			Message: message,
			PhoneNumber: mobile/*,
			MessageAttributes: {
				'DefaultSenderID' : {
					DataType: 'String',
					StringValue: 'PATEST'
				},
				"DefaultSMSType" : {
					DataType: 'String',
					StringValue: 'Transactional'
				}
			}*/
		}).promise();
	};

	this.sendByMessageBird = function (mobile, message, masterId) {
        //Get Auth Key
        utils.getAuthKeyByMasterId({masterId:masterId}, function(data){
        	let msgBirdAuthKey  = (data.smsProviderAuthKey)?data.smsProviderAuthKey:config.messageBirdKey;
        	let msg91SenderName  = (data.smsSenderName)?data.smsSenderName:'Pateast';
	        if(msgBirdAuthKey){
				let messagebirdAPI = require('messagebird')(msgBirdAuthKey);
				if (mobile instanceof Array) {
					mobile = mobile.join(',');
				}
				var params = {
					'originator': msg91SenderName,
					'recipients': mobile,
					'body': message
				};

				messagebirdAPI.messages.create(params, function (err, response) {
					if (err) {
						return console.log(err);
					}
					//console.log(response);
				});
			}else{
	        		console.log('Auth key not updated');
	        }
        });
    };

	this.sendRegistrationSMS = function (mobile, data, provider, masterId) {
		provider = provider || 1;
		return bitly.shorten(data.link)
		.then(link => {
			if (link.status_code != 200) {
				throw link.status_txt;
			}
			data.link = link.data.url;
			if (provider == 3) {
				return this.sendByMessageBird(
					mobile,
					registerSMSTemplate(language.bindLocale(data, data.lang)),
					masterId
				);
			}else if (provider == 2) {
				return this.sendByAWS(
					mobile,
					registerSMSTemplate(language.bindLocale(data, data.lang))
				);
			} else {
				return this.sendByMsg91(
					mobile,
					registerSMSTemplate(language.bindLocale(data, data.lang)),
					'',
					masterId
				);
			}
		});
	};

	this.sendStudentRegistrationSMS = function (mobile, data, provider, masterId) {
		provider = provider || 1;
		return bitly.shorten(data.link)
		.then(link => {
			if (link.status_code != 200) {
				throw link.status_txt;
			}
			data.link = link.data.url;
			if (provider == 3) {
				return this.sendByMessageBird(
					mobile,
					registerSMSTemplateStudent(language.bindLocale(data, data.lang)),
					masterId
				);
			}else if (provider == 2) {
				return this.sendByAWS(
					mobile,
					registerSMSTemplateStudent(language.bindLocale(data, data.lang))
				);
			} else {
				return this.sendByMsg91(
					mobile,
					registerSMSTemplateStudent(language.bindLocale(data, data.lang)),
					'',
					masterId
				);
			}
		});
	};

	this.sendTeacherRegistrationSMS = function (mobile, data, provider, masterId) {
		provider = provider || 1;
		return bitly.shorten(data.link)
		.then(link => {
			if (link.status_code != 200) {
				throw link.status_txt;
			}
			data.link = link.data.url;
			if (provider == 3) {
				return this.sendByMessageBird(
					mobile,
					registerSMSTemplateTeacher(language.bindLocale(data, data.lang)),
					masterId
				);
			}else if (provider == 2) {
				return this.sendByAWS(
					mobile,
					registerSMSTemplateTeacher(language.bindLocale(data, data.lang))
				);
			} else {
				return this.sendByMsg91(
					mobile,
					registerSMSTemplateTeacher(language.bindLocale(data, data.lang)),
					'',
					masterId
				);
			}
		});
	};

	this.sendEmpRegistrationSMS = function (mobile, data, provider, masterId) {
		provider = provider || 1;
		return bitly.shorten(data.link)
		.then(link => {
			if (link.status_code != 200) {
				throw link.status_txt;
			}
			data.link = link.data.url;
			if (provider == 3) {
				return this.sendByMessageBird(
					mobile,
					registerSMSTemplateEmp(language.bindLocale(data, data.lang)),
					masterId
				);
			}else if (provider == 2) {
				return this.sendByAWS(
					mobile,
					registerSMSTemplateEmp(language.bindLocale(data, data.lang))
				);
			} else {
				return this.sendByMsg91(
					mobile,
					registerSMSTemplateEmp(language.bindLocale(data, data.lang)),
					'',
					masterId
				);
			}
		});
	};

	this.sendForgotPasswordSMS = function (mobile, data, provider, masterId) {
		provider = provider || 1;
		return bitly.shorten(data.link)
		.then(link => {
			if (link.status_code != 200) {
				throw link.status_txt;
			}
			data.link = link.data.url;
			if (provider == 3) {
				return this.sendByMessageBird(
					mobile,
					forgotPasswordSMSTemplate(language.bindLocale(data, data.lang)),
					masterId
				);
			}else if (provider == 2) {
				return this.sendByAWS(
					mobile,
					forgotPasswordSMSTemplate(language.bindLocale(data, data.lang))
				);
			} else {
				return this.sendByMsg91(
					mobile,
					forgotPasswordSMSTemplate(language.bindLocale(data, data.lang)),
					'',
					masterId
				);
			}
		});
	};

	this.sendForgotPasswordSMSStudent = function (mobile, data, provider, masterId) {
		provider = provider || 1;
		return bitly.shorten(data.link)
		.then(link => {
			if (link.status_code != 200) {
				throw link.status_txt;
			}
			data.link = link.data.url;
			if (provider == 3) {
				return this.sendByMessageBird(
					mobile,
					forgotPasswordSMSTemplateStudent(language.bindLocale(data, data.lang)),
					masterId
				);
			}else if (provider == 2) {
				return this.sendByAWS(
					mobile,
					forgotPasswordSMSTemplateStudent(language.bindLocale(data, data.lang))
				);
			} else {
				return this.sendByMsg91(
					mobile,
					forgotPasswordSMSTemplateStudent(language.bindLocale(data, data.lang)),
					'',
					masterId
				);
			}
		});
	};

	this.leaveStatusSMS = function (mobile, data, provider, masterId) {
		provider = provider || 1;
		data.start_date = moment(data.start_date).format('YYYY-MM-DD');
		data.end_date = moment(data.end_date).format('YYYY-MM-DD');

		if (provider == 3) {
			return this.sendByMessageBird(
				mobile,
				leaveStatusSMSTemplate(language.bindLocale(data, data.lang)),
				masterId
			);
		}else if (provider == 2) {
			return this.sendByAWS(
				mobile,
				leaveStatusSMSTemplate(language.bindLocale(data, data.lang))
			);
		} else {
			return this.sendByMsg91(
				mobile,
				leaveStatusSMSTemplate(data),
				'',
				masterId
			);
		}
	};

	this.customSMS = function (mobile, data, provider, masterId) {
		provider = provider || 1;
		data.start_date = moment(data.start_date).format('YYYY-MM-DD');
		data.end_date = moment(data.end_date).format('YYYY-MM-DD');

		if (provider == 3) {
			return this.sendByMessageBird(
				mobile, data, masterId
			);
		}else if (provider == 2) {
			return this.sendByAWS(
				mobile, data
			);
		} else {
			return this.sendByMsg91(
				mobile, data, '', masterId
			);
		}
	};

	this.SendSMS = function (mobile, msg, provider, masterId) {
		provider = provider || 1;
		if (provider == 2) {
			return this.sendByAWS(
				mobile,
				msg
			);
		} else {
			return this.sendByMsg91(
				mobile,
				msg,
				masterId
			);
		}
	};

	this.sendOtp = function (mobile) {
		var options = {mobile: mobile};
		extend(options, defaultOtpOptions);
		return new Promise((resolve, resject) => {
			request({
				method: 'post',
				uri: 'https://control.msg91.com/api/sendotp.php',
				form: options
			}, (err, res, body) => {
				if (err) {
					reject(err);
				} else {
					resolve(JSON.parse(body));
				}
			});
		});
	};

	this.verifyOtp = function (mobile, otp) {
		var options = {mobile: mobile, otp: otp};
		extend(options, defaultOtpOptions);
		return new Promise((resolve, resject) => {
			request({
				method: 'post',
				uri: 'https://control.msg91.com/api/verifyRequestOTP.php',
				form: options
			}, (err, res, body) => {
				if (err) {
					reject(err);
				} else {
					resolve(JSON.parse(body));
				}
			});
		});
	};

	this.retryOtp = function (mobile) {
		var options = {mobile: mobile};
		extend(options, defaultOtpOptions);
		return new Promise((resolve, resject) => {
			request({
				method: 'post',
				uri: 'https://control.msg91.com/api/retryotp.php',
				form: options
			}, (err, res, body) => {
				if (err) {
					reject(err);
				} else {
					resolve(JSON.parse(body));
				}
			});
		});
	};

	this.otpSend = function(req, res){
		if(req.countryCode == '+91' || req.countryCode == '91'){
			sendOtp.send(req.mobile, "PATEST", function (error, data, response) {
		  		if(data.type == 'error'){
		  			res({status:'ERROR', message:'Please try again'});
		  		}
		  		res({
			  		status:'SUCCESS',
			  		token:req.mobile,
			  		phone:req.mobile,
			  		expires_in:otpExpires,
			  		retry_in:otpRetry,
			  		message:'Success',
			  		country_code:req.countryCode
		  		})
			});
		}else{
			messagebird.verify.create(req.mobile, {timeout:otpExpires }, function (err, response) {
			 	if (err) {
			    	res({status:'ERROR', message:'Please try again'});
			  	}
			  	res({
			  		status:'SUCCESS',
			  		token:response.id,
			  		phone:response.recipient,
			  		expires_in:otpExpires,
			  		retry_in:otpRetry,
			  		message:'Success',
			  		country_code:req.countryCode
			  	})
			});
		}
    };

    this.otpVerify = function(req, res){
    	if(req.countryCode == '+91' || req.countryCode == '91'){
    		sendOtp.verify(req.token, req.code, function (error, data, response) {
				console.log(data); // data object with keys 'message' and 'type'
				if(data.type == 'success') res({status:'SUCCESS'})
				if(data.type == 'error') res({status:'ERROR', message:'InvalidOTP'})
			});
		}else{
			messagebird.verify.verify(req.token, req.code, function (err, response) {
			 	if (err) {
			    	res({status:'ERROR', message:'InvalidOTP'});
			  	} else {
				  	if(response && response.status == 'verified'){
				  		res({status:'SUCCESS'})
				  	} else {
				  		res({status:'ERROR', message:'InvalidOTP'});
				  	}

				}
			});
		}
    };

    this.otpRead = function(req, res){
    	messagebird.verify.read(req.verifyId, function (err, response) {
		  if (err) {
		    return console.log(err);
		  }
		  console.log(response);
		});
    };
}

module.exports = new SMS();
//module.exports.otpSend({mobile:'919461420106'});
//module.exports.otpRead({verifyId:'5e89dfcc987c4f22a509faa705feee4e'});
//module.exports.otpVerify({verifyId:'5a6430f367f44e20bfcfec13bb9e963f', token:452537});