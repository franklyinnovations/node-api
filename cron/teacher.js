'use strict';

const
	ejs = require('ejs'),
	moment = require('moment'),
	common = require('./common'),
	models = require('../models'),
	mail = require('../controllers/mail'),
	language = require('../controllers/language');

models.teacher.belongsTo(models.user);
models.studentleave.belongsTo(models.user);
models.timetableallocation.belongsTo(models.timetable);
models.timetableallocation.belongsTo(models.subject);
models.subject.hasMany(models.subjectdetail);
models.timetable.belongsTo(models.bcsmap,{foreignKey:'bcsMapId'});
models.bcsmap.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.bcsmap.belongsTo(models.classes);
models.classes.hasMany(models.classesdetail);
models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);

async function digests(masterId, day) {
	let teachers = await models.teacher.findAll({
		include: [
			{
				model: models.user,
				include: [
					{
						model: models.digest,
						where: {
							interval: {
								$lte: models.sequelize.fn(
									'DATEDIFF',
									models.sequelize.fn('NOW'),
									models.sequelize.col('date'),
								),
							},
						},
					},
					{
						model: models.language,
						attributes: ['id', 'code', 'direction'],
					},
					{
						model: models.role,
						include: [
							{
								model: models.rolepermission,
								include: [
									{
										model: models.permission,
										where: {
											model: ['assignment'],
										},
										attributes: ['model'],
										required: false,
									}
								],
							}
						],
						attributes: ['id'],
					},
				],
				where: {
					is_active: 1,
				},
				attributes: [
					'id',
					'email',
					'masterId',
					'default_lang',
					'defaultSessionId',
				],
			}
		],
		where: {
			masterId,
		},
		attributes: ['id'],
		group: [
			['id'],
			[models.user, models.digest, 'model'],
			[models.user, models.role, models.rolepermission, models.permission, 'model'],
		],
	});
	return Promise.all(teachers.map(digest.bind(this, day)));
}

async function digest(day, teacher) {
	let modules = teacher.user.role.rolepermissions.filter(({permission}) => permission !== null).map(({permission: {model}}) => model);
	modules.push('todo', 'studentleave', 'timetable');
	modules = modules.reduce((modules, module) => {
		let digest = teacher.user.digests.find(({model}) => module === model);
		if (digest) {
			modules[module] = digest;
		}
		return modules;
	}, {});
	let [
		institute,
		userdetails,
		todos,
		assignments,
		studentleaves,
		timetableallocations,
	] = await Promise.all([
		common.institute(teacher.user),
		common.userdetails(teacher.user),
		modules.todo && getTodos(teacher.user, day, modules.todo),
		modules.assignment && getAssignments(teacher, day, modules.assignment),
		modules.studentleave && getStudentleaves(teacher, day, modules.studentleave),
		modules.timetable && getTeacherClasses(teacher, day, modules.timetable),
	]);
	teacher.user.userdetails = userdetails;
	let data = language.bindLocale({
		day,
		todos,
		moment,
		institute,
		assignments,
		studentleaves,
		timetableallocations,
		user: teacher.user,
	}, teacher.user.language.code);
	mail.sendMail({
		email: teacher.user.email,
		subject: data.__('Pateast Digest'),
		msg: await ejs.renderFile('views/digests/teacher.ejs', data),
	});
}

function getTodos(user, day, digest) {
	digest.date = day.format('YYYY-MM-DD');
	digest.save();
	return models.todo.findAndCountAll({
		where: {
			userId: user.id,
			createdAt: {
				$gt: digest.date
			},
		},
		attributes: ['subject'],
		limit: 10,
		order: [
			['createdAt', 'DESC'],
		],
	});
}

function getAssignments(teacher, day, digest) {
	digest.date = day.format('YYYY-MM-DD');
	digest.save();
	return models.assignment.findAndCountAll({
		include: [
			{
				model: models.assignmentdetail,
				where: language.buildLanguageQuery(
					null,
					teacher.user.language.id,
					'`assignment`.`id`',
					models.assignmentdetail,
					'assignmentId'
				),
				attributes: ['title'],
			}
		],
		where: {
			userId: teacher.user.id,
			masterId: teacher.user.masterId,
			academicSessionId: teacher.user.defaultSessionId,
			assignment_status: {
				$in:[
					'Draft',
					'Published', 
					'Completed',
					'Reviewed'
				]
			},
			start_date: {
				$gt: digest.date
			},  
		},
		attributes: [
			'end_date',
			'assignment_status',
			'createdAt'
		],
		limit: 10,
		order: [
			['createdAt', 'DESC'],
		],
	});
}

