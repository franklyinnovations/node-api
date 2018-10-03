'use strict';

const models = require('../models'),
	language = require('./language');

models.activitymark.belongsTo(models.activityschedule);
models.activitymark.belongsTo(models.bcsmap, {foreignKey: 'bcsMapId'});

models.activitymarkrecord.belongsTo(models.activitymark);
models.activitymark.hasMany(models.activitymarkrecord);

models.student.hasMany(models.activitymarkrecord);
models.student.hasMany(models.activityschedule);

models.activityschedule.belongsTo(models.examschedule);

models.examschedule.belongsTo(models.examhead);
models.examschedule.belongsTo(models.classes);
models.examschedule.belongsTo(models.board);

models.examhead.hasMany(models.examheaddetail);

models.bcsmap.belongsTo(models.board);
models.bcsmap.belongsTo(models.classes);
models.bcsmap.belongsTo(models.section);
models.bcsmap.hasMany(models.examschedule);

models.board.hasMany(models.boarddetail);

models.classes.hasMany(models.classesdetail);

models.section.hasMany(models.sectiondetail);
models.section.hasMany(models.bcsmap);

models.activity.hasMany(models.activitydetail);
models.activity.hasMany(models.activityschedule);
models.activity.hasMany(models.activity, {as: 'sub_activity', foreignKey: 'superActivityId'});

models.activityschedule.hasOne(models.activitymark);

models.activitymark.hasMany(models.activitymarkrecord);

models.activityschedule.belongsTo(models.activity);

models.student.hasOne(models.studentrecord);
models.student.belongsTo(models.user);
models.user.hasMany(models.userdetail);

exports.list = function (req) {
	let pageSize = req.app.locals.site.page, // number of items per page
		page = req.query.page || 1;

	let reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
		where = {
			bcsmap: {
				is_active: 1,
			},
		};
	if (reqData.user_type === 'teacher') {
		where.bcsmap.teacher = models.sequelize.literal(
			'(SELECT COUNT(*) FROM `timetables` INNER JOIN `timetable_allocations` \
			ON `timetables`.`id` = `timetable_allocations`.`timetableId` AND `teacherId` = '
			+ JSON.stringify(parseInt(reqData.userTypeId))
			+ ' AND `timetables`.`is_active` = 1 AND `timetables`.`academicSessionId` = '
			+ JSON.stringify(parseInt(reqData.academicSessionId))
			+ ' AND `timetables`.`masterId` = '
			+ JSON.stringify(parseInt(reqData.masterId))
			+ ' WHERE `timetables`.`bcsMapId` = `bcsmap`.`id`)'
		);
	}

	if (req.query) {
		Object.keys(req.query).forEach(key => {
			if (req.query[key] === '') return;
			let modalKey = key.split('__');
			if (modalKey.length === 3) {
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = req.query[key];
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = req.query[key];
				}
			} else {
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				}
			}
		});
	}

	return models.activitymark.findAndCountAll({
		include: [
			{
				model: models.activityschedule,
				include: [
					{
						model: models.activity,
						where: {
							superActivityId: null
						},
						attributes: []
					},
					{
						model: models.examschedule,
						include: [
							{
								model: models.examhead,
								include: [
									{
										model: models.examheaddetail,
										where: language.buildLanguageQuery(
											where.examheaddetail,
											reqData.langId,
											'`activityschedule.examschedule.examhead`.`id`',
											models.examheaddetail,
											'examheadId'
										),
										attributes: ['name']
									}
								],
								where: {
									is_active: 1,
								},
								attributes: ['id']
							}
						],
						where: {
							academicSessionId: reqData.academicSessionId,
							masterId: reqData.masterId
						},
						attributes: ['id'],
					},
				],
				attributes: ['id', 'examscheduleId']
			},
			{
				model: models.bcsmap,
				include: [
					{
						model: models.classes,
						include: [
							{
								model: models.classesdetail,
								where: language.buildLanguageQuery(
									{},
									reqData.langId,
									'`bcsmap.class`.`id`',
									models.classesdetail,
									'classId'
								),
								attributes: ['name']
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
									{},
									reqData.langId,
									'`bcsmap.board`.`id`',
									models.boarddetail,
									'boardId'
								),
								attributes: ['alias']
							}
						],
						attributes: ['id']
					},
					{
						model: models.section,
						include: [
							{
								model: models.sectiondetail,
								where: language.buildLanguageQuery(
									{},
									reqData.langId,
									'`bcsmap.section`.`id`',
									models.sectiondetail,
									'sectionId'
								),
								attributes: ['name']
							}
						],
						attributes: ['id']
					}
				],
				where: where.bcsmap,
				attributes: ['id']
			}
		],
		attributes: ['id', 'bcsMapId'],
		where: where.activitymark,
		order: [
			['id', 'DESC']
		],
		group: [
			[models.activityschedule, 'examscheduleId'],
			['bcsMapId']
		],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		subQuery: false,
	})
		.then(result => ({
			status: true,
			data: result.rows,
			totalData: result.count.length,
			pageCount: Math.ceil(result.count.length / pageSize),
			pageLimit: pageSize,
			currentPage: page
		}));
};

