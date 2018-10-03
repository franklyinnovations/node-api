'use strict';

const
	moment = require('moment'),
	language = require('../language'),
	models = require('../../models');

models.subject.hasMany(models.subjectcategory);
models.subjectcategory.hasMany(models.subjectcategorydetail, {foreignKey:'subjectCategoryId'});
models.mark.belongsTo(models.examscheduledetail, {constraints: false});
models.examscheduledetail.hasMany(models.examschedulesubjectcategory);
models.institute.belongsTo(models.user);
models.bcsmap.hasMany(models.timetable);
models.timetable.belongsTo(models.teacher, {foreignKey:'classteacherId'});

const template = 'lithium';

const bcsname = models.sequelize.literal(
	'CONCAT(`board.boarddetails`.`alias`,'
	+ ' " - " , `class.classesdetails`.`name`,'
	+ ' " - " ,`section.sectiondetails`.`name`)'
);

exports.settings = ({lang, langId, masterId}, {id, settings}) => Promise.all([
		models.examhead.findAll({
			include: [
				{
					model: models.examheaddetail,
					where: language.buildLanguageQuery(
						null,
						langId,
						'`examhead`.`id`',
						models.examheaddetail,
						'examheadId'
					),
					attributes: ['name']
				},
			],
			where: {
				masterId,
				is_active: 1,
			},
			attributes: ['id'],
		}),
		models.subject.findAll({
			include: [
				{
					model: models.subjectdetail,
					where: language.buildLanguageQuery(
						null,
						langId,
						'`subject`.`id`',
						models.subjectdetail,
						'subjectId'
					),
					attributes: ['name']
				},
				{
					model: models.subjectcategory,
					include: [
						{
							model: models.subjectcategorydetail,
							where: language.buildLanguageQuery(
								null, 
								langId,
								'`subject.subjectcategories`.`id`', 
								models.subjectcategorydetail, 
								'subjectCategoryId'
							),
							required: false,
							attributes: ['name'],
						}
					],
					required: false,
					where: {
						is_active: true,
					},
					attributes: ['id'],
				},
			],
			where: {
				masterId,
				is_active: 1,
			},
			attributes: ['id'],
		}),
		models.activity.findAll({
			include: [
				{
					model: models.activitydetail,
					where: language.buildLanguageQuery(
						{},
						langId,
						'`activity`.`id`',
						models.activitydetail,
						'activityId'
					),
					attributes: ['name']
				}
			],
			where: {
				masterId,
				superActivityId: null,
			},
			attributes: ['id']
		}),
	])
	.then(([examheads, subjects, activities]) => ({
		status: true,
		id,
		template,
		settings,
		options: {
			examheads,
			subjects,
			activities,
		},
	}))

