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
					{
						model: models.teacher,
						attributes: ['id'],
						include:[
							{
								model: models.user,
								attributes: ['id'],
								include: [
									{
										model: models.userdetail,
										where: language.buildLanguageQuery(
											null,
											req.langId,
											'`timetableallocations.teacher.user`.`id`',
											models.userdetail,
											'userId'
										),
										attributes: ['fullname'],
									}
								]
							},
						]
					}
				],
				where: {
					weekday: req.weekday,
					//teacherId: req.userTypeId,
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
			bcsMapId: req.bcsMapId
		},
		attributes: ['id'],
		order: [
			[ models.timetableallocation, 'period', 'ASC'],
			['id', 'DESC']
		],
	}),
});

exports.leaves = async req => {
	return {
		status: true,
		data: await models.studentleave.findAll({
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
				bcsMapId: req.bcsMapId,
				userId: req.userId,
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
			},
			{
				model: models.eventrecord,
				where: {bcsMapId:req.bcsMapId},
				attributes: [],
			},
		],
		where: {
			start: {$gt: req.date},
			academicSessionId: req.academicSessionId,
			users: models.sequelize.literal('`users` & ' + models.event.STUDENT_MASK + ' != 0'),
		},
		attributes: [
			'start',
		],
		order: [
			['start'],
		],
	}),
});

exports.circulars = async req => ({
	status: true,
	data: await models.circular.findAll({
		include: [
			{
				model: models.circulardetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`event`.`id`',
					models.circulardetail,
					'circularId'
				),
				attributes: ['title']
			},
			{
				model: models.circularrecord,
				where: {bcsMapId:req.bcsMapId},
				attributes: [],
			},
		],
		where: {
			date: {$gt: req.date},
			academicSessionId: req.academicSessionId,
			users: models.sequelize.literal('`users` & ' + models.circular.STUDENT_MASK + ' != 0'),
		},
		attributes: [
			'date',
		],
		order: [
			['date'],
		],
	}),
});

exports.exams = async req => {
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
						boardId: req.boardId,
						classId: req.classId
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
			bcsMapId: req.bcsMapId,
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