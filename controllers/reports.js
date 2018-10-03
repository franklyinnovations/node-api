'use strict';

const
	moment = require('moment'),
	models = require('../models'),
	language = require('./language'),
	utils = require('../utils');

models.teacher.hasMany(models.timetableallocation);
models.teacher.belongsTo(models.user);
models.teacher.hasMany(models.teachersubject);

models.student.belongsTo(models.user);
models.student.hasOne(models.studentrecord);
models.student.hasMany(models.studentdetail);
models.student.hasMany(models.attendancerecord);
models.student.hasMany(models.markrecord);

models.user.hasMany(models.userdetail);
models.user.hasMany(models.assignment);
models.user.hasMany(models.empleave);

models.attendance.hasMany(models.attendancerecord);
models.attendance.belongsTo(models.bcsmap);

models.attendancerecord.belongsTo(models.attendance);

models.mark.hasMany(models.markrecord);
models.mark.belongsTo(models.bcsmap);

models.markrecord.belongsTo(models.mark);

models.bcsmap.belongsTo(models.board);
models.bcsmap.belongsTo(models.classes);
models.bcsmap.belongsTo(models.section);

models.board.hasMany(models.boarddetail);

models.classes.hasMany(models.classesdetail);

models.section.hasMany(models.sectiondetail);

models.timetableallocation.belongsTo(models.timetable);
models.timetable.hasMany(models.timetableallocation);
models.timetableallocation.belongsTo(models.teacher);
models.timetableallocation.belongsTo(models.subject);
models.subject.hasMany(models.subjectdetail);
models.subject.hasMany(models.mark);
models.timetableallocation.hasMany(models.classreport);
models.timetableallocation.hasMany(models.assignment);

models.classes.hasMany(models.bcsmap);
models.bcsmap.belongsTo(models.section);
models.bcsmap.hasMany(models.attendance);

models.empattendance.belongsTo(models.user);
models.empattendance.belongsTo(models.empleave);
models.empattendance.belongsTo(models.teacher,{foreignKey:'userId', targetKey: 'userId'});
models.timetable.belongsTo(models.bcsmap,{foreignKey:'bcsMapId'});
models.empleave.belongsTo(models.user);
models.timetableallocation.hasMany(models.proxy_classes);
models.proxy_classes.belongsTo(models.teacher);
models.user.hasOne(models.teacher);

exports.teacherSchedule = req => models.teacher.findAll({
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
		{
			model: models.timetableallocation,
			where: {
				weekday: req.weekday,
				subjectId: req.subjectId,
				timetable: models.sequelize.literal('EXISTS(SELECT `id` FROM `timetables` WHERE `timetables`.`id` = `timetableallocations`.`timetableId` AND `timetables`.`is_active` AND `timetables`.`academicSessionId` = ' + parseInt(req.academicSessionId) + ')'),
			},
			attributes: ['id', 'start_time', 'end_time'],
			required: false,
		},
		{
			model: models.teachersubject,
			where: {
				subjectId: req.subjectId,
			},
			attributes: [],
		},
	],
	attributes: ['id'],
	where: {
		masterId: req.masterId,
	},
	order: [
		['id', 'DESC'],
		[models.timetableallocation, 'start_time']
	],
});

exports.assignmentReport = req => {
	let where = {
		academicSessionId: req.academicSessionId,
	};
	if (req.start && req.end)
		where.start_date = {$and: {$gte: req.start, $lte: req.end}};
	else if (req.start)
		where.start_date = {$gte: req.start};
	else if (req.end)
		where.start_date = {$lte: req.end};

	return models.teacher.findAll({
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
					},
					{
						model: models.assignment,
						where,
						attributes: [
							'assignment_status',
							[models.sequelize.literal('COUNT((`user.assignments`.`id`))'), 'count'],
						],
						required: false,
					},
				],
				where: {
					is_active: true,
				},
				attributes: ['id'],
			},
		],
		where: {
			id: {$in: req.teachers},
		},
		attributes: [
			'id',
		],
		order: [
			['id', 'DESC'],
			[models.user, models.assignment, 'assignment_status'],
		],
		group: [
			['id'],
			[models.user, models.assignment, 'assignment_status'],
		],
	})
};

exports.empLeaveReport = req => {
	let where = {
		academicSessionId: req.academicSessionId,
		masterId: req.masterId,
	};
	if (req.start && req.end)
		where.start_date = {$and: {$gte: req.start, $lte: req.end}};
	else if (req.start)
		where.start_date = {$gte: req.start};
	else if (req.end)
		where.start_date = {$lte: req.end};

	return models.user.findAll({
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
			},
			{
				model: models.empleave,
				where,
				attributes: [
					'leavestatus',
					[models.sequelize.literal('SUM((`empleaves`.`duration`))'), 'sum'],
				],
				required: false,
			},
		],
		where: {
			is_active: true,
			masterId: req.masterId,
			user_type: req.user_type,
		},
		attributes: ['id', 'mobile', 'email'],
		group: [
			['id'],
			[models.empleave, 'leavestatus'],
		],
	});
};