exports.data = req => {
	let {
		lang,
		langId,
		masterId,
		settings,
		students,
		bcsmapId,
		academicSessionId,
		marksheetbuilderId,
	} = req;

	settings = JSON.parse(settings);

	const subjectsMarks = models.mark.findAll({
		include: !settings.subjectcategories ?
			[
				{
					model: models.examschedule,
					where: {
						examheadId: {$in: settings.subjectExams},
					},
					attributes: ['examheadId'],
				},
			] :
			[
				{
					model: models.examschedule,
					where: {
						examheadId: {$in: settings.subjectExams},
					},
					attributes: ['examheadId'],
				},
				{
					model: models.examscheduledetail,
					on: {
						subjectId: {$col: 'mark.subjectId'},
						exam_type: {$col: 'mark.exam_type'},
						examScheduleId: {$col: 'mark.examScheduleId'},
					},
					include: [
						{
							model: models.examschedulesubjectcategory,
							attributes: [
								'max_marks',
								'subjectCategoryId',
							],
						}
					],
					attributes: ['id'],
				}
			],
		attributes: ['id', 'subjectId', 'max_mark'],
		where: {
			masterId,
			academicSessionId,
			bcsMapId: bcsmapId,
			exam_type: 'theory',
			subjectId: {$in: settings.subjects},
		},
		order: [
			[
				models.sequelize.fn(
					'FIELD',
					models.sequelize.col('`mark`.`subjectId`'),
					...(settings.subjects)
				),
			],
			[
				models.sequelize.fn(
					'FIELD',
					models.sequelize.col('`examschedule.examheadId`'),
					...settings.subjectExams
				),
			],
		],
	})
	.then(marks => Promise.all([
		models.subject.findAll({
			include: settings.subjectcategories ?
				[
					{
						model: models.subjectdetail,
						where: language.buildLanguageQuery(
							null, 
							langId,
							'`subject`.`id`', 
							models.subjectdetail, 
							'subjectId'
						),
						attributes: ['alias', 'name'],
					},
					{
						model: models.subjectcategory,
						include: [
							{
								model: models.subjectcategorydetail,
								where: language.buildLanguageQuery(
									null, 
									langId,
									'`subject.subjectcategories`.`id`', 
									models.subjectcategorydetail, 
									'subjectCategoryId'
								),
								required: false,
								attributes: ['name'],
							}
						],
						required: false,
						where: {
							is_active: true,
						},
						attributes: ['id'],
					},
				] :
				[
					{
						model: models.subjectdetail,
						where: language.buildLanguageQuery(
							null, 
							langId,
							'`subject`.`id`', 
							models.subjectdetail, 
							'subjectId'
						),
						attributes: ['alias', 'name'],
					},
				],
			where: {
				id: {$in: settings.subjects},
				masterId,
			},
			attributes: ['id'],
			order: settings.subjectcategories ? [
				[
					models.sequelize.fn(
						'FIELD',
						models.sequelize.col('`subject`.`id`'),
						...settings.subjects
					),
				],
				[
					models.subjectcategory,
					'id',
					'DESC'	
				],
			] : [
				models.sequelize.fn(
					'FIELD',
					models.sequelize.col('`subject`.`id`'),
					...settings.subjects
				),
			],
		}),
		marks,
		marks.length === 0 ? [] :
		models.markrecord.findAll({
			where: {
				studentId: {$in: students},
				markId: {$in: marks.map(mark => mark.id)},
			},
			attributes: settings.subjectcategories ?
				[
					'markId',
					'obtained_mark',
					'studentId',
					'subjectcategory_marks'
				] : 
				[
					'markId',
					'obtained_mark',
					'studentId',
				],
			order: [
				[
					models.sequelize.fn(
						'FIELD',
						models.sequelize.col('`markrecord.studentId`'),
						...students
					)
				],
				[
					models.sequelize.fn(
						'FIELD',
						models.sequelize.col('`markrecord.markId`'),
						...marks.map(mark => mark.id)
					)
				],
			],
		}),
	]));

	const activityMarks = models.activity.findAll({
		include: settings.subActivities ? [
			{
				model: models.activity,
				as: 'subActivities',
				include: [
					{
						model: models.activitydetail,
						where: language.buildLanguageQuery(
							{},
							langId,
							'`activity`.`id`',
							models.activitydetail,
							'activityId'
						),
						attributes: ['name'],
						required: false,
					}
				],
				required: false,
				attributes: ['id'],
			},
			{
				model: models.activitydetail,
				where: language.buildLanguageQuery(
					{},
					langId,
					'`activity`.`id`',
					models.activitydetail,
					'activityId'
				),
				attributes: ['name'],
				required: false,
			},
		] : [
			{
				model: models.activitydetail,
				where: language.buildLanguageQuery(
					{},
					langId,
					'`activity`.`id`',
					models.activitydetail,
					'activityId'
				),
				attributes: ['name'],
				required: false,
			},
		],
		where: {
			masterId,
			id: {$in: settings.activities},
		},
		attributes: ['id'],
		order: settings.subActivities ?
			[
				[
					models.sequelize.fn('FIELD', models.sequelize.col('`activity`.`id`'),
					...(settings.activities))
				],
				[models.sequelize.literal('`subActivities`.`id`')],
			] :
			[
				[
					models.sequelize.fn('FIELD', models.sequelize.col('`activity`.`id`'),
					...(settings.activities))
				],
			],
	})
	.then(activities => {
		let activityIds = [];
		for (let i = 0; i < activities.length; i++) {
			activityIds.push(activities[i].id);
			if (settings.subActivities) {
				for (let j = 0; j < activities[i].subActivities.length; j++) {
					activityIds.push(activities[i].subActivities[j].id);
				}
			}
		}
		if (activityIds.length === 0) return [activities, []];
		return Promise.all([
			activities,
			models.activitymark.findAll({
				include: [
					{
						model: models.activityschedule,
						include: [
							{
								model: models.examschedule,
								where: {
									masterId,
									academicSessionId,
									examheadId: {$in: settings.activityExams},
								},
								attributes: ['examheadId'],
							},
						],
						where: {
							activityId: {$in: activityIds},
						},
						attributes: ['activityId', 'max_marks'],
					},
				],
				where: {
					bcsMapId: bcsmapId,
				},
				attributes: ['id'],
				order: [
					[
						models.sequelize.fn(
							'FIELD',
							models.sequelize.col('`activityschedule.activityId`'),
							...activityIds
						),
					],
					[
						models.sequelize.fn(
							'FIELD',
							models.sequelize.col('`activityschedule.examschedule.examheadId`'),
							...settings.activityExams
						),
					],
				],
			}),
		]);
	})
	.then(([activities, activitymarks]) => {
		if (activitymarks.length === 0) return [activities, activitymarks, []];
		let activitymarkIds = activitymarks.map(activitymark => activitymark.id);
		return Promise.all([
			activities,
			activitymarks,
			models.activitymarkrecord.findAll({
				where: {
					studentId: {$in: req.students},
					activitymarkId: {$in: activitymarkIds},
				},
				order: [
					[
						models.sequelize.fn(
							'FIELD',
							models.sequelize.col('`activitymarkrecord.studentId`'),
							...students
						),
					],
					[
						models.sequelize.fn(
							'FIELD',
							models.sequelize.col('`activitymarkrecord.activitymarkId`'),
							...activitymarkIds
						),
					]
				],
				attributes: [
					'studentId',
					'obtained_mark',
					'activitymarkId',
				],
			}),
		])
	});


	return Promise.all([
		models.institute.find({
			include: [
				{
					model: models.institutedetail,
					where: language.buildLanguageQuery(
						{},
						langId,
						'`institute`.`id`',
						models.institutedetail,
						'instituteId'
					),
					attributes: ['name', 'address'],
				},
				{
					model: models.user,
					attributes: ['signature'],
				},
			],
			where: {
				userId: masterId,
			},
			attributes: ['userId'],
		}),
		models.bcsmap.find({
			include: [
				{
					model: models.classes,
					include: [
						{
							model: models.classesdetail,
							where: language.buildLanguageQuery(
								{},
								langId,
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
								langId,
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
				{
					model: models.timetable,
					include: [
						{
							model: models.teacher,
							include: [
								{
									model: models.user,
									attributes: ['signature'],
								}
							],
							attributes: ['id'],
						}
					],
					attributes: ['id'],
				},
			],
			where: {
				masterId,
				id: bcsmapId,
			},
			attributes: [
				'id'
			],
		}),
		models.examhead.findAll({
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
					attributes: ['name', 'alias'],
				}
			],
			attributes: ['id'],
			order: [
				[
					models.sequelize.fn(
						'FIELD',
						models.sequelize.col('`examhead`.`id`'),
						...settings.subjectExams
					)
				],
			],
			where: {
				id: {$in: settings.subjectExams},
			}
		}),
		models.examhead.findAll({
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
					attributes: ['name', 'alias'],
				}
			],
			attributes: ['id'],
			order: [
				[
					models.sequelize.fn(
						'FIELD',
						models.sequelize.col('`examhead`.`id`'),
						...settings.activityExams
					)
				],
			],
			where: {
				id: {$in: settings.activityExams},
			}
		}),
		models.student.findAll({
			include: [
				{
					model: models.user,
					include: [
						{
							model: models.userdetail,
							where: language.buildLanguageQuery(
								null,
								langId,
								'`user`.`id`',
								models.userdetail,
								'userId'
							),
							attributes: ['fullname'],
						},
					],
					attributes: ['id'],
				},
				{
					model: models.studentrecord.scope(
						{ method: ['transferred', moment().format('YYYY-MM-DD')]}
					),
					where: {
						academicSessionId,
						bcsMapId: bcsmapId,
					},
					attributes: ['roll_no'],
				},
				{
					model: models.studentdetail,
					where: language.buildLanguageQuery(
						{},
						langId,
						'`student`.`id`',
						models.studentdetail,
						'studentId'
					),
					attributes: ['father_name', 'mother_name'],
				},
			],
			where: {
				id: {$in: students},
			},
			attributes: [
				'id',
				'enrollment_no',
				'dob',
				[
					models.sequelize.literal(
						`(SELECT SUM(exam_bulk_attendance_details.present_days) FROM exam_bulk_attendance_details
						INNER JOIN exam_bulk_attendances ON exam_bulk_attendances.id = exam_bulk_attendance_details.exambulkattendanceId
						WHERE exam_bulk_attendance_details.studentId=studentrecord.studentId AND exam_bulk_attendances.masterId
						= ${masterId} AND exam_bulk_attendances.bcsmapId = ${req.bcsmapId} AND
						exam_bulk_attendances.academicSessionId = ${req.academicSessionId})`
					),
					'attendance',
				],
			],
			order: [
				[
					models.sequelize.fn(
						'FIELD',
						models.sequelize.col('`student.id`'),
						...students
					)
				]
			],
		}),
		subjectsMarks,
		activityMarks,
		models.marksheet.find({
			include: [
				{
					model: models.marksheetrecord,
					attributes: ['studentId', 'data'],
					where: {
						studentId: {
							$in: students,
						}
					},
				}
			],
			where: {
				marksheetbuilderId,
				academicsessionId: academicSessionId,
			},
			attributes: ['data'],
			order: [
				[
					models.marksheetrecord,
					models.sequelize.literal(
						'`marksheetId`, FIELD(`marksheetrecords`.`studentId`, ' 
						+ students.join(',') + ')'
					),
				]
			],
		}),
		models.tag.findAll({
			include: [
				{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`tag`.`id`',
						models.tagdetail,
						'tagId'
					),
					attributes: [
						'title',
					],
				}
			],
			where: {
				type: 6,
				is_active: 1,
				masterId: req.masterId,
			},
		}),
		models.tag.findAll({
			include: [
				{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`tag`.`id`',
						models.tagdetail,
						'tagId'
					),
					attributes: [
						'title',
					],
				}
			],
			where: {
				type: 7,
				is_active: 1,
				masterId: req.masterId,
			},
		}),
		models.exambulkattendance.findAll({
			where: {
				bcsmapId,
				masterId,
				academicSessionId,
			},
			attributes: [
				[
					models.sequelize.fn('SUM', models.sequelize.col('total')),
					'total',
				]
			],
		}),
	])
	.then(([
		institute,
		bcsmap,
		subjectExams,
		activityExams,
		students,
		[subjects, marks, markrecords],
		[activities, activitymarks, activitymarkrecords],
		marksheet,
		remarkTags,
		resultTags,
		bulkAttendance,
	]) => ({
		status: true,
		data: {
			institute,
			bcsmap,
			subjectExams,
			activityExams,
			students,
			subjects,
			marks,
			markrecords,
			activities,
			activitymarks,
			activitymarkrecords,
			marksheet,
			remarkTags,
			resultTags,
			totalDays: bulkAttendance[0].total,

			title: settings.title,
			customText1: settings.customText1,
			customText2: settings.customText2,
			subjectcategories: settings.subjectcategories,
			subActivities: settings.subActivities,
			abbreviations: settings.abbreviations,
		},
		template,
		printOptions: {
			width: '297mm',
			height: '210mm',
		},
	}))
};


