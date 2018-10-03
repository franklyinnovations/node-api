'use strict';

const models = require('../models'),
	language = require('./language');

exports.send = req => {
	return models.demo.build(req).validate().then(err => {
		if (err) {
			return {status: false, errors: language.makeErrors([err], req.lang)};
		} else {
			return models.demo.create(req)
				.then(() => ({status: true, message: "Your request has been submitted successfully"}))
		}
	})
}

exports.list = req => {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
	where = {};
	if (req.query) {
		Object.keys(req.query).forEach(key => {
			if (req.query[key] === '') return;
			var modalKey = key.split('__');
			if (modalKey.length === 3) {
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = req.query[key];
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = req.query[key];
				}
			} else {
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				}
			}
		});
	}

	return Promise.all([
	models.demo.findAndCountAll({
		where: where.demo,
		attribute: ['id', 'is_active'],
		order: [
			['id', 'DESC']
		],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		}),
	])
	.then(([result]) => ({
		status: true,
		data: result.rows,
		totalData: result.count,
		pageCount: Math.ceil(result.count / pageSize),
		pageLimit: pageSize,
		currentPage: page,
	}));
};

exports.view = req => {
	return Promise.all([
		models.demo.findOne({
			where: {
				id: req.id
			},
		})
	])
	.then(([data])=> ({status: true, data}));
};