exports.student = req => {
	let where = {
		student: {
			masterId: req.masterId,
		},
	};
	if (req.res_category) where.student.res_category = req.res_category;
	if (req.gender) where.student.gender = req.gender;
	if (req.religion)
		where.studentdetail = {
			religion: req.religion,
		};

	return models.student.findAll({
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
					},
				],
				where: {
					is_active: true,
				},
				attributes: ['id'],
			},
			{
				model: models.studentrecord.scope(
					{ method: ['transferred', moment().format('YYYY-MM-DD')]},
					{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
				),
				where: {
					bcsMapId: req.bcsMapId,
					academicSessionId: req.academicSessionId,
					/*record_status: 1,
					$or: [
						{transferred: 0},
						{transferred: 1, transerred_effective_from: {$gt: moment().format('YYYY-MM-DD')}},
						{transferred: 2, transerred_effective_from: {$lte: moment().format('YYYY-MM-DD')}}
					],*/
				},
				attributes: [],
			},
			{
				model: models.studentdetail,
				where: language.buildLanguageQuery(
					where.studentdetail,
					req.langId,
					'`student`.`id`',
					models.studentdetail,
					'studentId'
				),
				attributes: ['father_name', 'religion'],
			},
		],
		where: where.student,
		attributes: [
			'id',
			'enrollment_no',
			'res_category',
			'gender'
		],
		order: [
			[models.studentrecord, 'roll_no'],
			['id', 'DESC'],
		],
	});
};

exports.dashboard = req => Promise.all([
	exports.dashboardAssignments(req),
	exports.dashboardClassReports(req),
	exports.dashboardAttendance(req),
	exports.todaysAbsentTeachers(req),
	exports.upcomingEmpLeaves(req),
	exports.totalfees(req),
	exports.teacherDailySchedules(req),
	//exports.dashboardAttendance(req),
	//exports.dashboardMarks(req),
]);

exports.teacherDailySchedules = req => {
	var isWhere = {};
	isWhere.boarddetail = language.buildLanguageQuery(
		isWhere.boarddetail, req.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
	);
	isWhere.classesdetail = language.buildLanguageQuery(
		isWhere.classesdetail, req.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
	);
	isWhere.sectiondetail = language.buildLanguageQuery(
		isWhere.sectiondetail, req.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
	);
	isWhere.userdetail = language.buildLanguageQuery(
		isWhere.userdetail, req.langId, '`teacher.user`.`id`', models.userdetail, 'userId'
	);
	return Promise.all([
		models.teacher.findAll({
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
					where: {
						is_active: 1
					}
				}
			],
			where: {
				masterId: req.masterId
			},
			attributes: ['id'],
		}),
		models.timetable.findAll({
			include: [
				{
					model: models.timetableallocation,
					include:[
						{
							model:models.subject, 
							attributes:['id'], 
							include:[
								{
									model:models.subjectdetail, 
									attributes:['id', 'name'], 
									where: language.buildLanguageQuery(
										{}, 
										req.langId, 
										'`timetableallocations.subject`.`id`',
										models.subjectdetail, 
										'subjectId'
									), 
									required: false}], 
							required: false
						}
					],
					where:{
						weekday: req.day,
						teacherId: {$ne : null}
					},
					attributes:['teacherId', 'weekday', 'start_time', 'end_time', 'period']
				},
				{
					model: models.bcsmap,
					include: [
						{
							model: models.board, attributes:['id'],
							include: [
								{
									model: models.boarddetail,
									attributes:['id', 'name', 'alias'],
									where:isWhere.boarddetail
								}
							]
						},
						{
							model: models.classes, 
							attributes:['id'],
							include: [
								{
									model: models.classesdetail,
									attributes:['id', 'name'],
									where:isWhere.classesdetail
								}
							]
						},
						{
							model: models.section, attributes:['id'],
							include: [
								{
									model: models.sectiondetail,
									attributes:['id', 'name'],
									where:isWhere.sectiondetail
								}
							]
						}
					],
				},
			],
			attributes:['id', 'classteacherId', 'bcsMapId'],
			where: {
				academicSessionId: req.academicSessionId,
				masterId: req.masterId,
				is_active: 1
			},
			order: [
				[models.bcsmap, models.board, 'display_order'],
				[models.bcsmap, models.classes, 'display_order'],
				[models.bcsmap, models.section, 'display_order'],
				[models.timetableallocation, 'period'],
			],
			
		})
	]);
};

