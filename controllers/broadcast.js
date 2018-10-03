'use strict';

const models = require('../models'),
notification = require('./notification'),
language = require('./language');

function sendNotification(data, tokens) {
	return new Promise((resolve, reject) => {
		notification.sendNotification(data, tokens, result => {
			if (result.status) {
				resolve(result);
			} else {
				reject(result);
			}
		})
	});
}


function Broadcast() {

	this.teachers = function (req) {
		return models.user.findAll({
			where: {
				masterId: req.masterId,
				user_type: 'teacher',
				is_active: 1,
				device_id: {$ne: null},
				device_type: {$ne: 'web'}
			},
			attributes: ['id', 'device_id', 'is_notification']
		})
		.then(users => users.map(user => user.device_id))
		.then(tokens => sendNotification({
			message: req.message,
			title: req.title
		}, tokens))
		.then(
			result => ({
				status: true,
				message: language.lang({key: "Broadcast Sent", lang: req.lang}),
				response: result.data
			}),
			result => ({
				status: false,
				message: language.lang({key: "Broadcast Failed", lang: req.lang}),
				response: result.data
			})
		);
	};

	this.students = function (req) {
		models.student.belongsTo(models.user);
		models.student.hasOne(models.studentrecord);
		return models.student.findAll({
			where: {
				masterId: req.masterId,
			},
			include:
			[
				{
					model: models.user,
					where: {device_id: {$ne: null},device_type: {$ne: 'web'}},
					attributes: ['id', 'device_id', 'is_notification']
				},
				{
					model: models.studentrecord,
					where: {bcsMapId: req.bcsMapId},
					attributes: []
				}
			]
		})
		.then(students => students.map(student => student.user.device_id))
		.then(tokens => sendNotification({
			message: req.message,
			title: req.title
		}, tokens))
		.then(
			result => ({
				status: true,
				message: language.lang({key: "Broadcast Sent", lang: req.lang}),
				response: result
			}),
			result => ({
				status: false,
				message: language.lang({key: "Broadcast Failed", lang: req.lang}),
				response: result
			})
		);
	};
}

module.exports = new Broadcast();