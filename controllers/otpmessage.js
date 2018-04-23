'use strict';

const models = require('../models'),
language = require('./language'),
utils = require('./utils'),
sms = require('./sms'),
moment = require('moment'),
crypto = require('crypto');

const otpExpires = 1800; //in seconds

exports.sendOtp = req => {
	return generateOtp(req).then(result => {
		return sms.mobilySMS({
			form: {
				numbers: req.mobile,
				msg: 'Your Wikicare verification code is '+result.otp
			}
		}).then(data => {
			if(data === '1'){
				return {
					status: true,
					message: 'otp sent', 
					attempt: result.attempt
				};
			} else {
				return {
					status: false,
					message: 'Error', 
				};
			}
		}).catch(console.log);
		/*return {
			status: true,
			message: 'otp sent '+result.otp, 
			attempt: result.attempt
		};*/
	}).catch(console.log);
};

exports.verifyOtp = req => {
	return models.otpmessage.findOne({
		where: {
			mobile: req.mobile,
			otp: req.otp
		}
	});
};

function generateOtp(req) {
	let attempt = 1;
	return Promise.all([
		models.otpmessage.findOne({
			where: {
				mobile: req.mobile
			},
			order: [
				['id', 'DESC']
			]
		}),
		(parseInt(crypto.randomBytes(3).toString('hex'), 16) % 900000 + 100000)
	]).then(([data, otp]) => {
		if(data) {
			if(moment().diff(data.createdAt, 'seconds') <= otpExpires) {
				attempt = (data.attempt+attempt);
				return models.otpmessage.update({
					attempt: attempt
				}, {
					where: {
						id: data.id
					}
				}).then(()=> {
					return {
						otp: data.otp,
						attempt
					};
				});
			} else {
				return Promise.all([
					models.otpmessage.destroy({
						where: {
							mobile: data.mobile
						}
					}),
					models.otpmessage.create({
						attempt,
						otp,
						mobile: req.mobile
					})
				]).then(() => ({
					otp,
					attempt
				})).catch(console.log);
			}
		} else {
			return models.otpmessage.create({
				attempt,
				otp,
				mobile: req.mobile
			}).then(() => {
				return {
					otp,
					attempt
				};
			});
		}
	});
};