exports.dashboardAssignments = req => {
	let where = {
		masterId: req.masterId,
		academicSessionId: req.academicSessionId,
	};
	if (req.user_type === 'teacher') where.userId = req.userId;
	if (req.date) where.$or = [
		{assignment_status: 'Published', 'start_date': req.date},
		{assignment_status: 'Completed', 'reviewedAt': req.date},
	];
    
	return Promise.all([
		models.assignment.findAll({
			attributes: [
				'assignment_status',
				[models.sequelize.literal('COUNT(`id`)'), 'count']
			],
			where,
			group: [
				['assignment_status'],
			],
		}),
		!req.bcsMapId ? [] : models.assignment.findAll({
			attributes: [
				'assignment_status',
				[models.sequelize.literal('COUNT(`id`)'), 'count']
			],
			where: {
				...where,
				bcsMapId: req.bcsMapId,
			},
			group: [
				['assignment_status'],
			],
		}),
		!req.bcsMapId ? [] : models.timetableallocation.findAll({
			include: [
				{
					model: models.timetable,
					where: {
						masterId: req.masterId,
						academicSessionId: req.academicSessionId,
						bcsMapId: req.bcsMapId,
					},
					attributes: [],
				},
				{
					model: models.assignment,
					on:[
						'`timetable`.`academicSessionId` = `assignments`.`academicSessionId` AND \
							`timetable`.`bcsMapId` = `assignments`.`bcsMapId` AND \
							`timetableallocation`.`subjectId` = `assignments`.`subjectId`',
						[]
					],
					where: {
						$or: [
							{
								assignment_status: 'Published',
								start_date: req.date
							},
							{
								assignment_status: 'Completed',
								reviewedAt: req.date,
							},
						]
					},
					required: false,
					attributes: [],
				},
				{
					model: models.subject,
					include: [
						{
							model:models.subjectdetail,
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
				}
			],
			where: {
				weekday: req.day,
				pending: models.sequelize.literal(
					'`assignments`.`id` IS NULL'
				),
			},
			attributes: [],
			group: [
				['subjectId']
			],
		})
	]);
};

exports.dashboardClassReports = req => {
	return Promise.all([
		getClassReport(req),
		req.bcsMapId ? getClassReport(req, req.bcsMapId) : null,
	]);
};

async function getClassReport (req, bcsMapId) {
	let where = {
		masterId: req.masterId,
		academicSessionId: req.academicSessionId,
	};

	if (bcsMapId) where.bcsMapId = req.bcsMapId;

	let results = await models.timetableallocation.findAll({
		include: [
			{
				model: models.timetable,
				where,
				attributes: [],
			},
			{
				model: models.classreport,
				on: [
					'`timetable`.`academicSessionId` = `classreports`.`academicSessionId` AND '
						+ '`timetable`.`bcsMapId` = `classreports`.`bcsMapId` AND '
						+ '`timetableallocation`.`subjectId` = `classreports`.`subjectId` AND '
						+ '`timetableallocation`.`order` = `classreports`.`order`'
					, []
				],
				where: {
					date: req.date,
				},
				required: false,
				attributes: [],
			}
		],
		where: {
			weekday: req.day,
			teacherId: {$ne : null}
		},
		attributes: [
			[models.sequelize.literal('`classreports`.`id` IS NULL'), 'pending'],
			[models.sequelize.literal('COUNT(`timetableallocation`.`id`)'), 'count'],
			[models.sequelize.literal('GROUP_CONCAT(`timetableallocation`.`teacherId`)'), 'teachers'],
		],
		group: [
			[models.sequelize.literal('`classreports`.`id` IS NULL')]
		],
	});

	results = results.map(result => result.get());

	let pending = results.find(row => row.pending) || {
			pending: true,
			count: 0,
			teachers: '',
		},
		filled = results.find(row => !row.pending) || {
			pending: false,
			count: 0,
			teachers: '',
		};

	return {
		pending: pending.count,
		filled: filled.count,
		pendingTeacherIds: pending.teachers || '',
		pendingTeachers: !pending.teachers ? [] : await models.teacher.findAll({
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
				}
			],
			attributes: ['id'],
			where: {
				id: models.sequelize.literal(
					'FIND_IN_SET(`teacher`.`id`, "'+pending.teachers + '")',
				),
			},
		})
	};
}

exports.dashboardAttendance = req => {
	let where = {
		academicSessionId: req.academicSessionId,
		period: 1,
		date: req.date
	};
	if (req.user_type === 'teacher') where.userId = req.userTypeId;
	return models.classes.findAll({
		include:[
			{
				model: models.classesdetail,
				where: language.buildLanguageQuery(
					{},
					req.langId,
					'`classes`.`id`',
					models.classesdetail,
					'classId'
				),
				attributes: [],
			},
			{
				model:models.bcsmap,
				include: [
					{
						model: models.board,
						attributes: [],
						include: [
							{
								model: models.boarddetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`bcsmaps.board`.`id`',
									models.boarddetail,
									'boardId'
								),
								attributes: [],
							}
						],
					},
					{
						model: models.section,
						attributes: [],
						include: [
							{
								model: models.sectiondetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`bcsmaps.section`.`id`',
									models.sectiondetail,
									'sectionId'
								),
								attributes: [],
							},
						],
					},
					{
						model: models.attendance,
						include: [
							{
								model: models.attendancerecord,
								attributes: [],
								required: false
							}
						],
						where,
						attributes: [],
						required: false,
					}
				],
				where: {
					is_active: 1,
					//boardId:16
				},
				attributes: [
					'id',
					[models.sequelize.literal('`bcsmaps.board.boarddetails`.`alias`'), 'bname'],
					[models.sequelize.literal('CONCAT(`classesdetails`.`name`, " - " ,`bcsmaps.section.sectiondetails`.`name`)'), 'name'],
					[models.sequelize.literal('COUNT(`bcsmaps.attendances.attendancerecords`.`id`)'), 'total'],
					[models.sequelize.literal('SUM(CASE WHEN `bcsmaps.attendances.attendancerecords`.`is_present` = 1 THEN 1 ELSE 0 END)'), 'present'],
					[models.sequelize.literal('SUM(CASE WHEN `bcsmaps.attendances.attendancerecords`.`is_present` = 3 THEN 1 ELSE 0 END)'), 'absent'],
					[models.sequelize.literal('SUM(CASE WHEN `bcsmaps.attendances.attendancerecords`.`is_present` = 2 THEN 1 ELSE 0 END)'), 'late'],
				],
			}
		],
		where: {
			masterId: req.masterId,
		},
		order: [
			['display_order'],
			[models.bcsmap, models.board, 'display_order'],
			[models.bcsmap, models.section, 'display_order'],
			['id', 'DESC'],
		],
		attributes: [],
		group: [
			[models.bcsmap, 'id']
		],
	});
};

