'use strict';

const
	moment = require('moment'),
	language = require('../language'),
	models = require('../../models');

models.student.belongsTo(models.user);
models.student.hasOne(models.studentrecord);
models.student.hasMany(models.studentdetail);
models.student.hasMany(models.attendancerecord);
models.student.hasMany(models.markrecord);

models.user.hasMany(models.userdetail);

models.marksheet.hasMany(models.marksheetrecord);
models.tag.hasMany(models.tagdetail);

const template = 'beryllium';

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
	}));

exports.data = req => {
	let {
		lang,
		langId,
		masterId,
		settings,
		students,
		bcsmapId,
		marksheetbuilderId,
		academicSessionId,
	} = req;

	settings = JSON.parse(settings);
	const exams = settings.midTermExams.concat(settings.annualExams);

	const marksAndMarkrecords = models.mark.findAll({
		include: {
			model: models.examschedule,
			where: {
				examheadId: {$in: exams},
			},
			attributes: ['examheadId'],
		},
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
					...exams
				),
			],
		],
	}).then(marks => {
		let markIds = marks.map(mark => mark.id);
		if (markIds.length === 0) return [[], []];
		return Promise.all([
			marks,
			models.markrecord.findAll({
				where: {
					studentId: {$in: students},
					markId: {$in: markIds},
				},
				attributes: [
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
							...markIds
						)
					],
				],
			}),
		]);
	});

	const activitiesAndActivityMarksAndActivityMarkRecords = (
		settings.activities.length === 0 ? Promise.resolve([]) : 
		models.activity.findAll({
			include: [
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
			],
			where: {
				masterId,
				id: {$in: settings.activities},
			},
			attributes: ['id'],
			order: [
				[
					models.sequelize.fn('FIELD', models.sequelize.col('`activity`.`id`'),
						...(settings.activities))
				],
				[models.sequelize.literal('`subActivities`.`id`')],
			],
		})
	).then(activities => {
		let activityIds = [];
		for (let i = 0; i < activities.length; i++) {
			activityIds.push(activities[i].id);
			for (let j = 0; j < activities[i].subActivities.length; j++) {
				activityIds.push(activities[i].subActivities[j].id);
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
									examheadId: {$in: exams},
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
							...exams
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
				}
			],
			where: {
				userId: masterId,
			},
			attributes: [],
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
				[models.sequelize.fn('FIELD', models.sequelize.col('`examhead`.`id`'), ...exams)],
			],
			where: {
				id: {$in: exams},
			}
		}),
		models.subject.findAll({
			include: [
				{
					model: models.subjectdetail,
					where: language.buildLanguageQuery(
						{}, 
						langId,
						'`subject`.`id`', 
						models.subjectdetail, 
						'subjectId'
					),
					attributes: ['alias', 'name'],
				}
			],
			where: {
				id: {$in: settings.subjects},
				masterId,
			},
			attributes: ['id'],
			order: [
				[
					models.sequelize.fn(
						'FIELD',
						models.sequelize.col('`subject`.`id`'),
						...settings.subjects
					)
				],
			]
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
		marksAndMarkrecords,
		activitiesAndActivityMarksAndActivityMarkRecords,
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
		examheads,
		subjects,
		students,
		marksheet,
		tags,
		[marks, markrecords],
		[activities, activitymarks, activitymarkrecords],
		bulkAttendance,
	]) => ({
		status: true,
		data: {
			institute,
			bcsmap,
			examheads,
			subjects,
			students,
			marksheet,
			tags,
			marks,
			markrecords,
			activities,
			activitymarks,
			activitymarkrecords,
			totalDays: bulkAttendance[0].total,

			w1: settings.w1,
			w2: settings.w2,
			customText: settings.customText,
			annualExams: settings.annualExams,
			midTermExams: settings.midTermExams,
			abbreviations: settings.abbreviations,
		},
		template,
		printOptions: {
			width: '297mm',
			height: '210mm',
		},
	}))
};


exports.creator = req =>
	models.student.findAll({
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
	]))
	.then(([marksheet, students, tags]) => ({marksheet, students, tags}))