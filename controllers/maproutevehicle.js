'use strict';

const
	models = require('../models'),
	language = require('./language');

models.rvdhsmap.belongsTo(models.route);
models.route.hasMany(models.routeaddress);
models.routeaddress.hasOne(models.rvdhsmapaddress);
models.rvdhsmap.belongsTo(models.user, {as: 'driver'});
models.rvdhsmap.belongsTo(models.user, {as: 'helper'});
models.user.hasMany(models.userdetail);
models.rvdhsmap.hasMany(models.rvdhsmapaddress);

models.user.hasMany(models.rvdhsmap, {
	as: 'driver_rvdhsmap',
	foreignKey: 'driverId',
});
models.user.hasMany(models.rvdhsmap, {
	as: 'helper_rvdhsmap',
	foreignKey: 'helperId',
});

exports.vehicleRvdhsmap = async req => {
	const rvdhsmap = await models.rvdhsmap.find({
		include: [
			{
				model: models.route,
				include: [
					{
						model: models.routeaddress,
						include: [
							{
								model: models.rvdhsmapaddress,
								where: {
									rvdhsmapId: {$eq: models.sequelize.literal('`rvdhsmap`.`id`')}
								},
								required: false,
							},
						]
					},
				],
				attributes: ['id', 'name'],
			},
			{
				model: models.user,
				as: 'driver',
				include: [
					{
						model: models.userdetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`driver.id`',
							models.userdetail,
							'userId',
						),
					}
				],
				attributes: ['id'],
			},
			{
				model: models.user,
				as: 'helper',
				include: [
					{
						model: models.userdetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`helper`.`id`',
							models.userdetail,
							'userId',
						),
						required: false,
					}
				],
				attributes: ['id'],
				required: false,
			},
		],
		where: {
			vehicleId: req.vehicleId,
			academicSessionId: req.academicSessionId,
		},
		order: [
			[models.route, models.routeaddress, 'position'],
		],
	});

	const [
		drivers,
		helpers,
		routes,
	] = await Promise.all([
		models.user.findAll({
			include: [
				{
					model: models.userdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`user`.`id`',
						models.userdetail,
						'userId',
					),
					attributes: ['fullname'],
				},
				{
					model: models.rvdhsmap,
					as: 'driver_rvdhsmap',
					where: {
						academicSessionId: req.academicSessionId,
					},
					required: false,
				},
			],
			where: {
				user_type: 'driver',
				masterId: req.masterId,
				notMapped: models.sequelize.literal('`driver_rvdhsmap`.`id` IS NULL'),
			},
			attributes: ['id'],
		}),
		models.user.findAll({
			include: [
				{
					model: models.userdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`user`.`id`',
						models.userdetail,
						'userId',
					),
					attributes: ['fullname'],
				},
				{
					model: models.rvdhsmap,
					as: 'helper_rvdhsmap',
					where: {
						academicSessionId: req.academicSessionId,
					},
					required: false,
				},
			],
			where: {
				user_type: 'helper',
				masterId: req.masterId,
				notMapped: models.sequelize.literal('`helper_rvdhsmap`.`id` IS NULL'),
			},
			attributes: ['id'],
		}),
		rvdhsmap !== null ? [rvdhsmap.route] : models.route.findAll({
			where: {
				masterId: req.masterId,
			},
			attributes: ['id', 'name'],
		}),
	]);

	if (rvdhsmap !== null) {
		drivers.push(rvdhsmap.driver);
		rvdhsmap.helper !== null && helpers.push(rvdhsmap.helper);
	}

	return {status: true, rvdhsmap, helpers, drivers, routes};
};

exports.routeAddresses = async req => {
	return {
		status: true,
		addresses: await models.routeaddress.findAll({
			where: {
				routeId: req.routeId,
			},
			order: [['position']],
		}),
	};
};

exports.save = async req => {
	const rvdhsmap = models.rvdhsmap.build(req),
		errors = language.makeErrors([await rvdhsmap.validate()], req.lang);

	if (errors) return {errors};

	if (req.id === undefined) {
		await models.rvdhsmap.create(req, {
			include: [models.rvdhsmapaddress]
		});
		return {
			status: true,
			message: language.lang({key: 'addedSuccessfully', lang: req.lang}),
		};
	} else {
		const rvdhsmapaddresses = req.rvdhsmapaddresses;
		delete req.rvdhsmapaddresses;
		await Promise.all([
			models.rvdhsmap.update(req, {where: {id: req.id}}),
			models.rvdhsmapaddress.bulkCreate(rvdhsmapaddresses, {
				ignoreDuplicates: true,
				updateOnDuplicate: ['pick_up_time', 'drop_time'],
			}),
		]);
		return {
			status: true,
			message: language.lang({key: 'updatedSuccessfully', lang: req.lang}),
		};
	}
};