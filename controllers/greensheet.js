'use strict';

const models = require('../models'),
	moment = require('moment'),
	language = require('./language');

models.mark.belongsTo(models.examschedule);
models.mark.belongsTo(models.subject);
models.examschedule.belongsTo(models.examhead);
models.examhead.hasMany(models.examheaddetail);
models.subject.hasMany(models.subjectdetail);
models.student.belongsTo(models.user);
models.student.hasOne(models.studentrecord);
models.student.hasMany(models.markrecord);
models.student.hasMany(models.studentdetail);
models.student.hasMany(models.exambulkattendancedetail);
models.user.hasMany(models.userdetail);
models.markrecord.belongsTo(models.mark);
models.timetable.belongsTo(models.teacher, {foreignKey:'classteacherId'});
models.timetable.belongsTo(models.bcsmap, {foreignKey:'bcsMapId'});
models.bcsmap.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);
models.bcsmap.belongsTo(models.classes);
models.bcsmap.belongsTo(models.grade);
models.classes.hasMany(models.classesdetail);
models.institute.hasMany(models.institutedetail);
models.teacher.belongsTo(models.user);
models.exambulkattendance.belongsTo(models.examhead);
models.exambulkattendancedetail.belongsTo(models.exambulkattendance);

exports.students = req => {
	return Promise.all([
		models.mark.findAll({
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
										{},
										req.langId,
										'`examschedule.examhead`.`id`',
										models.examheaddetail,
										'examheadId'
									),
									attributes: ['alias', 'name']
								}
							],
							attributes: ['id'],
							where: {
								is_active: 1
							}
						}
					],
					where: {
						is_active: 1
					},
					attributes: ['id']
				},
				{
					model: models.subject,
					include: [
						{
							model: models.subjectdetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`subject`.`id`',
								models.subjectdetail,
								'subjectId'
							),
							attributes: ['name'],
						}
					],
					where: {is_active: 1},
					attributes: ['id'],
				},
			],
			where: {
				masterId: req.masterId,
				bcsMapId: req.bcsMapId,
				academicSessionId: req.academicSessionId,
			},
			order: [
				['subjectId'],
				['exam_type'],
				['id'],
			],
		}),
		models.exambulkattendance.findAll({
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
				},
			],
			where: {
				masterId: req.masterId,
				bcsMapId: req.bcsMapId,
				academicSessionId: req.academicSessionId,
			},
			attributes: ['id'],
		}),
	])
		.then(([marks, exambulkattendances]) => Promise.all([
			marks,
			models.student.findAll({
				include: [
					{
						model: models.studentdetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`student`.`id`',
							models.studentdetail,
							'studentId'
						),
						attributes: ['father_name', 'mother_name'],
					},
					{
						model: models.studentrecord.scope(
							{ method: ['transferred', moment().format('YYYY-MM-DD')]}
						),
						where: {
							academicSessionId: req.academicSessionId,
							bcsMapId: req.bcsMapId,
							record_status: 1,
						},
						attributes: ['roll_no'],
					},
					{
						model: models.user,
						include: [
							{
								model: models.userdetail,
								where: language.buildLanguageQuery(
									{},
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
							is_active: 1,
						},
					},
					{
						model: models.markrecord,
						include: [
							{
								model: models.mark,
								attributes: [],
								required: false,
							}
						],
						where: {
							markId: {
								$in: marks.map(mark => mark.id),
							},
						},
						attributes: ['markId', 'obtained_mark'],
						required: false,
					},
					{
						model: models.exambulkattendancedetail,
						include: [
							{
								model: models.exambulkattendance,
								attributes: [],
								required: false,
							}
						],
						where: {
							exambulkattendanceId: {
								$in: exambulkattendances.map(exambulkattendance => exambulkattendance.id)
							}
						},
						required: false,
					}
				],
				attributes: ['id', 'enrollment_no', 'dob'],
				order: [
					[models.studentrecord, 'roll_no'],
					['id'],
					[models.markrecord, models.mark, 'subjectId'],
					[models.markrecord, models.mark, 'exam_type'],
					[models.markrecord, 'markId'],
					[models.exambulkattendancedetail, models.exambulkattendance, 'examheadId'],
					[models.exambulkattendancedetail, 'exambulkattendanceId'],
				],
			}),
			models.institute.find({
				include: [
					{
						model: models.institutedetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`institute`.`id`',
							models.institutedetail,
							'instituteId'
						),
						attributes: ['name', 'address'],
					},
				],
				attributes: ['id'],
				where:{
					userId: req.masterId,
				},
			}),
			models.timetable.find({
				include: [
					{
						model: models.teacher,
						include: [
							{
								model: models.user,
								include: [
									{
										model: models.userdetail,
										where: language.buildLanguageQuery(
											{},
											req.langId,
											'`teacher.user`.`id`',
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
					},
					{
						model: models.bcsmap,
						include: [
							{
								model: models.board,
								attributes: ['id'],
								include: [
									{
										model: models.boarddetail,
										attributes: ['alias'],
										where: language.buildLanguageQuery(
											{},
											req.langId,
											'`bcsmap.board`.`id`',
											models.boarddetail,
											'boardId'
										)
									}
								]
							},
							{
								model: models.classes,
								attributes: ['id'],
								include: [
									{
										model: models.classesdetail,
										attributes: ['id', 'name'],
										where: language.buildLanguageQuery(
											{},
											req.langId,
											'`bcsmap.class`.`id`',
											models.classesdetail,
											'classId'
										)
									}
								]
							},
							{
								model: models.section,
								attributes: ['id'],
								include: [
									{
										model: models.sectiondetail,
										attributes: ['id', 'name'],
										where: language.buildLanguageQuery(
											{},
											req.langId,
											'`bcsmap.section`.`id`',
											models.sectiondetail,
											'sectionId'
										)
									}
								]
							},
							{
								model: models.grade,
								attribute: ['data'],
							},
						],
						attributes: ['id'],
					}
				],
				where: {
					bcsMapId: req.bcsMapId,
					academicSessionId: req.academicSessionId,
					is_active: 1,
				},
				attributes: ['id', 'classteacherId', 'bcsMapId'],
			})
		]))
		.then(([marks, students, institute, timetable]) => ({
			status: true,
			marks,
			students,
			institute,
			timetable,
		}));
};