exports.todaysAbsentTeachers = async req => {
	let where = {
		empattendance: {
			masterId: req.masterId,
			academicSessionId: req.academicSessionId,
			user_type: 'teacher',
			date: req.date,
			attendancestatus: {$ne: 1},
		},
		userdetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`user`.`id`',
			models.userdetail,
			'userId'
		),
		timetable: {
			masterId: req.masterId,
			academicSessionId: req.academicSessionId,
			is_active: 1,
		},
		timetableallocation: {
			weekday: req.day,
			timetableId: models.sequelize.literal('EXISTS(SELECT `id` FROM `timetables` WHERE `timetables`.`id` = `teacher.timetableallocations`.`timetableId` AND `timetables`.`is_active` AND `timetables`.`academicSessionId` = ' + parseInt(req.academicSessionId) + ')'),
		},
		boarddetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`teacher.timetableallocations.timetable.bcsmap.board`.`id`',
			models.boarddetail,
			'boardId'
		),
		classesdetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`teacher.timetableallocations.timetable.bcsmap.class`.`id`',
			models.classesdetail,
			'classId'
		),
		sectiondetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`teacher.timetableallocations.timetable.bcsmap.section`.`id`',
			models.sectiondetail,
			'sectionId'
		),
		subjectdetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`teacher.timetableallocations.subject`.`id`',
			models.subjectdetail,
			'subjectId'
		),
	};
	return await Promise.all([
		models.empattendance.count({
			where: {
				masterId: req.masterId,
				academicSessionId: req.academicSessionId,
				user_type: 'teacher',
				date: req.date,
				attendancestatus: 1
			}
		}),
		models.empattendance.findAll({
			include: [
				{
					model: models.user,
					attributes: ['id', 'mobile'],
					include: [
						{
							model: models.userdetail,
							where: where.userdetail,
							attributes: ['fullname']
						}
					]
				},
				{
					model: models.empleave,
					attributes: ['id','halfday'],
					required: false
				},
				{
					model: models.teacher,
					attributes: ['id'],
					include: [
						{
							model: models.timetableallocation,
							include: [
								{
									model: models.timetable,
									where: where.timetable,
									attributes: [],
									include:[
										{
											model: models.bcsmap,
											include: [
												{
													model: models.board,
													include: [
														{
															model: models.boarddetail,
															where: where.boarddetail,
															attributes: [],
															required: false
														}
													],
													required: false
												},
												{
													model: models.classes,
													include: [
														{
															model: models.classesdetail,
															where: where.classesdetail,
															attributes: [],
															required: false
														}
													],
													required: false
												},
												{
													model: models.section,
													include: [
														{
															model: models.sectiondetail,
															where: where.sectiondetail,
															attributes: [],
															required: false
														}
													],
													required: false
												}
											],
											attributes: ['id'],
											required: false
										}
									],
									required: false
								},
								{
									model: models.subject,
									attributes: [],
									include: [
										{
											model: models.subjectdetail,
											where: where.subjectdetail,
											attributes: [],
											required: false
										}
									],
									required: false
								}
							],
							where: where.timetableallocation,
							required: false,
							attributes: [
								[
									models.sequelize.fn(
										'CONCAT',
										models.sequelize.col('`teacher.timetableallocations.timetable.bcsmap.board.boarddetails.alias`'),
										'-',
										models.sequelize.col('`teacher.timetableallocations.timetable.bcsmap.class.classesdetails.name`'),
										'-',
										models.sequelize.col('`teacher.timetableallocations.timetable.bcsmap.section.sectiondetails.name`'),
										'-',
										models.sequelize.col('`teacher.timetableallocations.subject.subjectdetails.name`'),
									),
									'teachersubject'
								]
							],
						}
					]
				}
			],
			where: where.empattendance,
			order: [
				[models.teacher, 'id', 'DESC'],
				[models.teacher, models.timetableallocation, 'period'],
				[models.teacher, models.timetableallocation, models.timetable, models.bcsmap, models.board, 'display_order'],
				[models.teacher, models.timetableallocation, models.timetable, models.bcsmap, models.classes, 'display_order'],
				[models.teacher, models.timetableallocation, models.timetable, models.bcsmap, models.section, 'display_order'],
			],
			attributes: ['userId', 'attendancestatus'],
		})
	]);
};