exports.getMetaInformation = function (req) {
	let where = {
		masterId: req.masterId,
		academicSessionId: req.academicSessionId,
		has_activity: 1,
		is_active: 1
	};
	if (req.user_type === 'teacher') {
		where.teacher = models.sequelize.literal(
			'(SELECT COUNT(*) FROM `timetables` INNER JOIN `timetable_allocations` \
			ON `timetables`.`id` = `timetable_allocations`.`timetableId` AND `teacherId` = '
			+ JSON.stringify(parseInt(req.userTypeId))
			+ ' AND `timetables`.`is_active` = 1 AND `timetables`.`academicSessionId` = '
			+ JSON.stringify(parseInt(req.academicSessionId))
			+ ' AND `timetables`.`masterId` = '
			+ JSON.stringify(parseInt(req.masterId))
			+ ' INNER JOIN `bcs_maps` ON `timetables`.`bcsMapId` = `bcs_maps`.`id`'
			+ ' WHERE `examschedule`.`classId` =  `bcs_maps`.`classId`'
			+ ' AND `examschedule`.`boardId` =  `bcs_maps`.`boardId`)'
		);
	}
	return models.examschedule.findAll({
		include: [
			{
				model: models.examhead,
				include: [
					{
						model: models.examheaddetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`examhead`.`id`',
							models.examheaddetail,
							'examheadId'
						),
						attributes: ['name']
					}
				],
				attributes: ['id'],
				where: {
					is_active: 1
				}
			},
			{
				model: models.classes,
				include: [
					{
						model: models.classesdetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`examschedule`.`classId`',
							models.classesdetail,
							'classId'
						),
						attributes: ['name']
					}
				],
				attributes: ['id'],
				where: {
					is_active: 1
				}
			},
			{
				model: models.board,
				include: [
					{
						model: models.boarddetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`examschedule`.`boardId`',
							models.boarddetail,
							'boardId'
						),
						attributes: ['alias']
					}
				],
				attributes: ['id'],
				where: {
					is_active: 1
				}
			}
		],
		where,
		order: [['id', 'DESC']],
		attributes: ['id']
	});
};

exports.getSectionsAndActivities = function (req) {
	const where = {id: req.examscheduleId};
	if (req.user_type === 'teacher') {
		where.timetable = models.sequelize.literal(
			'(SELECT COUNT(*) FROM `timetables` INNER JOIN `timetable_allocations` \
			ON `timetables`.`id` = `timetable_allocations`.`timetableId` AND `teacherId` = '
			+ JSON.stringify(parseInt(req.userTypeId))
			+ ' AND `timetables`.`is_active` = 1 AND `timetables`.`academicSessionId` = '
			+ JSON.stringify(parseInt(req.academicSessionId))
			+ ' AND `timetables`.`masterId` = '
			+ JSON.stringify(parseInt(req.masterId))
			+ ' WHERE `timetables`.`bcsMapId` = `bcsmaps`.`id`)'
		);
	}
	return Promise.all([
		models.section.findAll({
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
					attributes: ['name']
				},
				{
					model: models.bcsmap,
					include: [
						{
							model: models.examschedule,
							on: ['`bcsmaps.examschedules`.`classId` = `bcsmaps`.`classId`\
							AND `bcsmaps.examschedules`.`boardId` = `bcsmaps`.`boardId`', []],
							where,
							attributes: []
						}
					],
					where: {
						is_active: 1,
						boardId: req.boardId,
						classId: req.classId
					},
					attributes: ['id']
				}
			],
			distinct: true,
			where: {
				is_active: 1
			},
			attributes: ['id'],
		}),
		models.activity.findAll({
			include:
			[
				{
					model: models.activitydetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`activity`.`id`',
						models.activitydetail,
						'activityId'
					),
					attributes: ['name']
				},
				{
					model: models.activityschedule,
					include:
					[
						{
							model: models.examschedule,
							where: {
								classId: req.classId,
								boardId: req.boardId
							},
							attributes: []
						}
					],
					where: {
						examscheduleId: req.examscheduleId
					},
					attributes: []
				}
			],
			where: {
				masterId: req.masterId,
				superActivityId: null
			}
		})
	])
		.then(([sections, activities]) => ({
			status: true,
			sections,
			activities,
		}));
};

