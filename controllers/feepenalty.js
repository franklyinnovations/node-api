'use strict';

const
	models = require('../models'),
	language = require('./language');

models.feepenalty.hasMany(models.feepenaltyslab);
models.feepenalty.hasMany(models.feepenaltydetail);
models.feepenaltydetail.belongsTo(models.feepenalty);

exports.list = async req => {
	let pageSize = req.app.locals.site.page,
		page = req.query.page || 1,
		reqData = req.body,
		where = {
			feepenalty: {
				masterId: reqData.masterId,
			},
			feepenaltydetail: language.buildLanguageQuery(
				null,
				reqData.langId,
				'`feepenalty`.`id`',
				models.feepenaltydetail,
				'feepenaltyId'
			),
		};

	if (req.query.is_active) where.feepenalty.is_active = req.query.is_active;
	if (req.query.name) where.feepenaltydetail.name = {$like: '%' + req.query.name + '%'};

	let {rows: data, count: totalData} = await models.feepenalty.findAndCountAll({
		include: [
			{
				model: models.feepenaltydetail,
				where: where.feepenaltydetail,
				attributes: ['name'],
			},
			{
				model: models.feepenaltyslab,
				attributes: ['days', 'amount'],
			},
		],
		where: where.feepenalty,
		distinct: true,
		attributes: ['id', 'is_active'],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		order: [
			['id', 'DESC'],
			[models.feepenaltyslab, 'days']
		],
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

exports.save = async req => {
	req.num_of_slabs = req.feepenaltyslabs.length;
	req.feepenaltydetail.languageId = req.langId;
	req.feepenaltydetail.masterId = req.masterId;
	req.feepenaltydetail.feepenaltyId = req.id;
	let errors = language.makeErrors(
		await Promise.all([
			models.feepenalty.build(req).validate(),
			models.feepenaltydetail.build(req.feepenaltydetail).validate()
		]),
		req.lang,
	);
	return errors ? {status: false, errors} : (req.id ? updateFeePanelty(req) : createFeePanelty(req));
};

exports.getById = req => models.feepenalty.find({
	include: [
		{
			model: models.feepenaltydetail,
			where: language.buildLanguageQuery(
				null,
				req.langId,
				'`feepenalty`.`id`',
				models.feepenaltydetail,
				'feepenaltyId'
			),
		},
		{
			model: models.feepenaltyslab,
		},
	],
	where: {
		id: req.id,
		masterId: req.masterId,
	},
	order: [
		[models.feepenaltyslab, 'days']
	]
});

exports.status = req => models.feepenalty.update(
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
		await models.feepenalty.destroy({where: {id: req.id}});
	} catch (err) {
		return {
			status: false,
			message: language.lang({key: 'Can not delete fee penalty, It is being used.'}),
		};
	}

	return {
		status: true,
		message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
	};
};

async function updateFeePanelty(req) {
	let oldFeePenaltySlabs = [];
	for (let i = 0; i < req.feepenaltyslabs.length; i++) {
		if (req.feepenaltyslabs[i].id)
			oldFeePenaltySlabs.push(req.feepenaltyslabs[i].id);
		else
			req.feepenaltyslabs[i].feepenaltyId = req.id;
	}
	let deletedSlabs = {
		feepenaltyId: req.id,
	};
	if (oldFeePenaltySlabs.length)
		deletedSlabs.id = {$notIn: oldFeePenaltySlabs};
	
	models.feepenaltyslab.destroy({
		where: deletedSlabs,
	});

	delete req.feepenaltydetail.id;
	await Promise.all([
		models.feepenaltydetail.upsert(req.feepenaltydetail),
		models.feepenalty.update(req, {where: {id: req.id, masterId: req.masterId}}),
		models.feepenaltyslab.bulkCreate(
			req.feepenaltyslabs, {
				updateOnDuplicate: ['days', 'amount'],
			},
		)
	]);
}

async function createFeePanelty(req) {
	req.feepenaltydetails = [req.feepenaltydetail];
	if (req.langId != 1) {
		req.feepenaltydetails.push({
			...req.feepenaltydetail,
			languageId: 1,
		});
	}
	await models.feepenalty.create(req, {
		include: [
			models.feepenaltyslab,
			models.feepenaltydetail,
		],
	});

	return {
		status: true,
		message: language.lang({
			key: 'addedSuccessfully',
			lang: req.lang
		}),
	};
}