exports.upcomingEmpLeaves = async req => {
	let where = {
		empleave: {
			masterId: req.masterId,
			academicSessionId: req.academicSessionId,
			user_type: 'teacher',
			end_date: {$gt:req.date},
		},
		userdetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`user`.`id`',
			models.userdetail,
			'userId'
		),
	};
	if (req.user_type === 'teacher') where.empleave.userId = req.userTypeId;
	return await models.empleave.findAll({
		include: [
			{
				model: models.user,
				attributes: ['id', 'mobile'],
				include: [
					{
						model: models.userdetail,
						where: where.userdetail,
						attributes: ['fullname']
					}
				]
			}
		],
		order: [
			[models.user, 'id', 'DESC'],
			['end_date']
		],
		attributes: ['id', 'start_date', 'end_date', 'duration', 'halfday', 'leavestatus', 'user_type'],
		where: where.empleave,
	});
};

exports.upcomingLeavesById = async req => {
	let where = {
		empleave: {
			id: req.id,
		},
		userdetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`user`.`id`',
			models.userdetail,
			'userId'
		),
	};
	return await models.empleave.find({
		include: [
			{
				model: models.user,
				attributes: ['id'],
				include: [
					{
						model: models.userdetail,
						where: where.userdetail,
						attributes: ['fullname']
					},
					{
						model: models.teacher,
						attributes: ['id']
					}
				]
			}
		],
		order: [
			[models.user, 'id', 'DESC'],
			['end_date']
		],
		attributes: ['id', 'start_date', 'end_date', 'duration', 'halfday', 'leavestatus', 'user_type'],
		where: where.empleave,
	});
};

exports.teacherClasses = async req => {
	let where = {
		teacher: {
			id: req.id
		},
		userdetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`user`.`id`',
			models.userdetail,
			'userId'
		),
		timetable: {
			masterId: req.masterId,
			academicSessionId: req.academicSessionId,
			is_active: 1,
		},
		timetableallocation: {
			weekday: req.day,
			timetableId: models.sequelize.literal('EXISTS(SELECT `id` FROM `timetables` WHERE `timetables`.`id` = `timetableallocations`.`timetableId` AND `timetables`.`is_active` AND `timetables`.`academicSessionId` = ' + parseInt(req.academicSessionId) + ')'),
		},
		proxy_classes: {
			masterId: req.masterId,
			academicSessionId: req.academicSessionId,
			date: req.date
		},
		boarddetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`timetableallocations.timetable.bcsmap.board`.`id`',
			models.boarddetail,
			'boardId'
		),
		classesdetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`timetableallocations.timetable.bcsmap.class`.`id`',
			models.classesdetail,
			'classId'
		),
		sectiondetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`timetableallocations.timetable.bcsmap.section`.`id`',
			models.sectiondetail,
			'sectionId'
		),
		subjectdetail: language.buildLanguageQuery(
			null,
			req.langId,
			'`timetableallocations.subject`.`id`',
			models.subjectdetail,
			'subjectId'
		),
	};

	return await models.teacher.find({
		include: [
			{
				model: models.user,
				attributes: ['id'],
				include: [
					{
						model: models.userdetail,
						where: where.userdetail,
						attributes: ['fullname']
					}
				]
			},
			{
				model: models.timetableallocation,
				include: [
					{
						model: models.proxy_classes,
						where: where.proxy_classes,
						attributes: ['id'],
						required: false,
						include:[
							{
								model: models.teacher,
								attributes: ['id'],
								required: false,
								include:[
									{
										model: models.user,
										attributes: ['id'],
										required: false,
										include: [
											{
												model: models.userdetail,
												where: where.userdetail,
												attributes: ['fullname'],
												required: false,
											}
										]
									},
								]
							}
						]
					},
					{
						model: models.timetable,
						where: where.timetable,
						attributes: [],
						include:[
							{
								model: models.bcsmap,
								include: [
									{
										model: models.board,
										include: [
											{
												model: models.boarddetail,
												where: where.boarddetail,
												attributes: [],
												required: false
											}
										],
										required: false
									},
									{
										model: models.classes,
										include: [
											{
												model: models.classesdetail,
												where: where.classesdetail,
												attributes: [],
												required: false
											}
										],
										required: false
									},
									{
										model: models.section,
										include: [
											{
												model: models.sectiondetail,
												where: where.sectiondetail,
												attributes: [],
												required: false
											}
										],
										required: false
									}
								],
								attributes: ['id'],
								required: false
							}
						],
						required: false
					},
					{
						model: models.subject,
						attributes: [],
						include: [
							{
								model: models.subjectdetail,
								where: where.subjectdetail,
								attributes: [],
								required: false
							}
						],
						required: false
					}
				],
				where: where.timetableallocation,
				required: false,
				attributes: [
					'id', 'period',
					[
						models.sequelize.fn(
							'CONCAT',
							models.sequelize.col('`timetableallocations.timetable.bcsmap.board.boarddetails.alias`'),
							'-',
							models.sequelize.col('`timetableallocations.timetable.bcsmap.class.classesdetails.name`'),
							'-',
							models.sequelize.col('`timetableallocations.timetable.bcsmap.section.sectiondetails.name`'),
							'-',
							models.sequelize.col('`timetableallocations.subject.subjectdetails.name`'),
						),
						'teachersubject'
					],
					[
						models.sequelize.fn(
							'CONCAT',
							models.sequelize.col('`timetableallocations.id`'),
							'-',
							models.sequelize.col('`timetableallocations.timetable.bcsmap.id`'),
							'-',
							models.sequelize.col('`timetableallocations.period`'),
						),
						'classtimetable'
					],
				],
			}
		],
		attributes: ['id'],
		where: where.teacher,
		order: [
			[models.timetableallocation, 'period'],
			[models.timetableallocation, models.timetable, models.bcsmap, models.board, 'display_order'],
			[models.timetableallocation, models.timetable, models.bcsmap, models.classes, 'display_order'],
			[models.timetableallocation, models.timetable, models.bcsmap, models.section, 'display_order'],
		],
	});
};
/*exports.dashboardAttendance = req => {
	let where = {
		academicSessionId: req.academicSessionId,
		masterId: req.masterId,
		period: 1,
		date: req.date
	};
	if (req.user_type === 'teacher') where.userId = req.userTypeId;
	return models.attendance.findAll({
		include: [
			{
				model: models.attendancerecord,
				attributes: [],
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
									{},
									req.langId,
									'`bcsmap.board`.`id`',
									models.boarddetail,
									'boardId'
								),
								attributes: [],
							}
						],
					},
					{
						model: models.classes,
						include: [
							{
								model: models.classesdetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`bcsmap.class`.`id`',
									models.classesdetail,
									'classId'
								),
								attributes: [],
							}
						],
					},
					{
						model: models.section,
						include: [
							{
								model: models.sectiondetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`bcsmap.section`.`id`',
									models.sectiondetail,
									'sectionId'
								),
								attributes: [],
							}
						],
					}
				],
				attributes: [],
			},
		],
		where,
		attributes: [
			'id',
			[models.sequelize.literal('CONCAT(`bcsmap.board.boarddetails`.`alias`, " - " , `bcsmap.class.classesdetails`.`name`, " - " ,`bcsmap.section.sectiondetails`.`name`)'), 'name'],
			[models.sequelize.literal('`bcsmap.class`.`display_order`'), 'classorder'],
			[models.sequelize.literal('SUM(CASE WHEN `attendancerecords`.`is_present` = 1 THEN 1 ELSE 0 END)'), 'present'],
			[models.sequelize.literal('SUM(CASE WHEN `attendancerecords`.`is_present` = 3 THEN 1 ELSE 0 END)'), 'absent'],
			[models.sequelize.literal('SUM(CASE WHEN `attendancerecords`.`is_present` = 2 THEN 1 ELSE 0 END)'), 'late'],
		],
		group: [
			['bcsMapId'],
		],
	});
};*/

