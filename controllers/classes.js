var async = require('async');
const models = require('../models');
const moment = require('moment');
var language = require('./language');

function myClass() {

	this.getAllTeacherClasses = function(req, res) {
		models.timetable.hasMany(models.timetableallocation);
		models.timetableallocation.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		models.timetable.belongsTo(models.teacher, {foreignKey: 'classteacherId'});
		models.teacher.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.timetable.belongsTo(models.bcsmap);
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		
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
		isWhere.subjectdetail = language.buildLanguageQuery(
			isWhere.subjectdetail, req.langId, '`timetableallocations.subject`.`id`', models.subjectdetail, 'subjectId'
		);

		models.timetable.findAll({
			include: [
				{model: models.timetableallocation,
					where:{teacherId:req.userId, weekday:req.weekday},
					include:[{model:models.subject, attributes:['id'], include:[{model:models.subjectdetail, attributes:['id', 'name'], where:isWhere.subjectdetail}]}]
				},
				{model:models.teacher,
					attributes:['id'],
					include:[{model:models.user, attributes:['id'],
					include:[{model:models.userdetail, attributes:['id', 'fullname'],
					where:isWhere.userdetail, required: false}], required: false}],  required: false
				},
				{model: models.bcsmap,attributes:['id'],
				include: [{model: models.board,
					attributes:['id'],
					include: [{model: models.boarddetail, attributes:['id', 'name', 'alias'],
					where:isWhere.boarddetail}]
				},
				{model: models.classes,
					attributes:['id'],
					include: [{model: models.classesdetail, attributes:['id', 'name'],
					where:isWhere.classesdetail}]
				},
				{model: models.section,
					attributes:['id'],
					include: [{model: models.sectiondetail, attributes:['id', 'name'],
					where:isWhere.sectiondetail}]
				}],
			 }
			],
			where: {masterId:req.masterId, academicSessionId:req.academicSessionId, is_active:1},
		 // attributes:['id'],
			attributes: Object.keys(models.timetable.attributes).concat([
				[
					models.sequelize.literal(
						'(SELECT count(*) FROM `student_records`\
						 INNER JOIN `students`\
						 INNER JOIN `users`\
						 WHERE `student_records`.`academicSessionId` = `timetable`.`academicSessionId`\
						 AND `student_records`.`bcsMapId` = `timetable`.`bcsMapId`\
						 AND `students`.`id` = `student_records`.`studentId`\
						 AND `students`.`doa` <= "' + moment(req.date).format('YYYY-MM-DD') + '"\
						 AND `users`.`id` = `students`.`userId`\
						 AND`users`.`is_active` = 1\
						 AND `student_records`.`record_status` = 1\
						 AND ((`student_records`.`transferred` = 0)\
						 OR (\`student_records`.`transferred` = 1 AND `student_records`.`transerred_effective_from` > "' + moment(req.date).format('YYYY-MM-DD') + '")\
						 OR (`student_records`.`transferred` = 2 AND `student_records`.`transerred_effective_from` <= "' + moment(req.date).format('YYYY-MM-DD') + '"))\
						 AND `student_records`.`studentId` NOT IN(SELECT `studentId` FROM transfer_certificates WHERE releaving_date <= "'+moment(req.date).format('YYYY-MM-DD')+'" and academicsessionId = '+req.academicSessionId+' and bcsmapId = `student_records`.`bcsMapId`))'
					),
					'studentrecord'
				]
			]),
			order: [
				[ models.timetableallocation, 'period', 'ASC'],
				['id', 'DESC']
			]
		}).then(function(data){
			res({status:true, message:language.lang({key:"classes_list", lang:req.lang}), data:data});
		});
	};


	this.getAllTeacherClassesWeekly = function(req, res) {
		models.timetableallocation.belongsTo(models.timetable);
		models.timetableallocation.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		models.timetable.belongsTo(models.teacher, {foreignKey: 'classteacherId'});
		models.teacher.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.timetable.belongsTo(models.bcsmap,{foreignKey:'bcsMapId'});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		
		var isWhere = {};
		isWhere.boarddetail = language.buildLanguageQuery(
			isWhere.boarddetail, req.langId, '`timetable.bcsmap.board`.`id`', models.boarddetail, 'boardId'
		);
		isWhere.classesdetail = language.buildLanguageQuery(
			isWhere.classesdetail, req.langId, '`timetable.bcsmap.class`.`id`', models.classesdetail, 'classId'
		);
		isWhere.sectiondetail = language.buildLanguageQuery(
			isWhere.sectiondetail, req.langId, '`timetable.bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
		);
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.langId, '`teacher.user`.`id`', models.userdetail, 'userId'
		);
		isWhere.subjectdetail = language.buildLanguageQuery(
			isWhere.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
		);

		models.timetableallocation.findAll({
			include: [
				{model: models.timetable,
					where: {masterId:req.masterId, academicSessionId:req.academicSessionId, is_active:1},
					include:[
						{model: models.bcsmap, attributes:['id'],
							include: [
								{model: models.board,
									attributes:['id'],
									include: [{model: models.boarddetail, attributes:['id', 'name', 'alias'],
										where:isWhere.boarddetail}]
								},
								{model: models.classes,
									attributes:['id'],
									include: [{model: models.classesdetail, attributes:['id', 'name'],
										where:isWhere.classesdetail}]
								},
								{model: models.section,
									attributes:['id'],
									include: [{model: models.sectiondetail, attributes:['id', 'name'],
										where:isWhere.sectiondetail}]
								}
							],
						}
					]
				},
				{model:models.subject, attributes:['id'],
					include:[
						{model:models.subjectdetail, attributes:['id', 'name'],
							where:isWhere.subjectdetail
						}
					]
				}
			],
			where:{teacherId:req.userId},
			order: [
				[ 'start_time', 'ASC']
			]
		}).then(function(data){
			res({
				status:true,
				message:language.lang({
					key: data.length !== 0 ? "classes_list" : "No classes found",
					lang:req.lang
				}),
				data:data
			});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.getAllClassSchedule = function(req, res) {
		models.timetableallocation.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		var isWhere = {};
		isWhere.subjectdetail = language.buildLanguageQuery(
			isWhere.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
		);
		models.timetableallocation.findAll({
			include: [
				{model:models.subject, attributes:['id'], include:[{model:models.subjectdetail, attributes:['id', 'name'], where:isWhere.subjectdetail, required: false}], required: false}
			],
			where:{timetableId:req.timetableId, teacherId:req.userId},
			order: [
				[ 'order', 'ASC'],
			]
		}).then(function(data){
			res({status:true, message:language.lang({key:"schedule_list", lang:req.lang}), data:data});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.timetable = function(req, res) {
		models.timetableallocation.belongsTo(models.timetable);
		models.timetableallocation.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		models.timetable.belongsTo(models.teacher, {foreignKey: 'classteacherId'});
		models.teacher.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.timetable.belongsTo(models.bcsmap,{foreignKey:'bcsMapId'});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		
		var isWhere = {};
		isWhere.boarddetail = language.buildLanguageQuery(
			isWhere.boarddetail, req.langId, '`timetable.bcsmap.board`.`id`', models.boarddetail, 'boardId'
		);
		isWhere.classesdetail = language.buildLanguageQuery(
			isWhere.classesdetail, req.langId, '`timetable.bcsmap.class`.`id`', models.classesdetail, 'classId'
		);
		isWhere.sectiondetail = language.buildLanguageQuery(
			isWhere.sectiondetail, req.langId, '`timetable.bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
		);
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		isWhere.subjectdetail = language.buildLanguageQuery(
			isWhere.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
		);

		Promise.all([models.timetableallocation.findAll({
			include: [
				{model: models.timetable,
					where: {masterId:req.masterId, academicSessionId:req.academicSessionId, is_active:1},
					include:[
						{model: models.bcsmap, attributes:['id'],
						 include: [
							{model: models.board,
								attributes:['id'],
								include: [{model: models.boarddetail, attributes:['id', 'name', 'alias'],
								where:isWhere.boarddetail}]
							},
							{model: models.classes,
								attributes:['id'],
								include: [{model: models.classesdetail, attributes:['id', 'name'],
								where:isWhere.classesdetail}]
							},
							{model: models.section,
								attributes:['id'],
								include: [{model: models.sectiondetail, attributes:['id', 'name'],
								where:isWhere.sectiondetail}]
							}
						],
					 }
					]
				},
				{model:models.subject, attributes:['id'],
				include:[
					{model:models.subjectdetail, attributes:['id', 'name'],
						where:isWhere.subjectdetail
					}
				 ]
				}
			],
			where:{teacherId:req.userId},
			order: [
				[ 'start_time', 'ASC']
			]
		}),
		models.user.find({
			where: {id: req.id},
			include:[
				{
					model: models.userdetail,
					attributes: ['fullname'],
					where: isWhere.userdetail
				}
			],
			attributes: ['id']
		})
		]).then(function(data){
			res({
				status:true,
				message:language.lang({key:"classes_list", lang:req.lang}),
				data:data[0],
				teacher: data[1].userdetails[0].fullname
			});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.getStudentClassesWeekly = function(req, res) {
		models.timetable.hasMany(models.timetableallocation);
		models.timetableallocation.belongsTo(models.teacher);
		models.teacher.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.timetableallocation.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);

		models.timetable.belongsTo(models.bcsmap,{foreignKey:'bcsMapId'});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		models.timetable.belongsTo(models.teacher,{foreignKey:'classteacherId'});
		models.teacher.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		
		models.timetable.find({
			attributes:['id', 'bcsMapId', 'classteacherId'],
			include: 
			[
				{
					model: models.timetableallocation,
					include:
					[
						{
							model:models.teacher, 
							attributes:['id'], 
							include:
							[
								{
									model:models.user, 
									attributes:['id'], 
									include:
									[
										{
											model:models.userdetail, 
											attributes:['id', 'fullname'], 
											where: language.buildLanguageQuery(
												{}, 
												req.langId, 
												'`timetableallocations.teacher.user`.`id`', models.userdetail, 'userId'
											), 
											required: false
										}
									], 
									required: false
								}
							],  
							required: false
						},
						{
							model:models.subject, 
							attributes:['id'], 
							include:
							[
								{
									model:models.subjectdetail, 
									attributes:['id', 'name'], 
									where: language.buildLanguageQuery(
										{}, req.langId, 
										'`timetableallocations.subject`.`id`', 
										models.subjectdetail, 'subjectId'
									), 
									required: false
								}
							], 
							required: false
						}
					],
					required: false
				},
				{
					model: models.bcsmap,
					include: 
					[
						{
							model: models.board, 
							attributes:['id'],
							include: 
							[
								{
									model: models.boarddetail,
									attributes:['id', 'name', 'alias'],
									where: language.buildLanguageQuery(
										{}, 
										req.langId, 
										'`bcsmap.board`.`id`', models.boarddetail, 'boardId'
									)
								}
							]
						},
						{
							model: models.classes, 
							attributes:['id'],
							include: 
							[
								{
									model: models.classesdetail,
									attributes:['id', 'name'],
									where: language.buildLanguageQuery(
										{}, 
										req.langId, 
										'`bcsmap.class`.`id`', 
										models.classesdetail, 'classId'
									)
								}
							]
						},
						{
							model: models.section, 
							attributes:['id'],
							include: 
							[
								{
									model: models.sectiondetail,
									attributes:['id', 'name'],
									where: language.buildLanguageQuery(
										{}, 
										req.langId, 
										'`bcsmap.section`.`id`', 
										models.sectiondetail, 
										'sectionId'
									)
								}
							]
						}],
				},
				{
					model:models.teacher, 
					attributes:['id'], 
					include:
					[
						{
							model:models.user, 
							attributes:['id'], 
							include:
							[
								{
									model:models.userdetail, 
									attributes:['id', 'fullname'], 
									where: language.buildLanguageQuery(
										{}, 
										req.langId, 
										'`teacher.user`.`id`',
										models.userdetail, 'userId'
									)
								}
							]
						}
					]
				}
			],
			where:{
				bcsMapId:req.bcsMapId, 
				academicSessionId:req.academicSessionId,
				masterId: req.masterId
			},
			order: [
				[ models.timetableallocation, 'order', 'ASC'],
				[ models.timetableallocation, 'id', 'ASC']
			],
		}).then(function(data){
			if(data === null || typeof data === 'undefined'){
				res({status: false, data:data});
			}else{
				res({status: true, data:data});
			}   
		}).catch(() => res(
			{
				status:false, 
				error: true, 
				error_description: language.lang({key: 'Internal Error', lang: req.lang}), 
				url: true
			}
		));
	};

	this.getStudentClasses = function(req, res) {
		models.timetable.hasMany(models.timetableallocation);
		models.timetableallocation.belongsTo(models.teacher);
		models.timetableallocation.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		models.timetable.belongsTo(models.teacher, {foreignKey: 'classteacherId'});
		models.teacher.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.timetable.belongsTo(models.bcsmap);
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		
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
		isWhere.subjectdetail = language.buildLanguageQuery(
			isWhere.subjectdetail, req.langId, '`timetableallocations.subject`.`id`', models.subjectdetail, 'subjectId'
		);

		models.timetable.findAll({
			include: [
				{
					model: models.timetableallocation,
					where:{
						weekday:req.weekday
					},
					include:[
						{
							model:models.teacher, 
							attributes:['id'], 
							include:
							[
								{
									model:models.user, 
									attributes:['id'], 
									include:
									[
										{
											model:models.userdetail, 
											attributes:['id', 'fullname'], 
											where: language.buildLanguageQuery(
												{}, 
												req.langId, 
												'`timetableallocations.teacher.user`.`id`', models.userdetail, 'userId'
											), 
										}
									], 
								}
							],  
						},
						{
							model:models.subject, 
							attributes:['id'], 
							include:[
								{
									model:models.subjectdetail, 
									attributes:['id', 'name'], 
									where:isWhere.subjectdetail
								}
							]
						}]
				},
				{
					model:models.teacher,
					attributes:['id'],
					include:[
						{
							model:models.user, 
							attributes:['id'],
							include:[
								{
									model:models.userdetail, 
									attributes:['id', 'fullname'],
									where:isWhere.userdetail, 
									required: false
								}], 
							required: false
						}],  required: false
				},
				{
					model: models.bcsmap,attributes:['id'],
					include: [
						{model: models.board,
							attributes:['id'],
							include: [{model: models.boarddetail, attributes:['id', 'name', 'alias'],
								where:isWhere.boarddetail}]
						},
						{model: models.classes,
							attributes:['id'],
							include: [{model: models.classesdetail, attributes:['id', 'name'],
								where:isWhere.classesdetail}]
						},
						{model: models.section,
							attributes:['id'],
							include: [{model: models.sectiondetail, attributes:['id', 'name'],
								where:isWhere.sectiondetail}]
						}
					],
				}
			],
			where: {
				masterId:req.masterId, 
				academicSessionId:req.academicSessionId,
				bcsMapId:req.bcsMapId,
				is_active:1
			},
			attributes: ['id'],
			order: [
				[ models.timetableallocation, 'period', 'ASC'],
				['id', 'DESC']
			],
		}).then(function(data){
			res({status:true, message:language.lang({key:'classes_list', lang:req.lang}), data:data});
		});
	};
}

module.exports = new myClass();