exports.creator = req => models.student.findAll({
		include: [
			{
				model: models.studentrecord.scope(
					{
						method: [
							'transferred',
							moment().format('YYYY-MM-DD')
						]
					}
				),
				where: {
					bcsMapId: req.bcsmapId,
					academicSessionId: req.academicSessionId,
				},
				attributes: ['roll_no'],
			},
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
				attributes: ['id', 'user_image'],
			},
		],
		where: {
			id: {
				$in: req.students,
			},
		},
		attributes: ['id'],
		order: [
			[models.studentrecord, 'roll_no'],
			['id', 'DESC'],
		],
	})
	.then(students => Promise.all([
		models.marksheet.findOne({
			include: [
				{
					model: models.marksheetrecord,
					where: {
						studentId: {
							$in: req.students,
						},
					},
					required: false,
				}
			],
			where: {
				academicsessionId: req.academicSessionId,
				marksheetbuilderId: req.marksheetbuilderId,
			},
			order: [
				[
					models.marksheetrecord,
					models.sequelize.literal(
						'`marksheetId`, FIELD(`marksheetrecords`.`studentId`, ' 
						+ students.map(student => student.id).join(',') + ')'
					),
				]
			],
		}),
		students,
		models.tag.findAll({
			include: [
				{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`tag`.`id`',
						models.tagdetail,
						'tagId'
					),
					attributes: [
						'title',
					],
				}
			],
			where: {
				type: 6,
				is_active: 1,
				masterId: req.masterId,
			},
		}),
		models.tag.findAll({
			include: [
				{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`tag`.`id`',
						models.tagdetail,
						'tagId'
					),
					attributes: [
						'title',
					],
				}
			],
			where: {
				type: 7,
				is_active: 1,
				masterId: req.masterId,
			},
		}),
	]))
	.then(([marksheet, students, remarks, results]) => ({marksheet, students, remarks, results}))