/*exports.dashboardClassReports = req => {
	let where = {
		masterId: req.masterId,
		academicSessionId: req.academicSessionId,
	};
	if (req.user_type === 'teacher') where.userId = req.userId;

	if (req.date) where.date = req.date;
    
	return Promise.all([
		models.classreport.count({
			where,
			logging: console.log,
		}),
		!req.bcsMapId ? 0 : models.classreport.count({
			where: {
				...where,
				bcsMapId: req.bcsMapId,
			},
			logging: console.log,
		}),
	]);
};*/

/*exports.dashboardAssignments = req => {
	let where = {
		masterId: req.masterId,
		academicSessionId: req.academicSessionId,
	};
	if (req.user_type === 'teacher') where.userId = req.userId;
	if (req.bcsMapId) where.bcsMapId = req.bcsMapId;
	if (req.subjectId) where.subjectId = req.subjectId;

	return models.assignment.findAll({
		attributes: [
			'assignment_status',
			[models.sequelize.literal('COUNT(`id`)'), 'count']
		],
		where,
		group: [
			['assignment_status'],
		],
	});
};*/

/*exports.dashboardAttendance = req => {
	let where = {
		academicSessionId: req.academicSessionId,
		masterId: req.masterId,
	};
	if (req.user_type === 'teacher') where.userId = req.userTypeId;
	if (req.subjectId) where.subjectId = req.subjectId;
	if (req.bcsMapId) {
		return models.student.findAll({
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
							attributes: [],
						},
					],
					where: {
						is_active: true,
					},
					attributes: [],
				},
				{
					model: models.studentrecord.scope(
						{ method: ['transferred', moment().format('YYYY-MM-DD')]},
						{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
					),
					where: {
						academicSessionId: req.academicSessionId,
						bcsMapId: req.bcsMapId,
						
					},
					attributes: [],
				},
				{
					model: models.attendancerecord,
					include: [
						{
							model: models.attendance,
							where,
							attributes: [],
						},
					],
					attributes: [],
				},
			],
			where: {
				masterId: req.masterId,
			},
			attributes: [
				'id',
				[models.sequelize.literal('`user.userdetails`.`fullname`'), 'name'],
				[models.sequelize.literal('(SUM(CASE WHEN `is_present` = 3 THEN 1 ELSE 0 END) * 100) / COUNT(`attendancerecords`.`attendanceId`)'), 'absent'],
				[models.sequelize.literal('(SUM(CASE WHEN `is_present` = 1 THEN 1 ELSE 0 END) * 100) / COUNT(`attendancerecords`.`attendanceId`)'), 'present'],
				[models.sequelize.literal('(SUM(CASE WHEN `is_present` = 2 THEN 1 ELSE 0 END) * 100) / COUNT(`attendancerecords`.`attendanceId`)'), 'late'],
			],
			group: [
				['id'],
			],
		});
	} else {
		return models.attendance.findAll({
			include: [
				{
					model: models.attendancerecord,
					attributes: [],
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
										{},
										req.langId,
										'`bcsmap.board`.`id`',
										models.boarddetail,
										'boardId'
									),
									attributes: [],
								}
							],
						},
						{
							model: models.classes,
							include: [
								{
									model: models.classesdetail,
									where: language.buildLanguageQuery(
										{},
										req.langId,
										'`bcsmap.class`.`id`',
										models.classesdetail,
										'classId'
									),
									attributes: [],
								}
							],
						},
						{
							model: models.section,
							include: [
								{
									model: models.sectiondetail,
									where: language.buildLanguageQuery(
										{},
										req.langId,
										'`bcsmap.section`.`id`',
										models.sectiondetail,
										'sectionId'
									),
									attributes: [],
								}
							],
						}
					],
					attributes: [],
				},
			],
			where,
			attributes: [
				'id',
				[models.sequelize.literal('CONCAT(`bcsmap.board.boarddetails`.`alias`, " - " , `bcsmap.class.classesdetails`.`name`, " - " ,`bcsmap.section.sectiondetails`.`name`)'), 'name'],
				[models.sequelize.literal('(SUM(CASE WHEN `attendancerecords`.`is_present` = 3 THEN 1 ELSE 0 END) * 100) / COUNT(`attendancerecords`.`attendanceId`)'), 'absent'],
				[models.sequelize.literal('(SUM(CASE WHEN `attendancerecords`.`is_present` = 1 THEN 1 ELSE 0 END) * 100) / COUNT(`attendancerecords`.`attendanceId`)'), 'present'],
				[models.sequelize.literal('(SUM(CASE WHEN `attendancerecords`.`is_present` = 2 THEN 1 ELSE 0 END) * 100) / COUNT(`attendancerecords`.`attendanceId`)'), 'late'],
			],
			group: [
				['bcsMapId'],
			],
		});
	}
};*/