exports.markActivities = function (req) {
	return models.activitymark.findAll({
		include: [
			{
				model: models.activityschedule,
				include:
				[
					{
						model: models.examschedule,
						where: {
							id: req.examscheduleId
						},
						attributes: [],
					},
					{
						model: models.activity,
						include:
						[
							{
								model: models.activitydetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`activityschedule.activity`.`id`',
									models.activitydetail,
									'activityId'
								),
								attributes: ['name']
							}
						],
						where: {
							superActivityId: null
						},
						attributes: ['id'],
					},
				],
				attributes: ['id']
			},
		],
		where: {
			bcsMapId: req.bcsMapId,
		},
		group:
		[
			[models.activityschedule, 'activityId']
		],
		attributes: ['id'],
		order:
		[
			[models.activityschedule, 'activityId']
		]
	})
		.then(data => ({status: true, data}));
};

exports.students = function (req) {
	return Promise.all([
		models.student.scope({
			method:[
				'doa1', '`activityschedules`.`date`'
			]
		}).findAll({
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
								'`user`.`id`',
								models.userdetail,
								'userId'
							),
							attributes: ['fullname']
						}
					],
					attributes: ['user_image']
				},
				{
					model: models.studentdetail,
					attributes: ['id','father_name'],
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`student`.`id`',
						models.studentdetail,
						'studentId'
					)
				},
				{
					model: models.activityschedule,
					on: ['1', []],
					include:
					[
						{
							model: models.activity,
							where: {
								$or:
								[
									{
										superActivityId: req.activityId
									},
									{
										id: req.activityId
									}
								]
							},
							attributes: []
						},
						{
							model: models.activitymark,
							include:
							[
								{
									model: models.activitymarkrecord,
									where: {
										studentId: {
											$eq: models.sequelize.literal('`student`.`id`')
										}
									},
									required: false
								}
							],
							where: {
								bcsMapId: req.bcsMapId
							},
							required: false,
							attributes: ['id', 'activityscheduleId']
						},
					],
					where: {
						examscheduleId: req.examscheduleId
					},
					attributes: {
						exclude: ['studentId', 'date', 'examscheduleId']
					}
				},
				{
					model: models.studentrecord.scope(
						{ method: ['transferred', models.sequelize.literal('`activityschedules`.`date`')]},
						{ method: ['tc', '`activityschedules`.`date`', req.academicSessionId]}
					),
					where: {
						academicSessionId: req.academicSessionId,
						bcsMapId: req.bcsMapId,
						/*record_status: 1,
						$or: [
							{transferred: 0},
							{
								transferred: 1,
								transerred_effective_from: {
									$lt: models.sequelize.literal('`activityschedules`.`date`')
								}
							},
							{
								transferred: 2,
								transerred_effective_from: {
									$lt: models.sequelize.literal('`activityschedules`.`date`')
								}
							}
						]*/
					},
					attributes: ['roll_no']
				},
			],
			attributes: ['id', 'enrollment_no', 'father_contact'],
			order: [
				[models.studentrecord, 'roll_no'],
				['id', 'DESC']
			]
		}),
		models.activity.findAll({
			include: [
				{
					model: models.activitydetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`activity`.`id`',
						models.activitydetail,
						'activityId'
					),
					attributes: ['name']
				}
			],
			attributes: ['id', 'superActivityId'],
			where: {
				$or: [
					{
						superActivityId: req.activityId
					},
					{
						id: req.activityId
					}
				]
			}
		})
	])
		.then(([students, activities]) => ({
			status: true,
			students,
			activities,
			bcsMapId: req.bcsMapId
		}));
};

