'use strict';

const
	models = require('../models'),
	language = require('./language');

models.feehead.belongsTo(models.route);
models.feehead.hasMany(models.feeheaddetail);
models.feehead.belongsTo(models.routeaddress);
models.feeheaddetail.belongsTo(models.feehead);

exports.list = async req => {
	let pageSize = req.app.locals.site.page,
		page = req.query.page || 1,
		reqData = req.body,
		where = {
			feehead: {
				masterId: reqData.masterId,
			},
			feeheaddetail: language.buildLanguageQuery(
				null,
				reqData.langId,
				'`feehead`.`id`',
				models.feeheaddetail,
				'feeheadId'
			),
		};

	if (req.query.type) where.feehead.type = req.query.type;
	if (req.query.is_active) where.feehead.is_active = req.query.is_active;
	if (req.query.name) where.feeheaddetail.name = {$like: '%' + req.query.name + '%'};
	if (req.query.alias) where.feeheaddetail.alias = {$like: '%' + req.query.alias + '%'};
	if (req.query.no_of_installments) where.feehead.no_of_installments = req.query.no_of_installments;

	let {rows: data, count: totalData} = await models.feehead.findAndCountAll({
		include: [
			{
				model: models.feeheaddetail,
				where: where.feeheaddetail,
				attributes: ['name', 'alias'],
			},
		],
		where: where.feehead,
		distinct: true,
		attributes: ['id', 'type', 'no_of_installments', 'is_active'],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		order: [['id', 'DESC']],
	});

	return {
		status: true,
		data,
		totalData,
		pageCount: Math.ceil(totalData / pageSize),
		pageLimit: pageSize,
		currentPage: page,
	};
};

exports.routes = async req => ({
	status: true,
	data: await models.route.findAll({
		where: {
			masterId: req.masterId,
		},
		attributes: ['id', 'name'],
	}),
});

exports.routeAddresses = async req => ({
	status: true,
	data: await models.routeaddress.findAll({
		where: {
			routeId: req.routeId,
		},
		attributes: ['id', 'address'],
	}),
});

exports.save = async req => {
	req.feeheaddetail.languageId = req.langId;
	req.feeheaddetail.masterId = req.masterId;
	req.feeheaddetail.feeheadId = req.id;
	let errors = language.makeErrors(
		await Promise.all([
			models.feehead.build(req).validate(),
			models.feeheaddetail.build(req.feeheaddetail).validate()
		]),
		req.lang,
	);
	return errors ? {status: false, errors} : (req.id ? updateFeehead(req) : createFeehead(req));
};

exports.status = req => models.feehead.update(
	{
		is_active: req.status
	},
	{
		where: {
			id: req.id,
			masterId: req.masterId,
		}
	}
);

exports.remove = async req => {
	try {
		await models.feehead.destroy({where: {id: req.id}});
	} catch (err) {
		return {
			status: false,
			message: language.lang({key: 'Can not delete fee head, It is being used.'}),
		};
	}

	return {
		status: true,
		message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
	};
};

exports.getById = req =>
	models.feehead.find({
		include: [
			{
				model: models.feeheaddetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`feehead`.`id`',
					models.feeheaddetail,
					'feeheadId'
				),
			},
			{
				model: models.route,
				attributes: ['id', 'name'],
			},
			{
				model: models.routeaddress,
				attributes: ['id', 'address'],
			},
		],
		where: {
			id: req.id,
			masterId: req.masterId,
		}
	});


async function createFeehead(req) {
	req.feeheaddetails = [req.feeheaddetail];
	if (req.langId != 1) {
		req.feeheaddetails.push({...req.feeheaddetail, languageId: 1});
	}

	await models.feehead.create(req, {
		include: [models.feeheaddetail],
	});

	return {
		status: true,
		message: language.lang({
			key: 'addedSuccessfully',
			lang: req.lang
		})
	};
}

async function updateFeehead(req) {
	delete req.feeheaddetail.id;
	delete req.type, req.routeId, req.routeaddressId;

	await Promise.all([
		models.feehead.update(req, {where: {id: req.id}}),
		models.feeheaddetail.upsert(req.feeheaddetail),
	]);

	return {
		status: true,
		message: language.lang({
			key: 'updatedSuccessfully',
			lang: req.lang
		}),
	};
}
