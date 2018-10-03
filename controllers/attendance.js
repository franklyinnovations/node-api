var async = require('async');
const models = require('../models');
var language = require('./language');
var notification = require('./notification');
var subjectController = require('./subject');
var moment = require('moment');
var classes = require('./classes');

function Attendance() {

	this.init = function(req, res) {
		models.institute.find({
			attributes: ['attendance_type'],
			where: {
				userId: req.masterId
			}
		}).then(data => res({status:true, data}));
	};

	this.sendPushOnAdd = function(req){
		//Get Subject name by id
		subjectData = {id:req.subjectId, langId:req.langId.toString(), orderby: 'ASC'};
		subjectController.getById(subjectData, function(res){
			var subjectName = res.subjectdetails[0].name;
		});
	};

	this.notificationCreate = function(id, date, lang, masterId, senderId){
		Promise.all([
			models.sequelize.query(
				"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
				INNER JOIN `students` ON `users`.`id` = `students`.`userId` \
				INNER JOIN `attendance_records` ON `students`.`id` = `attendance_records`.`studentId` \
				WHERE `attendance_records`.`attendanceId` = ? AND `attendance_records`.`is_present` = 3",
				{replacements:[id], type: models.sequelize.QueryTypes.SELECT}
			),
			models.sequelize.query(
				"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
				WHERE FIND_IN_SET (`mobile`, (SELECT GROUP_CONCAT(`father_contact`,',',`father_contact_alternate`,',', \
				`mother_contact`,',',`mother_contact_alternate`,',',`guardian_contact`,',',`guardian_contact_alternate`) AS `mob`\
				FROM `students` \
				INNER JOIN `attendance_records` ON `students`.`id` = `attendance_records`.`studentId` \
				WHERE `attendance_records`.`attendanceId` = ? AND `attendance_records`.`is_present` = 3))\
				AND `users`.`user_type` = 'parent' GROUP BY `users`.`device_id`",
				{replacements:[id], type: models.sequelize.QueryTypes.SELECT}
			)
		]).then(([studentData, parentData]) => {
			var notifiData = {};
			notifiData.lang = lang;
			notifiData.date = date;
			notifiData.moment = moment;
			notification.send(studentData, 'front/notification/attendance/student', notifiData, {masterId:masterId, senderId:senderId, data:{type:'attendance'}}).then(function(){
				notification.send(parentData, 'front/notification/attendance/parent', notifiData, {masterId:masterId, senderId:senderId, data:{type:'attendance'}});
			});
		})
	};

	this.notificationUpdate = function(id, lang, masterId, senderId){
		models.attendancerecord.belongsTo(models.attendance);
		models.attendancerecord.find({
			include:[{
				model:models.attendance,
				attendance:['id', 'data']
			}],
			attributes:['id'],
			where:{
				id:id
			}
		}).then(function(ar){
			models.sequelize.query(
				"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
				INNER JOIN `students` ON `users`.`id` = `students`.`userId` \
				INNER JOIN `attendance_records` ON `students`.`id` = `attendance_records`.`studentId` \
				WHERE `attendance_records`.`id` = ? AND `attendance_records`.`is_present` = 3",
				{replacements:[id], type: models.sequelize.QueryTypes.SELECT}
			).then(function(studentData){
				models.sequelize.query(
					"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
					WHERE FIND_IN_SET (`mobile`, (SELECT GROUP_CONCAT(`father_contact`,',',`father_contact_alternate`,',', \
					`mother_contact`,',',`mother_contact_alternate`,',',`guardian_contact`,',',`guardian_contact_alternate`) AS `mob`\
					FROM `students` \
					INNER JOIN `attendance_records` ON `students`.`id` = `attendance_records`.`studentId` \
					WHERE `attendance_records`.`id` = ? AND `attendance_records`.`is_present` = 3))\
					AND `users`.`user_type` = 'parent' GROUP BY `users`.`device_id`",
					{replacements:[id], type: models.sequelize.QueryTypes.SELECT}
				).then(function(parentData){
					var notifiData = {};
					notifiData.lang = lang;
					notifiData.date = ar.attendance.date;
					notifiData.moment = moment;
					notification.send(studentData, 'front/notification/attendance/student', notifiData, {masterId:masterId, senderId:senderId, data:{type:'attendance'}}).then(function(){
						notification.send(parentData, 'front/notification/attendance/parent', notifiData, {masterId:masterId, senderId:senderId, data:{type:'attendance'}});
					});
				});
			});
		});
	};

	this.list = function(req, res){
		classes.getAllTeacherClasses(req, function(result){
			res(result);
		});
	};

	this.getClassStudents = function(req, res){
		var isWhere = {};
		isWhere.tagdetail = language.buildLanguageQuery(
			isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
		);
		isWhere.holidaydetail = language.buildLanguageQuery(
			isWhere.holidaydetail, req.langId, '`holiday`.`id`', models.holidaydetail, 'holidayId'
		);
		models.tag.hasMany(models.tagdetail);
		models.holiday.hasMany(models.holidaydetail);
		models.holiday.find({
			include: [{model:models.holidaydetail,
			where:isWhere.holidaydetail}],
			where:{masterId:req.masterId, start_date:{$lte:req.date}, end_date:{$gte:req.date}}
		}).then(function(data){
			if (data !== null) {
				res({status:true, holiday:true, holiday_data:data});
			} else {
				Promise.all([
					models.tag.findAll({
						include:[{
							model: models.tagdetail, 
							where: isWhere.tagdetail, 
							attributes: ['title', 'description']
						}],
						attributes:['id'],
						where: {
							masterId: req.masterId, 
							type: 0, 
							is_active: 1
						},
						order: [['id']]
					}),
					models.attendance.find({
						where:{
							masterId: req.masterId,
							academicSessionId: req.academicSessionId,
							bcsMapId: req.bcsMapId,
							subjectId: req.subjectId,
							period: req.period,
							date: req.date
						}
					})
				]).then(function(result){
					if(result[1]){
						req.attendanceId = result[1].id;
						module.exports.withAttendanceRecord(req, function(withMark){
							res({status:true, students:withMark, attendanceId:result[1].id, tagsData: result[0]})
						});
					} else {
						module.exports.withOutAttendanceRecord(req, function(withOutMark){
							res({status:true, students:withOutMark, attendanceId:null, tagsData: result[0]})
						});
					}
				});
			}
		});
	};

	this.withAttendanceRecord = function(req, res){
		var isWhere = {};
		isWhere.studentdetail = language.buildLanguageQuery(
			isWhere.studentdetail, req.langId, '`student`.`id`', models.studentdetail, 'studentId'
		);
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
		);
		models.studentrecord.belongsTo(models.student);
		models.student.hasMany(models.studentdetail);
		models.student.hasOne(models.attendancerecord, {as: 'attendancerecord'});
		models.student.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.studentrecord.scope(
			{ method: ['transferred', moment(req.date).format('YYYY-MM-DD')]},
			{ method: ['doa', '"'+moment(req.date).format('YYYY-MM-DD')+'"']},
			{ method: ['tc', '"'+moment(req.date).format('YYYY-MM-DD')+'"', req.academicSessionId]}
		).findAll({
			include: [{
				model:models.student, 
				attributes:['id','father_contact','enrollment_no', 'doa'],
				include:[{
					model:models.user, 
					attributes:['id','user_image'],
					include:[{
						model:models.userdetail, 
						attributes:['id', 'fullname'],
						where:isWhere.userdetail
					}], 
					where:{is_active:1}
				},{
					model:models.studentdetail, 
					attributes:['id','father_name'],
					where:isWhere.studentdetail
				},{
					model:models.attendancerecord,
					required:false,
					where:{
						attendanceId:req.attendanceId
					},
					attributes:['id', 'attendanceId', 'studentId', 'subjectId', 'is_present', 'tags'],
					as: 'attendancerecord',
				}]
			}],
			where: {
				masterId:req.masterId, 
				academicSessionId:req.academicSessionId, 
				bcsMapId:req.bcsMapId,
				/*record_status:1,
				$or: [
					{transferred: 0},
					 {transferred: 1, transerred_effective_from: {$gt:moment(req.date).format('YYYY-MM-DD')}}, 
					{transferred: 2, transerred_effective_from: {$lte:moment(req.date).format('YYYY-MM-DD')}}
				],
				doa: models.sequelize.literal('`student`.`doa` <= "'+moment(req.date).format('YYYY-MM-DD')+'" ')*/
			},
			attributes:['id', 'roll_no'],
			order: [
				['roll_no', 'ASC'],
				[ models.student, 'id', 'ASC']
			],
			subQuery:false
		}).then(res).catch(() => res({
			status:false, 
			error: true, 
			error_description: language.lang({key: "Internal Error", lang: req.lang}), 
			url: true
		}));
	};

	this.withOutAttendanceRecord = function(req, res){
		var isWhere = {};
		isWhere.studentdetail = language.buildLanguageQuery(
			isWhere.studentdetail, req.langId, '`student`.`id`', models.studentdetail, 'studentId'
		);
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
		);
		models.studentrecord.belongsTo(models.student);
		models.student.hasMany(models.studentdetail);
		models.student.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.studentrecord.scope(
			{ method: ['transferred', moment(req.date).format('YYYY-MM-DD')]},
			{ method: ['doa', '"'+moment(req.date).format('YYYY-MM-DD')+'"']},
			{ method: ['tc', '"'+moment(req.date).format('YYYY-MM-DD')+'"', req.academicSessionId]}
		).findAll({
			include: [{
				model:models.student, 
				attributes:['id','father_contact','enrollment_no'],
				include:[{
					model:models.user, 
					attributes:['id','user_image'],
					include:[{
						model:models.userdetail, 
						attributes:['id', 'fullname'],
						where:isWhere.userdetail
					}], 
					where:{is_active:1}
				},{
					model:models.studentdetail, 
					attributes:['id','father_name'],
					where:isWhere.studentdetail
				}]
			}],
			where: {
				masterId:req.masterId, 
				academicSessionId:req.academicSessionId, 
				bcsMapId:req.bcsMapId,
				/*record_status:1,
				$or: [
					{transferred: 0}, 
					{transferred: 1, transerred_effective_from: {$gt:moment(req.date).format('YYYY-MM-DD')}}, 
					{transferred: 2, transerred_effective_from: {$lte:moment(req.date).format('YYYY-MM-DD')}}
				],
				doa: models.sequelize.literal('`student`.`doa` <= "'+moment(req.date).format('YYYY-MM-DD')+'" ')*/
			},
			attributes:['id', 'roll_no'],
			order: [
				['roll_no', 'ASC'],
				[ models.student, 'id', 'ASC']
			]
		}).then(function(students){
			res(students);
		}).catch(() => res({
			status:false, 
			error: true, 
			error_description: language.lang({key: "Internal Error", lang: req.lang}), 
			url: true
		}));
	};
	/*
	 * save new
	*/
	this.savenew = function(req, res){
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}
		var attendancerecordHasMany = models.attendance.hasMany(models.attendancerecord, {as: 'attendancerecord'});
		var attendance = models.attendance.build(req);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([
				function (callback) {
						attendance.validate().then(function (err) {
								if (err !== null) {
										errors = errors.concat(err.errors);
										callback(null, errors);
								} else {
										callback(null, errors);
								}
						}).catch(callback);
				}
		], function (err, errors) {
			if (err) {
				res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true});
			}
				var merged = [].concat.apply([], errors);
				var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
				if (uniqueError.length === 0) {
					if (typeof req.id !== 'undefined' && req.id !== '') {
						models.attendancerecord.bulkCreate(req.attendancerecord,{
							ignoreDuplicates:true,
							updateOnDuplicate:['is_present', 'tags']
						}).then(function(update){
							res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:update});
						}).catch(() => res({
							status:false, 
							error: true, 
							error_description: language.lang({key: "Internal Error", lang: req.lang}), 
							url: true
						}));
					} else {
						models.attendance.create(req, {
							include:[attendancerecordHasMany]
						}).then(function(data){
							module.exports.notificationCreate(data.id, req.date, req.lang, req.masterId, req.updatedbyId);
							res({
								status:true,
								message:language.lang({key:"addedSuccessfully",lang:req.lang}),
								data:data
							});
						}).catch(() => res({
							status:false,
							error: true,
							error_description: language.lang({key: "Internal Error",lang: req.lang}),
							url: true
						}));
					}
				} else {
					language.errors({errors:uniqueError, lang:req.lang}, function(errors){
						var newArr = {};
						newArr.errors = errors;
						res(newArr);
					});
				}
		});
	};

	this.fullDayRecord = function (req, res) {
		models.studentrecord.belongsTo(models.student);
		models.student.belongsTo(models.user);
		models.user.hasMany(models.userdetail);

		models.studentrecord.belongsTo(models.timetable, {foreignKey: 'bcsMapId', targetKey: 'bcsMapId'});
		models.timetable.hasMany(models.timetableallocation);

		models.timetableallocation.belongsTo(models.attendance, {foreignKey: 'subjectId', targetKey: 'subjectId'});
		models.attendance.hasMany(models.attendancerecord);
		models.timetableallocation.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);

		models.studentrecord.scope(
			{ method: ['transferred', moment(req.date).format('YYYY-MM-DD')]},
			{ method: ['doa', '"'+moment(req.date).format('YYYY-MM-DD')+'"']},
			{ method: ['tc', '"'+moment(req.date).format('YYYY-MM-DD')+'"', req.academicSessionId]}
		).findAll({
			attributes: ['id', 'bcsMapId', 'academicSessionId', 'masterId'],
			include: [
				{
					model: models.timetable,
					attributes:['id', 'bcsMapId', 'academicSessionId'],
					include: [{
						model: models.timetableallocation,
						attributes: ['id', 'subjectId', 'period'],
						include: [
							{
								model: models.attendance,
								attributes:['id', 'userId', 'period'],
								required:false,
								where: {
									date: req.date,
									bcsMapId: req.bcsMapId,
									academicSessionId: req.academicSessionId,
									masterId: req.masterId,
									subjectId: models.sequelize.literal(
										'`timetable.timetableallocations.attendance`.`subjectId` = `timetable.timetableallocations`.`subjectId`'
									),
									period: models.sequelize.literal(
										'`timetable.timetableallocations.attendance`.`period` = `timetable.timetableallocations`.`period`'
									)
								},
								include: [{
									model: models.attendancerecord,
									required:false,
									where: {
										studentId: models.sequelize.literal('`timetable.timetableallocations.attendance.attendancerecords`.`studentId` = `studentrecord`.`studentId`'),
									}
								}],
							}, {
								model: models.subject,
								attributes: ['id'],
								include: [{
									model: models.subjectdetail,
									attributes: ['name'],
									where: language.buildLanguageQuery(
										{}, req.langId, '`timetable.timetableallocations.subject`.`id`', models.subjectdetail, 'subjectId'
									)
								}]
							}
						],
						where: {
							weekday: req.weekday
						}
					}],
					where: {
						academicSessionId: req.academicSessionId,
					}
				}, {
					model: models.student,
					attributes: ['id'],
					include: [{
						model: models.user,
						attributes:['id'],
						include: [{
							model: models.userdetail,
							attributes: ['fullname'],
							where: language.buildLanguageQuery(
								{}, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
							)
						}]
					}]
				}
			],
			where: {
				bcsMapId: req.bcsMapId,
				academicSessionId: req.academicSessionId,
				masterId: req.masterId
			},
			order: [
				['roll_no', 'ASC'],
				['studentId', 'ASC'],
				[models.timetable, models.timetableallocation, 'period', 'ASC'],
				[models.timetable, models.timetableallocation, models.attendance, 'period', 'ASC'],
			]
		}).then(data => res({status: true, data}));
	};

	this.getBcsmaps = function(req, res) {
		Promise.all([
			models.user.find({
				attributes: ['id', 'user_type'],
				where: {
					id: req.id
				}
			}),
			models.institute.find({
				attributes: ['attendance_access'],
				where: {
					userId: req.masterId
				}
			})
		]).then(([user, institute]) => {
			let where = {
					masterId: req.masterId,
					academicSessionId: req.academicSessionId
				},
				where_ta = {
					weekday: req.weekday
				};

			if(user.getDataValue('user_type') === 'teacher') {
				if(institute.getDataValue('attendance_access') === 1 && req.type === 'day') {
					where.classteacherId = req.userId;
				} else {
					where_ta.teacherId = req.userId;
				}
			}

			models.timetable.hasMany(models.timetableallocation);
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

			models.timetable.findAll({
				attributes: ['id', 'bcsMapId'],
				include: [
					{
						model: models.timetableallocation,
						attributes: ['id'],
						where: where_ta
					}, {
						model: models.bcsmap,
						attributes:['id'],
						include: [
							{
								model: models.board,
								attributes:['id'],
								include: [
									{
										model: models.boarddetail,
										attributes:['id', 'name', 'alias'],
										where:isWhere.boarddetail
									}
								]
							}, {
								model: models.classes,
								attributes:['id'],
								include: [
									{
										model: models.classesdetail,
										attributes:['id', 'name'],
										where:isWhere.classesdetail
									}
								]
							}, {
								model: models.section,
								attributes:['id'],
								include: [
									{
										model: models.sectiondetail,
										attributes:['id', 'name'],
										where:isWhere.sectiondetail
									}
								]
							}
						],
					}
				],
				where
			}).then(data => res({status: true, data}));
		});
	};

	this.slot = function(req, res) {
		Promise.all([
			models.user.find({
				attributes:['id', 'user_type'],
				where: {
					id: req.id
				}
			})
		]).then(([user]) => {
			let where = {
					masterId: req.masterId,
					academicSessionId: req.academicSessionId,
					bcsMapId: req.bcsMapId
				},
				where_ta = {
					weekday: req.weekday
				};
			if(user.getDataValue('user_type') === 'teacher'){
				where_ta.teacherId = req.userId;
			}

			models.timetableallocation.belongsTo(models.timetable);
			models.timetableallocation.belongsTo(models.subject);
			models.subject.hasMany(models.subjectdetail);

			models.timetableallocation.findAll({
				attributes: ['period', 'subjectId'],
				include: [
					{
						model: models.timetable,
						attributes: ['id'],
						where
					}, {
						model: models.subject,
						attributes: ['id'],
						include: [
							{
								model: models.subjectdetail,
								attributes: ['name'],
								where: language.buildLanguageQuery(
									{}, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
								)
							}
						]
					}
				],
				where: where_ta
			}).then(data => res({status: true, data}));
		});
	};

	this.saveAttendance = function(req, res) {
		if(req.attendance.length === 0){
			res({status: true});
		}

		if (!moment(req.date).isSameOrBefore(moment())) {
			res({status:false, message: language.lang({key: 'Not allow to take attendance of future date!!!',lang: req.lang})});
		} else {
			
			let query = [];
			models.attendance.hasMany(models.attendancerecord);
			req.attendance.forEach(item => {
				if(item.id) {
					let data = item.attendancerecords.map(item2 => {
						item2.attendanceId = item.id;
						return item2;
					});

					query.push(
						models.attendancerecord.bulkCreate(data, {
							ignoreDuplicates:true,
							updateOnDuplicate:['is_present', 'tags']
						})
					);
				} else {
					query.push(
						models.attendance.create(item, {
							include: [models.attendancerecord]
						})
					);
				}
			});
			
			Promise.all(query).then(() => {
				res({status: true, message: language.lang({key:'addedSuccessfully',lang:req.lang})});
			});
		}

	};
}

module.exports = new Attendance();
