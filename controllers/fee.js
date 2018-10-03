'use strict';

const
	utils = require('../utils'),
	models = require('../models'),
	language = require('./language');

models.fee.belongsTo(models.board);
models.fee.belongsTo(models.classes);
models.fee.hasMany(models.feeallocation);
models.fee.hasMany(models.feeallocationpenalty);

exports.list = async req => {
	let pageSize = req.app.locals.site.page,
		page = req.query.page || 1,
		reqData = req.body,
		where = {
			fee: {
				masterId: reqData.masterId,
			},
		};

	if (req.query.classId) where.fee.classId = req.query.classId;
	if (req.query.boardId) where.fee.boardId = req.query.boardId;
	if (req.query.is_active) where.fee.is_active = req.query.is_active;

	let [{rows: data, count: totalData}, classes, boards] = await Promise.all([
		models.fee.findAndCountAll({
			include: [
				{
					model: models.board,
					include: [
						{
							model: models.boarddetail,
							where: language.buildLanguageQuery(
								null,
								reqData.langId,
								'`fee`.`boardId`',
								models.boarddetail,
								'boardId'
							),
							attributes: ['alias'],
						}
					],
					attributes: ['id'],
				},
				{
					model: models.classes,
					include: [
						{
							model: models.classesdetail,
							where: language.buildLanguageQuery(
								null,
								reqData.langId,
								'`fee`.`classId`',
								models.classesdetail,
								'classId'
							),
							attributes: ['name'],
						}
					],
					attributes: ['id'],
				},
			],
			where: where.fee,
			distinct: true,
			attributes: ['id', 'classId', 'boardId', 'is_active'],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			order: [['id', 'DESC']],
		}),
		models.classes.findAll({
			include: [
				{
					model: models.classesdetail,
					where: language.buildLanguageQuery(
						null,
						reqData.langId,
						'`classes`.`id`',
						models.classesdetail,
						'classId'
					),
					attributes: ['name'],
				}
			],
			where: {
				is_active: 1,
				masterId: reqData.masterId,
			},
			attributes: ['id'],
		}),
		models.board.findAll({
			include: [
				{
					model: models.boarddetail,
					where: language.buildLanguageQuery(
						null,
						reqData.langId,
						'`board`.`id`',
						models.boarddetail,
						'boardId'
					),
					attributes: ['alias'],
				}
			],
			where: {
				is_active: 1,
				masterId: reqData.masterId,
			},
			attributes: ['id'],
		}),
	]);

	return {
		status: true,
		data,
		boards,
		classes,
		totalData,
		pageCount: Math.ceil(totalData / pageSize),
		pageLimit: pageSize,
		currentPage: page,
	};
};

exports.meta = req => utils.all({
	classes: req.classes && models.bcsmap.findAll({
		include: [
			{
				model: models.board,
				include: [
					{
						model: models.boarddetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`board`.`id`',
							models.boarddetail,
							'boardId'
						),
						attributes: ['alias'],
					}
				],
				attributes: ['id', 'display_order'],
			},
			{
				model: models.classes,
				include: [
					{
						model: models.classesdetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`class`.`id`',
							models.classesdetail,
							'classId'
						),
						attributes: ['name'],
					}
				],
				attributes: ['id', 'display_order'],
			},
		],
		where: {
			masterId: req.masterId,
			exists: models.sequelize.literal(
				'(SELECT COUNT(`id`) FROM `fees` WHERE `academicSessionId` = '+ parseInt(req.academicSessionId)
				+ ' AND `fees`.`boardId` = `bcsmap`.`boardId` AND `fees`.`classId` = `bcsmap`.`classId`) = 0'
			),
		},
		group: [
			['boardId'],
			['classId'],
		],
	}),
	feeheads: models.feehead.findAll({
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
				attributes: ['name', 'alias'],
			},
		],
		where: {
			is_active: 1,
			masterId: req.masterId,
		},
	}),
	feepenalties: models.feepenalty.findAll({
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
				attributes: ['name'],
			}
		],
		where: {
			masterId: req.masterId,
		},
		attributes: ['id'],
	})
});

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

exports.save = req => req.id ? updateFee(req) : createFee(req);

exports.status = req => models.fee.update(
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
		await models.fee.destroy({where: {id: req.id}});
	} catch (err) {
		return {
			status: false,
			message: language.lang({key: 'Can not delete fee, It is being used.'}),
		};
	}

	return {
		status: true,
		message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
	};
};

exports.getById = req =>
	models.fee.find({
		include: [
			models.feeallocation,
			models.feeallocationpenalty,
			{
				model: models.board,
				include: [
					{
						model: models.boarddetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`board`.`id`',
							models.boarddetail,
							'boardId'
						),
						attributes: ['alias'],
					}
				],
				attributes: ['id'],
			},
			{
				model: models.classes,
				include: [
					{
						model: models.classesdetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`class`.`id`',
							models.classesdetail,
							'classId'
						),
						attributes: ['name'],
					}
				],
				attributes: ['id'],
			}
		],
		where: {
			id: req.id,
			masterId: req.masterId,
		},
		order: [
			[models.feeallocation, 'installment']
		]
	});

async function createFee(req) {
	req.feeallocationpenalties = req.feepenalties.map(feepenaltyId => ({feepenaltyId}));
	await Promise.all(
		req.classes.map(boardClass => {
			let [boardId, classId] = boardClass.split(':');
			return models.fee.create({...req, boardId, classId}, {
				include: [
					models.feeallocation,
					models.feeallocationpenalty,
				],
			});
		})
	);

	return {
		status: true,
		message: language.lang({
			key: 'addedSuccessfully',
			lang: req.lang
		})
	};
}

async function updateFee(req) {
	let
		oldFeeallocations = {
			feeId: req.id,
			id: {$notIn: req.feeallocations.map(item => item.id)},
		},
		oldPenalties = {
			feeId: req.id,
			feepenaltyId: {$notIn: req.feepenalties},
		};
	if (oldFeeallocations.id.$notIn.length === 0) delete oldFeeallocations.id;
	if (oldPenalties.feepenaltyId.$notIn.length === 0) delete oldPenalties.feepenaltyId;
	req.feeallocations.forEach(feeallocation => {
		feeallocation.feeId = req.id;
	});
	req.feepenalties = req.feepenalties.map(feepenaltyId => ({feepenaltyId, feeId: req.id}));
	await Promise.all([
		models.feeallocationpenalty.destroy({where: oldPenalties}),
		models.feeallocation.destroy({where: oldFeeallocations}),
	]);
	await Promise.all([
		models.fee.update(req,  {where: {id: req.id}}),
		models.feeallocationpenalty.bulkCreate(req.feepenalties, {
			updateOnDuplicate: [],
		}),
		models.feeallocation.bulkCreate(req.feeallocations, {
			updateOnDuplicate: [
				'date', 'amount'
			],
		}),
	]);
	return {
		status: true,
		message: language.lang({
			key: 'updatedSuccessfully',
			lang: req.lang
		}),
	};
}