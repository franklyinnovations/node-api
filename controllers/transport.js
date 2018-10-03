'use strict';

const models = require('../models'),
	language = require('./language');

models.trip.hasMany(models.triprecord);
models.trip.belongsTo(models.vehicle);
models.trip.belongsTo(models.user, {as: 'driver'});
models.trip.belongsTo(models.user, {as: 'helper'});
models.trip.belongsTo(models.rvdhsmap);
models.triprecord.belongsTo(models.student);
models.rvdhsmap.belongsTo(models.user, {as: 'driver'});
models.rvdhsmap.belongsTo(models.user, {as: 'helper'});
models.user.hasMany(models.userdetail);
models.student.belongsTo(models.user);
models.student.hasMany(models.studentdetail);
models.rvdhsmap.belongsTo(models.route);
models.rvdhsmap.belongsTo(models.vehicle);
models.rvdhsmap.hasMany(models.rvdhsmapaddress);
models.rvdhsmapaddress.belongsTo(models.routeaddress);
models.vehicle.hasMany(models.vehicledetail);
models.rvdhsmap.hasMany(models.rvdhsmaprecord);
models.rvdhsmap.hasOne(models.trip);
models.rvdhsmaprecord.belongsTo(models.student);
models.student.hasOne(models.triprecord);
models.triprecord.belongsTo(models.trip);

exports.getRoutes = async req => {
	const
		where = {
			academicSessionId: req.academicSessionId,
		},
		attributes = ['id'];

	if (req.user_type === 'driver') {
		const breakdowns = await getBreakdowns(req);
		where.$or = [
			{driverId: req.userId},
			{id: breakdowns},
		];
		attributes.push([
			models.sequelize.fn(
				'FIND_IN_SET',
				models.sequelize.col('`rvdhsmap`.`id`'),
				breakdowns,
			),
			'breakdown'
		]);
	} else if (req.user_type === 'helper') {
		const breakdowns = await getBreakdowns(req);
		where.$or = [
			{driverId: req.userId},
			{id: breakdowns},
		];
		attributes.push([
			models.sequelize.fn(
				'FIND_IN_SET',
				models.sequelize.col('`rvdhsmap`.`id`'),
				breakdowns,
			),
			'breakdown'
		]);
	} else if (req.user_type === 'institute' || req.user_type === 'admin'){
		where.masterId = req.masterId;
	} else if (req.masterId != 1) {
		where.id = -1;
	}
	return models.rvdhsmap.findAll({
		include:  [
			{
				model: models.route,
				where: {
					is_active: 1
				},
				attributes: ['id', 'name'],
			},
			{
				model: models.rvdhsmapaddress,
				include: [
					{
						model: models.routeaddress,
						attributes: {
							exclude: ['routeId']
						}
					}
				],
				attributes: ['pick_up_time', 'drop_time']
			},
			{
				model: models.vehicle,
				include: [
					{
						model: models.vehicledetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`vehicle`.`id`',
							models.vehicledetail,
							'vehicleId'
						),
						attributes: ['name']
					}
				],
				where: {
					is_active: 1
				},
				attributes: [
					'id', 'number', 'vehicle_type', 'total_seats', 'vehicle_image'
				]
			},
			{
				model: models.user,
				as: 'driver',
				include: [
					{
						model: models.userdetail,
						attributes: ['fullname'],
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`driver`.`id`',
							models.userdetail,
							'userId'
						),
					}
				],
				attributes: ['id']
			},
			{
				model: models.user,
				as: 'helper',
				include: [
					{
						model: models.userdetail,
						attributes: ['fullname'],
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`helper`.`id`',
							models.userdetail,
							'userId'
						),
						required: false
					}
				],
				attributes: ['id'],
				required: false
			}
		],
		where,
		attributes,
	});
};