exports.students2 = function (req) {
	return Promise.all([
		models.student.scope({
			method:[
				'doa1', '`activityschedules`.`date`'
			]
		}).findAll({
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
								'`user`.`id`',
								models.userdetail,
								'userId'
							),
							attributes: ['fullname']
						}
					],
					where: {
						is_active: 1,
					},
					attributes: ['user_image']
				},
				{
					model: models.activityschedule,
					on: ['1', []],
					include:
					[
						{
							model: models.activity,
							where: {
								$or:
								[
									{
										superActivityId: {
											$in: req.activities
										}
									},
									{
										id: {
											$in: req.activities
										}
									},
								]
							},
							attributes: []
						},
						{
							model: models.activitymark,
							include:
							[
								{
									model: models.activitymarkrecord,
									where: {
										studentId: {
											$eq: models.sequelize.literal('`student`.`id`')
										}
									},
									required: false
								}
							],
							where: {
								bcsMapId: req.bcsMapId
							},
							required: false,
							attributes: ['id', 'activityscheduleId']
						},
					],
					where: {
						examscheduleId: req.examscheduleId
					},
					attributes: {
						exclude: ['studentId', 'date', 'examscheduleId']
					}
				},
				{
					model: models.studentrecord.scope(
						{ method: ['transferred', models.sequelize.literal('`activityschedules`.`date`')]},
						{ method: ['tc', '`activityschedules`.`date`', req.academicSessionId]}
					),
					where: {
						academicSessionId: req.academicSessionId,
						bcsMapId: req.bcsMapId,
					},
					attributes: ['roll_no']
				},
			],
			attributes: ['id', 'enrollment_no', 'father_contact'],
			order: [
				[models.activityschedule, models.activitymark, models.activitymarkrecord, 'id'],
				[models.studentrecord, 'roll_no'],
				['id', 'DESC'],
			]
		}),
		models.activity.findAll({
			include:[
				{
					model: models.activitydetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`activity`.`id`',
						models.activitydetail,
						'activityId'
					),
					attributes: ['name']
				},
				{
					model: models.activityschedule,
					where: {
						examscheduleId: req.examscheduleId,
					},
					attributes: [],
				}
			],
			attributes: [
				'id',
				'superActivityId',
			],
			where: {
				$or:
				[
					{
						superActivityId: {
							$in: req.activities
						}
					},
					{
						id: {
							$in: req.activities
						}
					},
				]
			},
			order:
			[
				['id']
			]
		})
	])
		.then(([students, activities]) => ({
			status: true,
			students,
			activities,
		}));
};

exports.save = function (req) {
	let marks = Object.create(null);
	for (let i = req.marks.length - 1; i >= 0; i--) {
		marks[req.marks[i].activityscheduleId] = req.marks[i].id;
	}
	return Promise.all(
		req.marks.filter(mark => !mark.id).map(mark => models.activitymark.create(mark)))
		.then(newMarks => {
			for (let i = newMarks.length - 1; i >= 0; i--) {
				marks[newMarks[i].activityscheduleId] = newMarks[i].id;
			}
			return newMarks;
		})
		.then(newMarks => {
			if (newMarks.length !== 0) {
				for (let i = req.markrecords.length - 1; i >= 0; i--) {
					if (req.markrecords[i].activityscheduleId)
						req.markrecords[i].activitymarkId = marks[req.markrecords[i].activityscheduleId];
				}
			}
			return models.activitymarkrecord.bulkCreate(req.markrecords, {
				ignoreDuplicates: true,
				updateOnDuplicate: ['obtained_mark']
			});
		})
		.then(() => ({
			status: true,
			message: language.lang({key:'Saved Successfully', lang: req.lang})
		}));
};

exports.save2 = function (req) {
	return Promise.all(
		req.activitymarks.map(mark => {
			if (mark.id) {
				return models.activitymarkrecord.bulkCreate(
					mark.activitymarkrecords,
					{
						updateOnDuplicate: [
							'obtained_mark',
						],
						ignoreDuplicates: true,
					}
				);
			} else {
				return models.activitymark.create(
					mark,
					{
						include: [models.activitymarkrecord],
					}
				);
			}
		})
	)
		.then(data => ({
			status: true,
			data,
			message:language.lang({key:'Saved Successfully', lang:req.lang})
		}));
};

