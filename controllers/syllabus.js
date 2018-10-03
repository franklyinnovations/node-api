'use strict';

const models = require('../models'),
	language = require('./language'),
	notification = require('./notification');

models.examscheduledetail.belongsTo(models.examschedule);
models.examschedule.belongsTo(models.examhead);
models.examhead.hasMany(models.examheaddetail);
models.examschedule.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.examschedule.belongsTo(models.classes);
models.classes.hasMany(models.classesdetail);
models.examscheduledetail.belongsTo(models.subject);
models.subject.hasMany(models.subjectdetail);
models.examscheduledetail.belongsTo(models.user, {as: 'updater', foreignKey: 'updaterId'});
models.user.hasMany(models.userdetail);
models.examscheduledetail.hasMany(models.examsyllabus);

function Syllabus() {

	this.list = function (req) {
		var pageSize = req.app.locals.site.page, // number of items per page
			page = req.query.page || 1;

		var reqData = req.body.data ? JSON.parse(req.body.data) : req.body, where = {
		};

		if (reqData.masterId !== 1) {
			where.examscheduledetail = {
				masterId: reqData.masterId
			};
		}
		if (reqData.user_type === 'teacher') {
			where.examscheduledetail.teacherFilter = getTeacherFilter(
				reqData.userTypeId,
				reqData.academicSessionId
			);
		}

		where.examschedule = {
			academicSessionId: reqData.academicSessionId,
			is_active: 1
		};

		if (req.query) {
			Object.keys(req.query).forEach(key => {
				var modelKey = key.split('__');
				if(typeof where[modelKey[0]] =='undefined'){
					var col = {};
					if (modelKey.length === 3) {
						col[modelKey[1]] = req.query[key];
					} else {
						col[modelKey[1]] = {$like: '%' + req.query[key] + '%'};
					}
					where[modelKey[0]] = col;
				} else {
					if (modelKey.length === 3) {
						where[modelKey[0]][modelKey[1]] = req.query[key];
					} else {
						where[modelKey[0]][modelKey[1]] = {$like: '%' + req.query[key] + '%'};
					}
				}
			});
		}

		return Promise.all([
			models.examscheduledetail.findAndCountAll({
				include: [
					{
						model: models.examschedule,
						where: where.examschedule,
						include: [
							{
								model: models.examhead,
								include: [{
									model: models.examheaddetail,
									where: language.buildLanguageQuery(
										{},
										reqData.langId,
										'`examschedule.examhead`.`id`',
										models.examheaddetail,
										'examheadId'
									),
									attributes: ['id', 'name']
								}],
								attributes: ['id']
							},
							{
								model: models.classes,
								include: [{
									model: models.classesdetail,
									where: language.buildLanguageQuery(
										{},
										reqData.langId,
										'`examschedule.class`.`id`',
										models.classesdetail,
										'classId'
									),
									attributes: ['name']
								}],
								attributes: ['id']
							},
							{
								model: models.board,
								include: [{
									model: models.boarddetail,
									where: language.buildLanguageQuery(
										{},
										reqData.langId,
										'`examschedule.board`.`id`',
										models.boarddetail,
										'boardId'
									),
									attributes: ['alias']
								}],
								attributes: ['id']
							}
						],
						attributes: ['id']
					},
					{
						model: models.user,
						include: [{
							model: models.userdetail,
							attributes: ['fullname'],
							where: language.buildLanguageQuery(
								{},
								reqData.langId,
								'`updater`.`id`',
								models.userdetail,
								'userId'
							),
							required: false
						}],
						as: 'updater',
						attributes: ['id', 'user_type'],
						required: false
					},
					{
						model: models.subject,
						include: [{
							model: models.subjectdetail,
							where: language.buildLanguageQuery(
								where.subjectdetail,
								reqData.langId,
								'`subject`.`id`',
								models.subjectdetail,
								'subjectId'
							),
							attributes: ['id', 'name']
						}],
						attributes: ['id']
					}
				],
				distinct: true,
				attributes: ['id', 'exam_type'],
				limit: pageSize,
				offset: (page - 1) * pageSize,
				where: where.examscheduledetail,
				order: [
					['date', 'ASC'],
					['start_time', 'ASC']
				],
				subQuery: false
			}),
			getClasses(
				reqData.masterId,
				reqData.userTypeId,
				reqData.user_type,
				reqData.langId,
				reqData.academicSessionId,
			),
			models.examhead.findAll({
				include: [{
					model: models.examheaddetail,
					where: language.buildLanguageQuery(
						{},
						reqData.langId,
						'`examhead`.`id`',
						models.examheaddetail,
						'examheadId'
					)
				}],
				where: {
					masterId: reqData.masterId,
					is_active: 1
				},
				order: [['id', 'DESC']]
			})
		])
			.then(([result, classes, examheads]) => ({
				status: true,
				message: result.rows.length === 0 ?
					language.lang({key: 'No record found', lang: reqData.lang}) : undefined,
				data: result.rows,
				classes: classes,
				examheads,
				totalData: result.count,
				pageCount: Math.ceil(result.count / pageSize),
				pageLimit: pageSize,
				currentPage: page
			}));
	};

	this.getById = function (req) {
		return models.examscheduledetail.findOne({
			where: {
				id: req.id,
				masterId: req.masterId
			},
			include: [{
				model: models.examsyllabus,
				where: language.buildLanguageQuery(
					{},
					req.langId,
					'`examscheduledetail`.`id`',
					models.examsyllabus,
					'examscheduledetailId'
				),
				required: false
			}]
		}).then(result => ({
			status: true,
			data: result
		}));
	};

	this.save = function (req) {
		if (!req.syllabus || req.syllabus.trim().length === 0) {
			return {
				status: false,
				error: true,
				message: language.lang({key: 'Internal Error', lang: req.lang})
			};
		}
		var updates = [
			models.examscheduledetail.update({
				updaterId: req.userId
			}, {
				where: {
					id : req.id
				}
			}),
			models.examsyllabus.upsert({
				syllabus: req.syllabus,
				languageId: req.langId,
				examscheduledetailId: req.id
			})
		];

		if (req.langId !== 1) {
			updates.push(models.examsyllabus.findOrCreate({
				where: {
					languageId: 1,
					examscheduledetailId: req.id
				},
				defaults: {
					syllabus: req.syllabus,
				}
			}));
		}

		return Promise.all(updates).then(() => {
			module.exports.notification(req.id, req.lang, req.langId, req.masterId, req.userId);
			return {
				status: true,
				message: language.lang({key: 'updatedSuccessfully', lang: req.lang})
			};
		});
	};

	this.notification = function(examscheduledetailId, lang, langId, masterId, senderId){
		models.examscheduledetail.belongsTo(models.examschedule);
		models.examschedule.belongsTo(models.examhead);
		models.examhead.hasMany(models.examheaddetail);
		models.examscheduledetail.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);

		var isWhere = {};
		isWhere.examheaddetail = language.buildLanguageQuery(
			isWhere.examheaddetail, langId, '`examhead`.`id`', models.examheaddetail, 'examheadId'
		);
		isWhere.subjectdetail = language.buildLanguageQuery(
			isWhere.subjectdetail, langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
		);

		models.examscheduledetail.find({
			include:[{
				model:models.examschedule,
				attributes:['id', 'boardId', 'classId', 'academicSessionId'],
				include:[{
					model:models.examhead,
					attributes:['id'],
					include:[{
						model:models.examheaddetail,
						attributes:['id', 'name'],
						where:isWhere.examheaddetail
					}]
				}]
			},{
				model:models.subject,
				attributes:['id'],
				include:[{
					model:models.subjectdetail,
					attributes:['id', 'name']
				}]
			}],
			where:{
				id:examscheduledetailId
			}
		}).then(function(result){
			notification.bcsmapIds(result.examschedule.boardId, result.examschedule.classId).then(function(bcsmapIds){
				Promise.all([
					notification.getStudentsByBcsmapId(bcsmapIds, result.examschedule.academicSessionId),
					notification.getParentByBcsmapId(bcsmapIds, result.examschedule.academicSessionId)
				]).then(function(data){
					var notifiData = {};
					notifiData.lang = lang;
					notifiData.subject = result.subject.subjectdetails[0].name;
					notifiData.exam = result.examschedule.examhead.examheaddetails[0].name;
					notification.send(data[0], 'front/notification/examsyllabus/student', notifiData, {masterId:masterId, senderId:senderId, data:{type:'examsyllabus'}}).then(function(){
						notification.send(data[1], 'front/notification/examsyllabus/parent', notifiData, {masterId:masterId, senderId:senderId, data:{type:'examsyllabus'}});
					});
				});
			});
		});
	};
}

