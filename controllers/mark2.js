'use strict';

const models = require('../models'),
moment = require('moment'),
language = require('./language');

models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);
models.examscheduledetail.belongsTo(models.subject);
models.subject.hasMany(models.subjectdetail);
models.student.belongsTo(models.user);
models.student.hasOne(models.studentrecord);
models.student.hasMany(models.markrecord);
models.user.hasMany(models.userdetail);
models.markrecord.belongsTo(models.mark);
models.mark.belongsTo(models.examschedule);
models.examschedule.hasMany(models.examscheduledetail);
models.examscheduledetail.hasMany(models.examschedulesubjectcategory, {foreignKey: 'examScheduleDetailId'});
models.examschedulesubjectcategory.belongsTo(models.subjectcategory, {foreignKey: 'subjectCategoryId'});
models.subjectcategory.hasMany(models.subjectcategorydetail);
models.mark.hasMany(models.markrecord);

exports.sections = req => {
	let where = {
		masterId: req.masterId,
		examScheduleId: models.sequelize.literal(
			'(SELECT COUNT(*) FROM `exam_schedules` WHERE `id` = '
			+ JSON.stringify(parseInt(req.examScheduleId))
			+ ' AND `boardId` = `bcsmap`.`boardId` AND `classId` = `bcsmap`.`classId`)'
		)
	};
	if (req.user_type === 'teacher') {
		where.timetable = models.sequelize.literal(
			'(SELECT COUNT(*) FROM `timetables` INNER JOIN `timetable_allocations` \
			ON `timetables`.`id` = `timetable_allocations`.`timetableId` AND `teacherId` = '
			+ JSON.stringify(parseInt(req.userTypeId))
			+ ' AND `timetables`.`is_active` = 1 AND `timetables`.`academicSessionId` = '
			+ JSON.stringify(parseInt(req.academicSessionId))
			+ ' AND `timetables`.`masterId` = '
			+ JSON.stringify(parseInt(req.masterId))
			+ ' WHERE `timetables`.`bcsMapId` = `bcsmap`.`id`)'
		);
	}
	return models.bcsmap.findAll({
		include:
		[
			{
				model: models.section,
				include:
				[
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
			},
		],
		where,
		attributes: ['id'],
	})
	.then(bcsmaps => ({
		status: true,
		bcsmaps,
	}));
};

exports.subjects = req => {
	let where = {
		examScheduleId: req.examScheduleId,
		masterId: req.masterId,
	};
	if (req.user_type === 'teacher') {
		where.timetable = models.sequelize.literal(
			'(SELECT COUNT(*) FROM `timetables` INNER JOIN `timetable_allocations` \
			ON `timetables`.`id` = `timetable_allocations`.`timetableId` AND `teacherId` = '
			+ JSON.stringify(parseInt(req.userTypeId))
			+ ' AND `timetables`.`is_active` = 1 AND `timetables`.`academicSessionId` = '
			+ JSON.stringify(parseInt(req.academicSessionId))
			+ ' AND `timetables`.`masterId` = '
			+ JSON.stringify(parseInt(req.masterId))
			+ ' WHERE `timetables`.`bcsMapId` = '
			+ JSON.stringify(parseInt(req.bcsMapId))
			+ ' AND `timetable_allocations`.`subjectId` = `examscheduledetail`.`subjectId`'
			+ ')'
		);
	}

	if (req.view) {
		where.view = models.sequelize.literal(
			'(SELECT COUNT(`id`) FROM `marks` WHERE \
			`examScheduleId` = `examscheduledetail`.`examScheduleId` AND \
			`subjectId` = `examscheduledetail`.`subjectId` AND \
			`exam_type` = `examscheduledetail`.`exam_type` AND \
			`bcsMapId` = ' + JSON.stringify(parseInt(req.bcsMapId)) +')'
		);
	}

	return models.examscheduledetail.findAll({
		include:
		[
			{
				model: models.subject,
				include:
				[
					{
						model: models.subjectdetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`subject`.`id`',
							models.subjectdetail,
							'subjectId'
						),
						attributes: ['name']
					}
				],
				attributes: ['id'],
			}
		],
		where,
	})
	.then(examscheduledetails => ({
		status: true,
		examscheduledetails
	}))
};

