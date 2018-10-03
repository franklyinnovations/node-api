'use strict';

const
	models = require('../models'),
	language = require('./language');

exports.list = async req => ({
	status: true,
	data: await models.todo.findAll({
		where: {
			userId: req.userId,
		},
		order: [
			['date'],
		]
	}),
});

exports.save = async req => {
	let data;
	try {
		data = await models.todo.create(req);
	} catch (err) {
		return {
			status: false,
			errors: language.makeErrors([err], req.lang),
		};
	}
	return {status: true, data};
};

exports.remove = async req => {
	await models.todo.destroy({
		where: {
			id: req.id,
			userId: req.userId,
		}
	});
	return {
		status: true,
		message: language.__('deletedSuccessfully', req.lang),
	};
};