exports.dashboardMarks = req => getMarksSelector(req).then(where => {
	if (req.bcsMapId) {
		return models.student.findAll({
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
							attributes: [],
						},
					],
					where: {
						is_active: true,
					},
					attributes: [],
				},
				{
					model: models.studentrecord.scope(
						{ method: ['transferred', moment().format('YYYY-MM-DD')]},
						{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
					),
					where: {
						academicSessionId: req.academicSessionId,
						bcsMapId: req.bcsMapId,
						/*record_status: 1,
						$or: [
							{transferred: 0},
							{transferred: 1, transerred_effective_from: {$gt: moment().format('YYYY-MM-DD')}},
							{transferred: 2, transerred_effective_from: {$lte: moment().format('YYYY-MM-DD')}},
						],*/
					},
					attributes: [],
				},
				{
					model: models.markrecord,
					include: [
						{
							model: models.mark,
							where,
							attributes: [],
						},
					],
					attributes: [],
				},
			],
			where: {
				masterId: req.masterId,
			},
			attributes: [
				'id',
				[models.sequelize.literal('`user.userdetails`.`fullname`'), 'name'],
				[models.sequelize.literal('(SUM(`markrecords`.`obtained_mark`) * 100) / SUM(`markrecords.mark`.`max_mark`)'), 'percentage'],
			],
			group: [
				['id'],
			],
		});
	} else {
		return models.mark.findAll({
			include: [
				{
					model: models.markrecord,
					attributes: [],
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
										{},
										req.langId,
										'`bcsmap.board`.`id`',
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
										'`bcsmap.class`.`id`',
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
										'`bcsmap.section`.`id`',
										models.sectiondetail,
										'sectionId'
									),
									attributes: [],
								}
							],
							attributes: [],
						}
					],
					attributes: [],
				},
			],
			where,
			attributes: [
				'id',
				[models.sequelize.literal('CONCAT(`bcsmap.board.boarddetails`.`alias`, " - " , `bcsmap.class.classesdetails`.`name`, " - " ,`bcsmap.section.sectiondetails`.`name`)'), 'name'],
				[models.sequelize.literal('(SUM(`markrecords`.`obtained_mark`) * 100) / SUM(`mark`.`max_mark`)'), 'percentage'],
			],
			group: [
				['bcsMapId'],
			],
		});
	}
});

const teacherMarksQuery = 'SELECT `marks`.`id` FROM `marks` '
	+ 'INNER JOIN `timetable_allocations` ON '
	+ '`timetable_allocations`.`teacherId` = :userTypeId AND '
	+ '`marks`.`subjectId` = `timetable_allocations`.`subjectId`'
	+ 'INNER JOIN `timetables` ON '
	+ '`timetable_allocations`.`timetableId` = `timetables`.`id` AND '
	+ '`marks`.`bcsMapId` = `timetables`.`bcsMapId` AND '
	+ '`timetables`.`academicSessionId` = :academicSessionId';

function getMarksSelector(req) {
	let where = {
		academicSessionId: req.academicSessionId,
		masterId: req.masterId,
	};
	if (req.subjectId) where.subjectId = req.subjectId;
	if (req.user_type !== 'teacher')
		return Promise.resolve(where);
	return models.sequelize.query(
		teacherMarksQuery,
		{
			type: models.sequelize.QueryTypes.SELECT,
			replacements: req,
		}
	)
		.then(marks => {
			where.id = {$in: marks.map(mark => mark.id)}
			return where;
		});
}


