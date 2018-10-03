'use strict';

const
	moment = require('moment'),
	models = require('../models'),
	language = require('./language');

const bcsname = models.sequelize.literal(
	'CONCAT(`board.boarddetails`.`alias`,'
	+ ' " - " , `class.classesdetails`.`name`,'
	+ ' " - " ,`section.sectiondetails`.`name`)'
);

models.student.hasOne(models.rvdhsmaprecord);

exports.bcsmapAndRoutes = async req => {
	const [bcsmaps, routes] = await Promise.all([
		models.bcsmap.findAll({
			include: [
				{
					model: models.board,
					include: [
						{
							model: models.boarddetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`board`.`id`',
								models.boarddetail,
								'boardId'
							),
							attributes: [],
						}
					],
					attributes: [],
				},
				{
					model: models.classes,
					include: [
						{
							model: models.classesdetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`class`.`id`',
								models.classesdetail,
								'classId'
							),
							attributes: [],
						}
					],
					attributes: [],
				},
				{
					model: models.section,
					include: [
						{
							model: models.sectiondetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`section`.`id`',
								models.sectiondetail,
								'sectionId'
							),
							attributes: [],
						}
					],
					attributes: [],
				},
			],
			where: {
				is_active: true,
				masterId: req.masterId,
			},
			attributes: [
				'id',
				[bcsname, 'name'],
			],
		}),
		models.route.findAll({
			where: {
				is_active: true,
				masterId: req.masterId,
			},
			attributes: ['id', 'name'],
		}),
	]);

	return {
		status: true,
		bcsmaps,
		routes,
	};
};

exports.rvdhsmaps = async req => ({
	status: true,
	rvdhsmaps: await models.rvdhsmap.findAll({
		include: {
			model: models.vehicle,
			include: {
				model: models.vehicledetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'vehicle.id',
					models.vehicledetail,
					'vehicleId'
				),
				attributes: ['name'],
			},
			where: {
				is_active: true,
			},
			attributes: ['id', 'total_seats'],
		},
		where: {
			routeId: req.routeId,
			academicSessionId: req.academicSessionId,
		},
		attributes: ['id'],
	}),
});

exports.students = async req => {
	const whereStudent = {
			masterId: req.masterId
		},
		studentInclude = [
			{
				model: models.studentdetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'student.id',
					models.studentdetail,
					'studentId',
				),
				attributes: ['father_name', 'address']
			},
			{
				model: models.user,
				include: {
					model: models.userdetail,
					where: language.buildLanguageQuery(
						req.name ? {'fullname': {$like: '%'+ req.name + '%'}} : null,
						req.langId,
						'user.id',
						models.userdetail,
						'userId',
					),
					attributes: ['fullname'],
				},
				where: req.mobile ? {mobile: {$like: '%' + req.mobile +'%'}} : undefined,
				attributes: ['id', 'mobile'],
			},
			{
				model: models.rvdhsmaprecord,
				attributes: ['pickupId', 'dropId'],
				required: !req.bcsmapId
			},
		];


	if (req.bcsmapId) {
		studentInclude.push({
			model: models.studentrecord.scope(
				{
					method: [
						'transferred',
						moment().format('YYYY-MM-DD')
					]
				},
				{
					method: [
						'tc', '"'+moment().format('YYYY-MM-DD')+'"',
						req.academicSessionId
					]
				},
			),
			where: {
				bcsmapId: req.bcsmapId,
				academicSessionId: req.academicSessionId,
			},
			attributes: [],
		});
	}

	whereStudent.studentmapping = models.sequelize.literal(
		'(`rvdhsmaprecord`.`rvdhsmapId` IS NULL OR `rvdhsmaprecord`.`rvdhsmapId` = ' + parseInt(req.rvdhsmapId)+')'
	);

	if (req.enrollment_no) whereStudent.enrollment_no = {$like: '%' + req.enrollment_no + '%'};
	if (req.zip_code) whereStudent.zip_code = {$like: '%' + req.zip_code + '%'};

	const [students, rvdhsmapaddresses] = await Promise.all([
		models.student.findAll({
			include: studentInclude,
			where: whereStudent,
			attributes: ['id', 'enrollment_no', 'zip_code'],
			order: [
				['zip_code', 'DESC'],
				['id', 'DESC']
			],
		}),
		models.rvdhsmapaddress.findAll({
			include: {
				model: models.routeaddress,
				attributes: ['address'],
			},
			where: {
				rvdhsmapId: req.rvdhsmapId,
			},
			attributes: ['id'],
		}),
	]);
	return {status: true, students, rvdhsmapaddresses};
};

exports.save = async req => {
	await Promise.all([
		models.rvdhsmaprecord.bulkCreate(req.updated, {
			ignoreDuplicates: true,
			updateOnDuplicate: ['pickupId', 'dropId'],
		}),
		models.rvdhsmaprecord.destroy({
			where: {
				studentId: req.removed,	
				rvdhsmapId: req.rvdhsmapId,
			}
		}),
	]);

	return {
		status: true,
		message: language.lang({key: 'Saved Successfully', lang: req.lang}),
	};
};