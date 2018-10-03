'use strict';

var models = require('../models'),
language = require('./language');

exports.list =  (req) => {
	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body, 
	where = {};

	if (req.query) {
		Object.keys(req.query).forEach(key => {
			if (req.query[key] === '') return;
			var modalKey = key.split('__');
			if (modalKey[0] in where) {
				where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
			} else {
				where[modalKey[0]] = {};
				where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
			}
		});
	}

	return models.emailprovider.findAll({
		where: where.emailprovider,
		order: [
			['id', 'DESC']
		],
		distinct: true
	}).then(result => ({
		status: true,
		data: result,
	}));
};

exports.status = function (req) {
	return models.emailprovider.update({is_active: 0}, {where: {is_active: 1}})
	.then(() => models.emailprovider.update({is_active: 1}, {where: {id: req.id}}))
	.then(() => ({
		status:true,
		message:language.lang({key:"updatedSuccessfully", lang:req.lang})
	}));
};