exports.teacherPerformance = req => utils.all({
	institute: models.institute.find({
		include: [
			{
				model: models.institutedetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`institute`.`id`',
					models.institutedetail,
					'instituteId'
				),
				attributes: ['name', 'address', 'tagline'],
			}
		],
		where: {
			userId: req.masterId,
		},
		attributes: [],
	}),
	timetableallocations:  models.timetableallocation.findAll({
		include: [
			{
				model: models.timetable,
				where: {
					is_active: 1,
					masterId: req.masterId,
					bcsMapId: req.bcsmapId,
					academicSessionId: req.academicSessionId,
				},
				attributes: [],
			},
			{
				model: models.teacher,
				include: [
					{
						model: models.user,
						include: [
							{
								model: models.userdetail,
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`teacher.user`.`id`',
									models.userdetail,
									'userId'
								),
								attributes: ['fullname'],
							},
						],
						attributes: ['id'],
					}
				],
				attributes: ['id'],
			},
			{
				model: models.subject,
				include: [
					{
						model:models.subjectdetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`subject`.`id`',
							models.subjectdetail,
							'subjectId'
						),
						attributes:['name'],
					},
				],
				where: {
					is_active: 1,
				},
				attributes: [
					'id',
					[
						models.sequelize.literal(`(SELECT SUM(max_mark) FROM marks WHERE marks.subjectId=subject.id
						AND marks.academicSessionId=${parseInt(req.academicSessionId)}
						AND marks.bcsMapId=${parseInt(req.bcsmapId)})`),
						'max_mark'
					]
				],
			},
		],
		attributes: [],
		group: [
			['teacherId'],
			['subjectId'],
		],
	}),
	bcsmap: models.bcsmap.find({
		include: [
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
							{},
							req.langId,
							'`section`.`id`',
							models.sectiondetail,
							'sectionId'
						),
						attributes: ['name'],
					}
				],
				attributes: ['id'],
			},
			{
				model: models.grade,
				attribute: ['data'],
			},
		],
		where: {
			id: req.bcsmapId,
		},
		attributes: [],
	}),
	students: models.student.findAll({
		include: [
			{
				model: models.user,
				where: {
					is_active: 1,
				},
				attributes: [],
			},
			{
				model: models.studentrecord.scope({
					method: ['transferred', moment().format('YYYY-MM-DD')],
				}),
				where: {
					bcsMapId: req.bcsmapId,
					academicSessionId: req.academicSessionId,
				},
				attributes: [],
			},
			{
				model: models.markrecord,
				include: [
					{
						model: models.mark,
						include: [
							{
								model: models.examschedule,
								include: [
									{
										model: models.examhead,
										where: {
											is_active: 1,
										},
										attributes: [],
									}
								],
								where: {
									is_active: 1
								},
								attributes: [],
							},
							{
								model: models.subject,
								where: {
									is_active: 1,
								},
								attributes: [],
							}
						],
						where: {
							academicSessionId: req.academicSessionId,
						},
						attributes: [
							'subjectId',
							[
								models.sequelize.fn('SUM', models.sequelize.col('max_mark')),
								'max_mark',
							],
							[
								models.sequelize.fn('SUM', models.sequelize.col('min_passing_mark')),
								'min_passing_mark',
							],
						],
					}
				],
				attributes: [
					[
						models.sequelize.fn('SUM', models.sequelize.col('obtained_mark')),
						'obtained_mark',
					],
				],
			},
		],
		where: {
			masterId: req.masterId,
		},
		group: [
			[models.markrecord, 'studentId'],
			[models.markrecord, models.mark, 'subjectId'],
		],
		attributes: ['id'],
	}),
});

exports.totalfees = async req => {
	let [[paid], [total]] = await Promise.all([
		models.feesubmissionrecord.findAll({
			include: [
				{
					model: models.feesubmission,
					where: {
						approved: 1,
						date: {$lte: req.date},
						academicSessionId: req.academicSessionId,
					},
					attributes: [],
				}
			],
			attributes: [
				[models.sequelize.fn('SUM', models.sequelize.col('amount')), 'sum'],
			],
		}),
		models.fee.findAll({
			include: [
				{
					model: models.feeallocation,
					where: {
						date: {$lte: req.date},
					},
					attributes: [
					],
				},
			],
			where: {
				academicSessionId: req.academicSessionId,
			},
			attributes: [
				[
					models.sequelize.literal(
						' SUM(`feeallocations`.`amount`) * (SELECT COUNT(DISTINCT `studentId`) FROM `student_records` INNER JOIN `bcs_maps`'
						+ ' ON `student_records`.`bcsMapId` = `bcs_maps`.`id` '
						+ ' AND `student_records`.`academicSessionId` = ' + parseInt(req.academicSessionId)
						+ ' WHERE  `fee`.`boardId` = `bcs_maps`.`boardId` '
						+ ' AND  `fee`.`classId` = `bcs_maps`.`classId` )'
					),
					'sum',
				]
			],
		}),
	]);

	paid = paid.getDataValue('sum') || 0;
	total = total.getDataValue('sum') || 0;

	return {paid, total};
};