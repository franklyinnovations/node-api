'use strict';

const
	models = require('../models'),
	language = require('./language');

models.feediscount.belongsTo(models.feehead);
models.feediscount.hasMany(models.feediscountdetail);
models.feediscountdetail.belongsTo(models.feediscount);

exports.list = async req => {
	let pageSize = req.app.locals.site.page,
		page = req.query.page || 1,
		reqData = req.body,
		where = {
			feediscount: {
				masterId: reqData.masterId,
			},
			feediscountdetail: language.buildLanguageQuery(
				null,
				reqData.langId,
				'`feediscount`.`id`',
				models.feediscountdetail,
				'feediscountId'
			),
			feeheaddetail: language.buildLanguageQuery(
				null,
				reqData.langId,
				'`feediscount`.`feeheadId`',
				models.feeheaddetail,
				'feeheadId'
			),
		};

	if (req.query.is_active) where.feediscount.is_active = req.query.is_active;
	if (req.query.feeheadId) where.feediscount.feeheadId = req.query.feeheadId;
	if (req.query.name) where.feediscountdetail.name = {$like: '%' + req.query.name + '%'};

	let [{rows: data, count: totalData}, feeheads] = await Promise.all([
		models.feediscount.findAndCountAll({
			include: [
				{
					model: models.feediscountdetail,
					where: where.feediscountdetail,
					attributes: ['name'],
				},
				{
					model: models.feehead,
					include: [
						{
							model: models.feeheaddetail,
							where: where.feeheaddetail,
							attributes: ['name'],
						},
					],
					attributes: ['id'],
				},
			],
			where: where.feediscount,
			distinct: true,
			attributes: ['id', 'type', 'feeheadId', 'value', 'is_active'],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			order: [['id', 'DESC']],
		}),
		models.feehead.findAll({
			include: [
				{
					model: models.feeheaddetail,
					where: language.buildLanguageQuery(
						null,
						reqData.langId,
						'`feehead`.`id`',
						models.feeheaddetail,
						'feeheadId'
					),
					attributes: ['name'],
				},
			],
			where: {
				masterId: reqData.masterId,
			},
			attributes: ['id'],
		})
	]);

	return {
		status: true,
		data,
		feeheads,
		totalData,
		currentPage: page,
		pageLimit: pageSize,
		pageCount: Math.ceil(totalData / pageSize),
	};
};

exports.save = async req => {
	req.feediscountdetail.languageId = req.langId;
	req.feediscountdetail.masterId = req.masterId;
	req.feediscountdetail.feediscountId = req.id;
	let errors = language.makeErrors(
		await Promise.all([
			models.feediscount.build(req).validate(),
			models.feediscountdetail.build(req.feediscountdetail).validate()
		]),
		req.lang,
	);
	return errors ? {status: false, errors} : (req.id ? updatefeediscount(req) : createfeediscount(req));
};

exports.status = req => models.feediscount.update(
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
		await models.feediscount.destroy({where: {id: req.id}});
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
	models.feediscount.find({
		include: [
			{
				model: models.feediscountdetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`feediscount`.`id`',
					models.feediscountdetail,
					'feediscountId'
				),
			},
		],
		where: {
			id: req.id,
			masterId: req.masterId,
		}
	});

exports.getAllFeediscount = req =>
	models.feediscount.findAll({
		include: [
			{
				model: models.feediscountdetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`feediscount`.`id`',
					models.feediscountdetail,
					'feediscountId'
				),
			},
		],
		where: {
			masterId: req.masterId,
			is_active: 1
		}
	});

async function createfeediscount(req) {
	req.feediscountdetails = [req.feediscountdetail];
	if (req.langId != 1) {
		req.feediscountdetails.push({...req.feediscountdetail, languageId: 1});
	}

	await models.feediscount.create(req, {
		include: [models.feediscountdetail],
	});

	return {
		status: true,
		message: language.lang({
			key: 'addedSuccessfully',
			lang: req.lang
		})
	};
}

async function updatefeediscount(req) {
	delete req.feediscountdetail.id;

	await Promise.all([
		models.feediscount.update(req, {where: {id: req.id}}),
		models.feediscountdetail.upsert(req.feediscountdetail),
	]);

	return {
		status: true,
		message: language.lang({
			key: 'updatedSuccessfully',
			lang: req.lang
		}),
	};
}