function getStudentleaves(teacher, day, digest) {
	digest.date = day.format('YYYY-MM-DD');
	digest.save();
	return models.studentleave.findAndCountAll({
		include: [
			{
				model: models.user,
				include: [
					{
						model: models.userdetail,
						where: language.buildLanguageQuery(
							null,
							teacher.user.language.id,
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
			masterId: teacher.user.masterId,
			academicSessionId: teacher.user.defaultSessionId,
			start_date: {
				$gt: digest.date
			},
			bcsMapId: {
				$eq:models.sequelize.literal(
					'(SELECT `bcsMapId` FROM `timetables` WHERE `classteacherId` = ' 
				+ teacher.id + ' AND `academicSessionId` = '+ teacher.user.defaultSessionId + ')'
				)}
		},
		attributes: ['leavestatus', 'start_date', 'end_date', 'createdAt'],
		limit: 10,
		order: [
			['createdAt', 'DESC'],
		],
	});
}

function getTeacherClasses(teacher, day, digest) {
	digest.date = day.format('YYYY-MM-DD');
	digest.save();
	let ttallocwhere = {
		teacherId: teacher.id,
	};
	if(digest.interval === 1)
		ttallocwhere.weekday = day.format('dddd');

	let where = {
		boarddetail: language.buildLanguageQuery(
			null,
			teacher.user.language.id,
			'`timetable.bcsmap.board`.`id`',
			models.boarddetail,
			'boardId'
		),
		classesdetail: language.buildLanguageQuery(
			null,
			teacher.user.language.id,
			'`timetable.bcsmap.class`.`id`',
			models.classesdetail,
			'classId'
		),
		sectiondetail: language.buildLanguageQuery(
			null,
			teacher.user.language.id,
			'`timetable.bcsmap.section`.`id`',
			models.sectiondetail,
			'sectionId'
		),
		subjectdetail: language.buildLanguageQuery(
			null,
			teacher.user.language.id,
			'`subject`.`id`',
			models.subjectdetail,
			'subjectId'
		),
	};

	return models.timetableallocation.findAndCountAll({
		include: [
			{
				model: models.timetable,
				where: {
					masterId:teacher.user.masterId,
					academicSessionId:teacher.user.defaultSessionId,
					is_active:1
				},
				include:[
					{
						model: models.bcsmap,
						include: [
							{
								model: models.board,
								attributes: ['id'],
								include: [
									{
										model: models.boarddetail,
										where: where.boarddetail,
										attributes: ['name', 'alias'],
										required: false
									}
								],
								required: false
							},
							{
								model: models.classes,
								attributes: ['id'],
								include: [
									{
										model: models.classesdetail,
										where: where.classesdetail,
										attributes: ['name'],
										required: false
									}
								],
								required: false
							},
							{
								model: models.section,
								attributes: ['id'],
								include: [
									{
										model: models.sectiondetail,
										where: where.sectiondetail,
										attributes: ['name'],
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
				attributes:['id', 'bcsMapId'],
			},
			{
				model: models.subject,
				include:[
					{
						model: models.subjectdetail,
						where:where.subjectdetail,
						attributes:['id', 'name']
					}
				],
				attributes:['id']
			}
		],
		attributes:['id', 'teacherId', 'weekday', 'start_time', 'end_time', 'period'],
		where:ttallocwhere,
		limit: 10,
		order: [
			['start_time', 'ASC'],
			[
				models.sequelize.fn(
					'FIELD',
					models.sequelize.col('`timetableallocation.weekday`'),
					'Monday',
					'Tuesday',
					'Wednesday',
					'Thursday',
					'Friday',
					'Saturday',
					'Sunday'
				),
			]
		],
	});
}

module.exports = digests;