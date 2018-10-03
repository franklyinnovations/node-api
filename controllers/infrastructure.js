'use strict';

const
	models = require('../models'),
	language = require('./language');

models.infrastructure.hasMany(models.infrastructuredetail);
models.infrastructure.belongsTo(models.infratype);
models.infratype.hasMany(models.infratypedetail);
models.infratypedetail.belongsTo(models.infratype);
models.infrastructuredetail.belongsTo(models.infrastructure);
models.infratype.hasMany(models.infrastructure);

exports.list = async req => {
	let pageSize = req.app.locals.site.page,
		page = req.query.page || 1,
		reqData = req.body,
		where = {
			infrastructure: {
				masterId: reqData.masterId,
			},
			infrastructuredetail: language.buildLanguageQuery(
				null,
				reqData.langId,
				'`infrastructure`.`id`',
				models.infrastructuredetail,
				'infrastructureId'
			),
			infratypedetail: language.buildLanguageQuery(
				null,
				reqData.langId,
				'`infratype`.`id`',
				models.infratypedetail,
				'infratypeId'
			),
		};

	if (req.query.typeId) where.infrastructure.infratypeId = req.query.typeId;
	if (req.query.is_active) where.infrastructure.is_active = req.query.is_active;
	if (req.query.code) where.infrastructuredetail.code = {$like: `%${req.query.code}%`};

	let [{rows: data, count: totalData}, infratypes] = await Promise.all([
		models.infrastructure.findAndCountAll({
			include: [
				{
					model: models.infrastructuredetail,
					where: where.infrastructuredetail,
					attributes: ['code', 'remarks'],
				},
				{
					model: models.infratype,
					include: [
						{
							model: models.infratypedetail,
							where: where.infratypedetail,
							attributes: ['name']
						}
					],
					attributes: ['id'],
				}
			],
			where: where.infrastructure,
			distinct: true,
			attributes: ['id', 'is_active'],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			order: [['id', 'DESC']],
			subQuery: false,
		}),
		models.infratype.findAll({
			include: [
				{
					model: models.infratypedetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`infratype`.`id`',
						models.infratypedetail,
						'infratypeId'
					),
					attributes: ['name'],
				}
			],
			where: {masterId: reqData.masterId},
			attributes: ['id'],
		}),
	]);

	return {
		status: true,
		data,
		totalData,
		pageCount: Math.ceil(totalData / pageSize),
		pageLimit: pageSize,
		currentPage: page,
		infratypes,
	};
};

exports.save = async req => {
	req.infrastructuredetail.languageId = req.langId;
	req.infrastructuredetail.infratypeId = req.infratypeId;
	if (req.id) req.infrastructuredetail.infrastructureId = req.id;
	let errors = language.makeErrors(
		await Promise.all([
			models.infrastructure.build(req).validate(),
			models.infrastructuredetail.build(req.infrastructuredetail).validate(),
		])
	);
	return errors ? {status: false, errors} : (req.id ? updateInfrastructure(req) : createInfrastructure(req));
};

async function createInfrastructure(req) {
	req.infrastructuredetails = [req.infrastructuredetail];
	if (req.langId != 1) {
		req.infrastructuredetails.push({...req.infrastructuredetail, languageId: 1});
	}
	await models.infrastructure.create(req, {include: [models.infrastructuredetail]});
	return {
		status: true,
		message: language.lang({key: 'addedSuccessfully', lang: req.lang}),
	};
}

async function updateInfrastructure(req) {
	await Promise.all([
		models.infrastructure.update(req, {where: {id: req.id}}),
		models.infrastructuredetail.upsert(req.infrastructuredetail),
	]);
	return {
		status: true,
		message: language.lang({key: 'updatedSuccessfully', lang: req.lang}),
	};
}

exports.getById = req => models.infrastructure.find({
	include: [
		{
			model: models.infrastructuredetail,
			where: language.buildLanguageQuery(
				null,
				req.langId,
				'`infrastructure`.`id`',
				models.infrastructuredetail,
				'infrastructureId'
			),
		},
	],
	where: {
		id: req.id,
	},
});

exports.status = req => models.infrastructure.update(
	{is_active: req.status},
	{where: {id: req.id,masterId: req.masterId}}
);

exports.remove = req => models.infrastructure.destroy({where: {id: req.id}});

exports.saveType = async req => {
	req.infratypedetail.languageId = req.langId;
	req.infratypedetail.masterId = req.masterId;
	if (req.id) req.infratypedetail.infratypeId = req.id;
	let errors = language.makeErrors(
		[await models.infratypedetail.build(req.infratypedetail).validate()],
		req.lang
	);
	return errors ? {status: false, errors} : await (req.id ? updateInfratype(req) : createInfratype(req));
};

async function createInfratype(req) {
	req.infratypedetails = [req.infratypedetail];
	if (req.langId != 1) {
		req.infratypedetails.push({...req.infratypedetail, languageId: 1});
	}
	let data = await models.infratype.create(req, {include: [models.infratypedetail]});
	return {
		data,
		status: true,
		message: language.lang({key: 'addedSuccessfully', lang: req.lang}),
	};
}

async function updateInfratype(req) {
	await models.infratypedetail.upsert(req.infratypedetail);
	return {
		status: true,
		message: language.lang({key: 'updatedSuccessfully', lang: req.lang}),
	};
}