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

models.markrecord.belongsTo(models.mark);
models.mark.belongsTo(models.examschedule);

models.subject.hasMany(models.subjectdetail);

models.academicsession.hasMany(models.academicsessiondetail);

models.institute.hasMany(models.institutedetail);

models.bcsmap.belongsTo(models.board);
models.bcsmap.belongsTo(models.classes);
models.bcsmap.belongsTo(models.section);
models.bcsmap.belongsTo(models.grade);

models.board.hasMany(models.boarddetail);

models.classes.hasMany(models.classesdetail);

models.section.hasMany(models.sectiondetail);

models.activity.hasMany(models.activity, {
	as: 'subActivities',
	foreignKey: 'superActivityId',
	sourceKey: 'id',
});

const template = 'helium';

/** returns settings, template, editor data **/
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
		})
	])
	.then(([examheads, subjects, activities]) => ({
		status: true,
		id,
		template,
		settings,
		options: {
			subjects,
			examheads,
			activities,
		},
	}))

const bcsname = models.sequelize.literal(
	'CONCAT(`board.boarddetails`.`alias`,'
	+ ' " - " , `class.classesdetails`.`name`,'
	+ ' " - " ,`section.sectiondetails`.`name`)'
);

exports.data = req => {
	let {
		lang,
		langId,
		masterId,
		settings,
		students,
		bcsmapId,
		academicSessionId,
	} = req;

	settings = JSON.parse(settings);
	const exams = settings.preMidTermExams.concat(settings.preAnnualExams);

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
					models.sequelize.col('`examschedule.examheadId`'),
					...exams
				),
			],
			[
				models.sequelize.fn(
					'FIELD',
					models.sequelize.col('`mark`.`subjectId`'),
					...(settings.subjects)
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
								attributes: [],
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
					studentId: req.students,
					activitymarkId: {$in: activitymarkIds},
				},
				group: [
					['activitymarkId'],
				],
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
			attributes: ['id', 'enrollment_no', 'dob'],
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
					model: models.board,
					include: [
						{
							model: models.boarddetail,
							where: language.buildLanguageQuery(
								{},
								langId,
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
								langId,
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
								langId,
								'`section`.`id`',
								models.sectiondetail,
								'sectionId'
							),
							attributes: [],
						}
					],
					attributes: [],
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
				[bcsname, 'name'],
			]
		}),
		marksAndMarkrecords,
		activitiesAndActivityMarksAndActivityMarkRecords,
	])
	.then(([students, subjects, examheads, institute, bcsmap, 
		[marks, markrecords], [activities, activitymarks, activitymarkrecords]]) => ({
		status: true,
		data: {
			students,
			subjects,
			examheads,
			institute,
			bcsmap,
			marks,
			markrecords,
			activities,
			activitymarks,
			activitymarkrecords,
			customText: settings.customText,
			preMidTermExams: settings.preMidTermExams,
			preAnnualExams: settings.preAnnualExams,
			w1: settings.w1,
			w2: settings.w2,
			abbreviations: settings.abbreviations,
		},
		template,
		printOptions: {
			width: '210mm',
			height: '297mm',
		},
	}));
};

exports.creator = req => {
	return {};
};