exports.students = req => {
	return models.examscheduledetail.findAll({
		include:  [
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
						attributes: ['name']
					}
				],
				attributes: ['id']
			},
			{
				model: models.examschedulesubjectcategory,
				include: [
					{
						model:  models.subjectcategory,
						include:
						[
							{
								model: models.subjectcategorydetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`examschedulesubjectcategories.subjectcategory`.`id`',
									models.subjectcategorydetail,
									'subjectcategoryId'
								),
								attributes: ['name'],
								required: false,
							}
						],
						attributes: ['id'],
						required: false,
					}
				],
				required: false,
			},
		],
		where: {
			id: {
				$in: req.examscheduledetails
			}
		},
		attributes: [
			'id',
			'max_mark',
			'min_passing_mark',
			'subjectId',
			'exam_type',
			'date',
			[
				models.sequelize.literal(
					'(SELECT `id` FROM `marks` WHERE \
					`examScheduleId` = `examscheduledetail`.`examScheduleId` AND \
					`subjectId` = `examscheduledetail`.`subjectId` AND \
					`exam_type` = `examscheduledetail`.`exam_type` AND \
					`bcsMapId` = ' + JSON.stringify(parseInt(req.bcsMapId)) +')'
				),
				'markId'
			],
		],
		order: [
			[ 'subjectId' ],
			[ 'exam_type' ],
			[ models.examschedulesubjectcategory, 'subjectCategoryId' ],
		],
	})
	.then(examscheduledetails => {
		let minDate = examscheduledetails[0].date;
		for (var i = examscheduledetails.length - 1; i >= 1; i--) {
			if (minDate.getTime() > examscheduledetails[i].date.getTime()) {
				minDate = examscheduledetails[i].date;
			}
		}
		return Promise.all([
			models.student.scope({
				method: [
					'doa1', moment(minDate).format('YYYY-MM-DD')
				]
			})
			.findAll({
				include: [
					{
						model: models.studentrecord.scope(
							{
								method: ['transferred', moment(minDate).format('YYYY-MM-DD')]
							},
							{
								method: ['tc', '"'+moment(minDate).format('YYYY-MM-DD')+'"', req.academicSessionId]
							}
						),
						where: {
							academicSessionId: req.academicSessionId,
							bcsMapId: req.bcsMapId,
						},
						attributes: ['roll_no']
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
								attributes: ['fullname']
							}
						],
						where:{is_active: 1},
						attributes: ['user_image'],
					},
					{
						model: models.markrecord,
						include: [
							{
								model: models.mark,
								required: false,
							},
						],
						where: {
							markId: {
								$in: examscheduledetails.map(item => item.toJSON().markId)
							}
						},
						required: false
					},
				],
				attributes: ['id'],
				order:
				[
					[ models.studentrecord, 'roll_no' ],
					[ models.markrecord, models.mark, 'subjectId' ],
					[ models.markrecord, models.mark, 'exam_type' ]
				],
			}),
			examscheduledetails,
		]);
	})
	.then(([students, examscheduledetails]) => ({
		status: true,
		students,
		examscheduledetails
	}));
};

exports.save = req => {
	return Promise.all(
		req.marks.map(mark => {
			if (mark.id) {
				return models.markrecord.bulkCreate(
					mark.markrecords,
					{
						updateOnDuplicate: [
							'obtained_mark',
							'tags',
							'subjectcategory_marks'
						],
						ignoreDuplicates: true,
					}
				)
			} else {
				mark.academicSessionId = req.academicSessionId;
				mark.masterId = req.masterId;
				return models.mark.create(
					mark,
					{
						include: [models.markrecord],
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