exports.getTrip = async req => {
	let where = {};
	if (req.id) {
		where.id = req.id;
	} else {
		where.date = getDate(req.date);
		where.rvdhsmapId = req.rvdhsmapId;
	}

	const tripStudentInclude = {
		model: models.triprecord,
		include: [
			{
				model: models.student,
				include: [
					{
						model: models.user,
						include:
						[
							{
								model: models.userdetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`triprecords.student.user`.`id`',
									models.userdetail,
									'userId'
								),
								attributes: ['fullname']
							}
						],
						attributes: ['user_image', 'mobile']
					},
					{
						model: models.studentdetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`triprecords.student`.`id`',
							models.studentdetail,
							'studentId'
						),
						attributes: ['father_name', 'mother_name']
					}
				],
				attributes: ['father_contact', 'mother_contact']
			}
		],
	};

	const trip = await models.trip.findOne({
		where,
		include: tripStudentInclude,
		attributes: ['id', 'status', 'rvdhsmapId']
	});

	if (req.id || trip !== null) return {status: true, data: trip};
	if (req.strict) return {status: true, data: trip};
	const rvdhsmap = await models.rvdhsmap.findById(where.rvdhsmapId);
	if (rvdhsmap === null) throw 'rvdhsmap not found';
	const rvdhsmaprecords = await models.rvdhsmaprecord.scope({method: ['tc', '`rvdhsmaprecord`.`studentId`']}).findAll({
		where: {
			rvdhsmapId: req.rvdhsmapId
		},
		attributes: ['studentId', 'pickupId', 'dropId']
	});
	if (rvdhsmaprecords.length === 0) {
		return {
			status: false,
			message: language.lang({
				key: 'No students found',
				lang: req.lang
			}),
		};
	} else {
		const {driverId, helperId, vehicleId} = await getTripVehicleDetails(rvdhsmap, where.date);
		const trip = await models.trip.create(
			{
				driverId,
				helperId,
				vehicleId,
				date: where.date,
				masterId: req.masterId,
				rvdhsmapId: req.rvdhsmapId,
				triprecords: rvdhsmaprecords.map(rvdhsmaprecord => ({
					times: {},
					studentId: rvdhsmaprecord.studentId,
					type: rvdhsmaprecord.pickupId ? (rvdhsmaprecord.dropId ? 3 : 1) : 2,
				})),
			},
			{
				include:[{model: models.triprecord}]
			}
		);
		await trip.reload({
			include: tripStudentInclude,
			attributes: ['id', 'status', 'rvdhsmapId'],
		});
		return ({status: true, data: trip});
	}
};

exports.getStudentRVDHSMap = function (req) {
	let studentIds = req.studentIds ? req.studentIds.split(',') : [],
		academicSessionIds = req.academicSessionIds ? req.academicSessionIds.split(',') : [];
	if (studentIds.length === 0 || academicSessionIds.length === 0)
		return Promise.resolve([]);
	return models.rvdhsmap.findAll({
		include: [
			{
				model: models.route,
				where: {
					is_active: 1
				},
				attributes: ['id', 'name']
			},
			{
				model: models.rvdhsmapaddress,
				include: [
					{
						model: models.routeaddress,
						attributes: {
							exclude: ['routeId']
						}
					}
				],
				attributes: ['pick_up_time', 'drop_time']
			},
			{
				model: models.vehicle,
				include: [
					{
						model: models.vehicledetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`vehicle`.`id`',
							models.vehicledetail,
							'vehicleId'
						),
						attributes: ['name']
					}
				],
				where: {
					is_active: 1
				},
				attributes: [
					'id', 'number', 'vehicle_type', 'total_seats', 'vehicle_image'
				]
			},
			{
				model: models.user,
				as: 'driver',
				include: [
					{
						model: models.userdetail,
						attributes: ['fullname'],
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`driver`.`id`',
							models.userdetail,
							'userId'
						),
					}
				],
				attributes: ['id']
			},
			{
				model: models.user,
				as: 'helper',
				include: [
					{
						model: models.userdetail,
						attributes: ['fullname'],
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`helper`.`id`',
							models.userdetail,
							'userId'
						),
						required: false
					}
				],
				attributes: ['id'],
				required: false
			},
			{
				model: models.trip,
				where: { date : getDate(req.date) },
				attributes: ['id', 'status'],
				required: false
			},
			{
				model: models.rvdhsmaprecord,
				include: [
					{
						model: models.student,
						include: [
							{
								model: models.user,
								include: [
									{
										model: models.userdetail,
										where: language.buildLanguageQuery(
											{},
											req.langId,
											'`rvdhsmaprecords.student.user`.`id`',
											models.userdetail,
											'userId'
										),
										attributes: ['fullname']
									}
								],
								attributes: ['mobile', 'user_image']
							},
							{
								model: models.triprecord,
								where: {
									tripId: models.sequelize.literal(
										'`rvdhsmaprecords.student.triprecord`.`tripId` =  `trip`.`id` '
									)
								},
								required: false
							}
						],
						attributes: ['id']
					}
				],
				where: {
					studentId: {
						$in: studentIds
					}
				},
				attributes: ['studentId'],
			}
		],
		where: {
			academicSessionId: {
				$in: academicSessionIds
			}
		},
		attributes: ['id']
	});
};