exports.view = function (req) {
	return Promise.all([
		models.student.scope({
			method:[
				'doa1', '`activitymarkrecords.activitymark.activityschedule`.`date`'
			]
		}).findAll({
			include:
			[
				{
					model: models.user,
					include:
					[
						{
							model: models.userdetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`user`.`id`',
								models.userdetail,
								'userId'
							),
							attributes: ['fullname']
						}
					],
					attributes: ['user_image']
				},
				{
					model: models.studentdetail,
					attributes: ['id','father_name'],
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`student`.`id`',
						models.studentdetail,
						'studentId'
					)
				},
				{
					model: models.activitymarkrecord,
					include:
					[
						{
							model: models.activitymark,
							include:
							[
								{
									model: models.activityschedule,
									where: {
										examscheduleId: req.examscheduleId
									},
									attributes: []
								}
							],
							attributes: []
						}
					],
					attributes: []
				},
				{
					model: models.studentrecord.scope({
						method: [
							'transferred',
							models.sequelize.literal(
								'`activitymarkrecords.activitymark.activityschedule`.`date`'
							)
						]
					},
					{
						method: ['tc', '`activitymarkrecords.activitymark.activityschedule`.`date`', req.academicSessionId]
					}),
					where: {
						academicSessionId: req.academicSessionId,
					},
					attributes: ['roll_no']
				}
			],
			order: [
				[models.studentrecord, 'roll_no'],
				['id', 'DESC']
			],
			attributes: ['id', 'enrollment_no', 'father_contact']
		}),
		models.examschedule.findById(req.examscheduleId, {
			include: [
				{
					model: models.examhead,
					include: [
						{
							model: models.examheaddetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`examhead`.`id`',
								models.examheaddetail,
								'examheadId'
							),
							attributes: ['name']
						}
					],
					attributes: ['id']
				}
			],
			attributes: ['id']
		}),
		models.bcsmap.findById(req.bcsMapId, {
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
							attributes: ['name']
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
								{},
								req.langId,
								'`board`.`id`',
								models.boarddetail,
								'boardId'
							),
							attributes: ['alias']
						}
					],
					attributes: ['id']
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
							attributes: ['name']
						}
					],
					attributes: ['id']
				}
			],
			attributes: ['id']
		})
	])
		.then(([students, examschedule, bcsmap]) => ({
			status: true,
			students,
			examschedule,
			bcsmap
		}));
};

exports.viewStudentMark = function (req) {
	return models.activitymarkrecord.findAll({
		include: [
			{
				model: models.activitymark,
				include: [
					{
						model: models.activityschedule,
						include:
						[
							{
								model: models.activity,
								include:
								[
									{
										model: models.activitydetail,
										where: language.buildLanguageQuery(
											{},
											req.langId,
											'`activitymark.activityschedule.activity`.`id`',
											models.activitydetail,
											'activityId'
										),
										attributes: ['name']
									}
								],
								attributes: ['id', 'superActivityId']
							}
						],
						where: {
							examscheduleId: req.examscheduleId
						},
						attributes: ['id', 'max_marks']
					}
				],
				attributes: ['id']
			}
		],
		where: {
			studentId: req.studentId
		},
		attributes: ['obtained_mark']
	})
		.then(activitymarkrecords => ({
			status: true,
			activitymarkrecords: activitymarkrecords
		}));
};

exports.viewActivities = function (req) {
	return models.activity.findAll({
		include: [
			{
				model: models.activitydetail,
				where: language.buildLanguageQuery(
					{},
					req.langId,
					'`activity`.`id`',
					models.activitydetail,
					'activityId'
				),
				attributes: ['name']
			},
			{
				model: models.activityschedule,
				include:
				[
					{
						model: models.activitymark,
						where: {
							bcsMapId: req.bcsMapId
						},
						attributes: []
					}
				],
				where: {
					examscheduleId: req.examscheduleId
				},
				attributes: []
			}
		],
		attributes: ['id'],
		where: {
			superActivityId: null
		}
	})
		.then(activities => ({
			status: true,
			activities
		}));
};

exports.getForEdit = function (req) {
	return Promise.all([
		exports.students(req),
		models.examschedule.findById(req.examscheduleId, {
			include:
			[
				{
					model: models.examhead,
					include: [
						{
							model: models.examheaddetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`examhead`.`id`',
								models.examheaddetail,
								'examheadId'
							),
							attributes: ['name']
						}
					],
					attributes: ['id']
				}
			],
			attributes: ['id']
		}),
		models.bcsmap.findById(req.bcsMapId, {
			include: [
				{
					model: models.classes,
					include:
					[
						{
							model: models.classesdetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`class`.`id`',
								models.classesdetail,
								'classId'
							),
							attributes: ['name']
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
								{},
								req.langId,
								'`board`.`id`',
								models.boarddetail,
								'boardId'
							),
							attributes: ['alias']
						}
					],
					attributes: ['id']
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
							attributes: ['name']
						}
					],
					attributes: ['id']
				}
			],
			attributes: ['id']
		})
	])
		.then(([{students, activities}, examschedule, bcsmap]) => ({
			status: true,
			students,
			activities,
			examschedule,
			bcsmap
		}));
};