function getClasses(masterId, id, user_type, langId, academicSessionId) {
	models.timetable.hasMany(models.timetableallocation);
	models.timetable.belongsTo(models.bcsmap, {foreignKey: 'bcsMapId'});
	models.bcsmap.belongsTo(models.classes);
	models.bcsmap.belongsTo(models.board);
	models.classes.hasMany(models.classesdetail);
	models.board.hasMany(models.boarddetail);
	var include = [{
		model: models.bcsmap,
		include: [{
			model: models.classes,
			include: [{
				model: models.classesdetail,
				where: language.buildLanguageQuery(
					{},
					langId,
					'`bcsmap.class`.`id`',
					models.classesdetail,
					'classId'
				),
				attributes: ['name']
			}],
			where: {is_active: 1},
			attributes: ['id'],
		}, {
			model: models.board,
			include: [{
				model: models.boarddetail,
				where: language.buildLanguageQuery(
					{},
					langId,
					'`bcsmap.board`.`id`',
					models.boarddetail,
					'boardId'
				),
				attributes: ['alias']
			}],
			where: {is_active: 1},
			attributes: ['id']
		}],
		attributes: ['id'],
	}];

	if (user_type === 'teacher') {
		include.push({
			model: models.timetableallocation,
			where: {
				teacherId: id
			},
			attributes: ['id']
		});
	}

	return models.timetable.findAll({
		include,
		attributes: ['id'],
		where: {masterId, academicSessionId, is_active: 1},
		group: [
			[models.bcsmap, models.classes, 'id'],
			[models.bcsmap, models.board, 'id']
		]
	});
}

function getTeacherFilter(teacherId, academicSessionId) {
	return models.sequelize.literal(
		'(SELECT COUNT(*) FROM `timetables` INNER JOIN `bcs_maps` ON `timetables`.`is_active` = 1 AND `timetables`.`bcsMapId` = `bcs_maps`.`id` INNER JOIN `timetable_allocations` ON `timetable_allocations`.`timetableId` = `timetables`.`id` WHERE `bcs_maps`.`classId` = `examschedule`.`classId` AND `bcs_maps`.`boardId` = `examschedule`.`boardId` AND `timetables`.`academicSessionId` = '
		+ parseInt(academicSessionId)
		+ ' AND `timetable_allocations`.`teacherId` = '
		+ parseInt(teacherId)
		+ ' AND `timetable_allocations`.`subjectId` = `examscheduledetail`.`subjectId`)'
	);
}

module.exports = new Syllabus();