exports.trips = async req => ({
	status: true,
	trips: await models.trip.findAll({
		include: [
			{
				model: models.vehicle,
				include: [
					{
						model: models.vehicledetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`vehicle`.`id`',
							models.vehicledetail,
							'vehicleId'
						),
						attributes: ['name']
					}
				],
				where: {
					is_active: 1
				},
				attributes: [
					'id',
					'number',
					'vehicle_type',
					'total_seats',
					'vehicle_image',
				]
			},
			{
				model: models.user,
				as: 'driver',
				include:
				[
					{
						model: models.userdetail,
						attributes: ['fullname'],
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`driver`.`id`',
							models.userdetail,
							'userId'
						),
					}
				],
				attributes: ['id']
			},
			{
				model: models.user,
				as: 'helper',
				include:
				[
					{
						model: models.userdetail,
						attributes: ['fullname'],
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`helper`.`id`',
							models.userdetail,
							'userId'
						),
						required: false
					}
				],
				attributes: ['id'],
				required: false
			},
		],
		where: {
			status: [1, 2, 3],
			masterId: req.masterId,
			date: getDate(),
		},
	}),
});

exports.rvdhsmaps = async req => ({
	status: true,
	rvdhsmaps: await models.rvdhsmap.findAll({
		where: {
			masterId: req.masterId,
			academicSessionId: req.academicSessionId,
		},
	}),
});

exports.activeTrips = async req => ({
	status: true,
	trips: await models.trip.findAll({
		where: {
			date: getDate(),
			status: [1, 2, 3],
			masterId: req.masterId,
		},
		attributes: ['id'],
	}),
});

function getDate(date = Date.now()) {
	if (date) {
		date = new Date(parseInt(date));
		if (isNaN(date.getTime())) return Promise.reject('invalid date');
	} else {
		date = new Date();
	}
	let result = new Date(0);
	result.setUTCFullYear(date.getUTCFullYear());
	result.setUTCMonth(date.getUTCMonth());
	result.setUTCDate(date.getUTCDate());
	result = result.getTime();
	return result;
}

async function getTripVehicleDetails(rvdhsmap, _date) {
	let date = new Date(_date);
	date = date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate();
	const breakdown = models.vehiclebreakdown.find({
		include: {
			model: models.rvdhsmap,
			as: 'replacementRvdhsmap',
			include: {
				model: models.vehicle,
				where: {
					is_active: true,
				},
				attributes: [],
			},
			attributes: ['vehicleId', 'driverId', 'helperId'],
		},
		where: {date},
		attributes: ['id'],
	});

	return breakdown.replacementRvdhsmap || rvdhsmap;
}

async function getBreakdowns(req) {
	let date = new Date(getDate(req.date));
	date = date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate();
	const where = {academicSessionId: req.academicSessionId};
	if (req.user_type === 'driver') {
		where.driverId = req.userId;
	} else {
		where.helperId = req.userId;
	}
	const breakdowns = await models.vehiclebreakdown.findAll({
		include: [
			{
				model: models.rvdhsmap,
				as: 'replacementRvdhsmap',
				where,
				attributes: [],
			}
		],
		where: {date},
		attributes: ['rvdhsmapId'],
	});
	return breakdowns.map(breakdown => breakdown.rvdhsmapId).join(',');
}

exports.getTripInfo = async req => ({
	status: true,
	data: await models.trip.findById(req.id, {
		include: [
			{
				model: models.rvdhsmap,
				include: [
					{
						model: models.route,
						attributes: ['name'],
					}
				],
				attributes: ['id', 'routeId'],
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
							'`driver`.`id`',
							models.userdetail,
							'userId'
						),
						attributes: ['fullname'],
					}
				],
				attributes: ['id', 'mobile'],
			},
			{
				model: models.vehicle,
				include: [
					{
						model: models.vehicledetail,
						attributes: ['name'],
					}
				],
				attributes: ['number', 'vehicle_type'],
			},
		],
		attributes: [
			'status',
			[
				models.sequelize.literal(
					'(SELECT COUNT(*) FROM `trip_records` WHERE `trip_records`.`tripId` = `trip`.`id` AND `trip_records`.`status` IN (2, 4))'
				),
				'onboard_students'
			]
		]
	}),
});