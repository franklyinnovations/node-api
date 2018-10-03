'use strict';

const
	models = require('../models'),
	language = require('./language');

models.studentleave.belongsTo(models.user);
models.assignment.hasMany(models.assignmentdetail);
models.assignment.belongsTo(models.bcsmap);
models.assignment.belongsTo(models.subject);

exports.classes = async req => ({
	status: true,
	data: await models.timetable.findAll({
		include: [
			{
				model: models.timetableallocation,
				include: [
					{
						model: models.subject,
						include: [
							{
								model: models.subjectdetail,
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`timetableallocations.subject`.`id`',
									models.subjectdetail,
									'subjectId'
								),
								attributes: ['name'],
							},
						],
						attributes: ['id'],
					},
				],
				where: {
					weekday: req.weekday,
					teacherId: req.userTypeId,
				},
				attributes: [
					'id',
					'period',
					'start_time',
					'end_time',
				],
			},
			{
				model: models.bcsmap,
				include: [
					{
						model: models.board,
						include: [
							{
								model: models.boarddetail,
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`bcsmap`.`boardId`',
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
									'`bcsmap`.`classId`',
									models.classesdetail,
									'classId'
								),
								attributes: ['name'],
							}
						],
						attributes: ['id'],
					},
					{
						model: models.section,
						include: [
							{
								model: models.sectiondetail,
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`bcsmap`.`sectionId`',
									models.sectiondetail,
									'sectionId'
								),
								attributes: ['name'],
							}
						],
						attributes: ['id'],
					},
				],
				attributes: ['id'],
			},
		],
		where: {
			is_active:1,
			masterId:req.masterId,
			academicSessionId:req.academicSessionId,
		},
		attributes: ['id'],
		order: [
			[ models.timetableallocation, 'period', 'ASC'],
			['id', 'DESC']
		],
	}),
});

exports.leaves = async req => ({
	status: true,
	data: await models.empleave.findAll({
		where: {
			userId: req.userId,
			start_date: {$gt: req.date},
			academicSessionId: req.academicSessionId,
		},
		attributes: [
			'duration',
			'start_date',
			'leavestatus',
		],
		order: [
			['start_date'],
		],
	}),
});

exports.studentLeaves = async req => {
	let timetable = await models.timetable.find({
		where: {
			classteacherId: req.userTypeId,
			academicSessionId: req.academicSessionId,
		},
		attributes: ['bcsMapId'],
	});

	return {
		status: true,
		data: timetable === null ? [] : await models.studentleave.findAll({
			include: [
				{
					model: models.user,
					include: [
						{
							model: models.userdetail,
							where: language.buildLanguageQuery(
								null,
								req.langId,
								'`user`.`id`',
								models.userdetail,
								'userId'
							),
							attributes: ['fullname'],
						}
					],
					attributes: ['id'],
				},
			],
			where: {
				start_date: {$gt: req.date},
				bcsMapId: timetable.bcsMapId,
				academicSessionId: req.academicSessionId,
			},
			attributes: ['start_date', 'duration', 'leavestatus'],
		}),
	};
};

exports.events = async req => ({
	status: true,
	data: await models.event.findAll({
		include: [
			{
				model: models.eventdetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`event`.`id`',
					models.eventdetail,
					'eventId'
				),
				attributes: ['title']
			}
		],
		where: {
			start: {$gt: req.date},
			academicSessionId: req.academicSessionId,
			users: models.sequelize.literal('`users` & ' + models.event.TEACHER_MASK + ' != 0'),
		},
		attributes: [
			'start',
		],
		order: [
			['start'],
		],
	}),
});

exports.exams = async req => {
	let tokens = await models.timetableallocation.findAll({
		include: [
			{
				model: models.timetable,
				include: [
					{
						model: models.bcsmap,
						attributes: [],
					}
				],
				where: {
					academicSessionId: req.academicSessionId,
				},
				attributes: [],
			}
		],
		where: {
			teacherId: req.userTypeId,
		},
		attributes: [
			[
				models.sequelize.fn(
					'concat',
					models.sequelize.literal('`timetable.bcsmap`.`boardId`'),
					'-',
					models.sequelize.literal('`timetable.bcsmap`.`classId`'),
					'-',
					models.sequelize.literal('`timetableallocation`.`subjectId`'),
				),
				'token'
			]
		],
	});
	if (tokens.length === 0) return {status: true, data: []};
	tokens = tokens.map(item => '"' + item.toJSON().token +'"');
	return {
		status: true,
		data: await models.examscheduledetail.findAll({
			include: [
				{
					model: models.examschedule,
					include: [
						{
							model: models.examhead,
							include: [
								{
									model: models.examheaddetail,
									where: language.buildLanguageQuery(
										null,
										req.langId,
										'`examschedule.examhead`.`id`',
										models.examheaddetail,
										'examheadId'
									),
									attributes: ['name'],
								}
							],
							attributes: ['id'],
						},
						{
							model: models.board,
							include: [
								{
									model: models.boarddetail,
									where: language.buildLanguageQuery(
										null,
										req.langId,
										'`examschedule.board`.`id`',
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
										'`examschedule.class`.`id`',
										models.classesdetail,
										'classId'
									),
									attributes: ['name'],
								}
							],
							attributes: ['id'],
						},
					],
					where: {
						academicSessionId: req.academicSessionId,
					},
					attributes: ['id'],
				},
				{
					model: models.subject,
					include: [
						{
							model: models.subjectdetail,
							where: language.buildLanguageQuery(
								null,
								req.langId,
								'`subject`.`id`',
								models.subjectdetail,
								'subjectId'
							),
							attributes: ['name'],
						},
					],
					attributes: ['id'],
				},
			],
			where: {
				date: {$gt: req.date},
				token: models.sequelize.literal(
					'concat( `examschedule`.`boardId`, "-", `examschedule`.`classId`, ' +
					'"-", `examscheduledetail`.`subjectId`) IN (' + tokens.join(',') + ')'
				),
			},
			attributes: [
				'id',
				'date',
				'start_time',
				'end_time',
			],
			order: [
				['date'],
				['start_time'],
			],
		}),
	};
};

exports.assignments = async req => ({
	status: true,
	data: await models.assignment.findAll({
		include: [
			{
				model: models.assignmentdetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`assignment`.`id`',
					models.assignmentdetail,
					'assignmentId'
				),
				attributes: ['title']
			},
			{
				model: models.bcsmap,
				include: [
					{
						model: models.board,
						include: [
							{
								model: models.boarddetail,
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`bcsmap`.`boardId`',
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
									'`bcsmap`.`classId`',
									models.classesdetail,
									'classId'
								),
								attributes: ['name'],
							}
						],
						attributes: ['id'],
					},
					{
						model: models.section,
						include: [
							{
								model: models.sectiondetail,
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`bcsmap`.`sectionId`',
									models.sectiondetail,
									'sectionId'
								),
								attributes: ['name'],
							}
						],
						attributes: ['id'],
					},
				],
			},
			{
				model: models.subject,
				include: [
					{
						model: models.subjectdetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`subject`.`id`',
							models.subjectdetail,
							'subjectId'
						),
						attributes: ['name'],
					},
				],
				attributes: ['id'],
			},
		],
		where: {
			userId: req.userId,
			start_date: {$gt: req.date},
			academicSessionId: req.academicSessionId,
		},
		attributes: [
			'start_date',
			'assignment_status',
		],
		order: [
			['start_date'],
		],
	}),
});