'use strict';

const gcm = require('node-gcm'),
config = require('../config/config')[process.env.NODE_ENV || 'development'],
language = require('./language'),
models = require('../models');

const sender = new gcm.Sender(config.notificationApiKey);

const defaultMessage = {
    priority: 'high',
    contentAvailable: true,
    delayWhileIdle: true,
    timeToLive: 3
	// restricted_package_name: 'com.pws.pateast',
	// dry_run: true
},
defaultNotification = {
	title: 'Pateast',
	sound: 'default',
	icon: 'ic_notification'
};

const render = (template, data) => new Promise((resolve, reject) => {
	pateast_app.render(
		template,
		language.bindLocale(data, data.lang || 'en'),
		(err, result) => {
			if (err)
				reject(err);
			else
				resolve(result)
		}
	);
});

exports.send = function (to, template, data, message = {}) {
	//to = [{id:1, device_id:'dek76zbjOOc:APA91bHtzMkR27WwOz-_0kdJeXE5bVaJrjKAosIXROLqOkaNzwwo__werHandLOeZ7t8NJz3aMWJszAEcXTBE7rABb5jLmb-CFkRmczD8TJ3TvssCX9UwHjv6ZIAJsQkKazAKc0t1Z8e'}];
	message.notification = Object.assign(message.notification || {}, defaultNotification);
	var recipients = {
		registrationTokens: to.filter(x => x.is_notification && !!x.device_id).map(x => x.device_id)
	};

	return render(template, data)
		.then(result => saveNotification({to, message:result, data:message}))
		.then(notification => {
			return new Promise((resolve, reject) => {
				if(!notification || recipients.registrationTokens.length == 0)
					return resolve(true);
				message.data.notificationId = notification.id;
				message.notification.body = notification.message;
				Object.assign(message, defaultMessage);
				var msg = new gcm.Message(message);
				sender.send(msg, recipients, 3, (err, response) => {
					if (err)
						reject(err);
					else
						resolve(response);
				});
			});
		}).catch(console.log);
};

const saveNotification = function(data){
	var storeData = {};
	storeData.masterId = data.data.masterId;
	storeData.senderId = data.data.senderId;
	storeData.type = data.data.data.type;
	storeData.message = data.message;
	var receivers =[];
	data.to.forEach(function(item){
		if(item.id){
			var obj = {};
			obj.receiverId = item.id;
			obj.status = 0;
			receivers.push(obj);
		}
	});
	storeData.receivers = receivers;
	var receiversData = models.notification.hasMany(models.notificationreceiver, {as: 'receivers'});
	if(receivers.length > 0){
		return models.notification.create(storeData,{include: [receiversData]});
	} else {
		return false;
	}
};

exports.bcsmapIds = (boardId, classId) => {
	return models.sequelize.query("SELECT `id` FROM `bcs_maps` WHERE `boardId` = ? \
	 AND `classId` = ? ",
	{replacements:[boardId,classId], type: models.sequelize.QueryTypes.SELECT} )
	.then(ids => ids.map(x => x.id));
};

exports.getTeachersByBcsmapId = function(bcsmapIds, academicSessionId){
	return models.sequelize.query(
		"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `timetable_allocations` \
		 INNER JOIN `timetables` ON `timetable_allocations`.`timetableId` = `timetables`.`id` \
		 INNER JOIN `teachers` ON `timetable_allocations`.`teacherId` = `teachers`.`id`  \
		 INNER JOIN `users` ON `teachers`.`userId` = `users`.`id` \
		 WHERE `timetables`.`bcsMapId` IN (?) \
		 AND `timetables`.`academicSessionId` = ? \
		 AND `timetable_allocations`.`teacherId` != 0 \
		 GROUP BY `users`.`id`",
		{replacements:[bcsmapIds,academicSessionId], type: models.sequelize.QueryTypes.SELECT}
	);
};

exports.getTeachersByTimetableId = function(id, academicSessionId){
	return models.sequelize.query(
		"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `timetable_allocations` \
		 INNER JOIN `timetables` ON `timetable_allocations`.`timetableId` = `timetables`.`id` \
		 INNER JOIN `teachers` ON `timetable_allocations`.`teacherId` = `teachers`.`id`  \
		 INNER JOIN `users` ON `teachers`.`userId` = `users`.`id` \
		 WHERE `timetables`.`id` = ? \
		 AND `timetables`.`academicSessionId` = ? \
		 AND `timetable_allocations`.`teacherId` != 0 \
		 GROUP BY `users`.`id`",
		{replacements:[id,academicSessionId], type: models.sequelize.QueryTypes.SELECT}
	);
};

exports.getStudentsByBcsmapId = function(bcsmapIds, academicSessionId){
	return models.sequelize.query(
		"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
		INNER JOIN `students` ON `users`.`id` = `students`.`userId` \
		INNER JOIN `student_records` ON `students`.`id` = `student_records`.`studentId`\
		WHERE `student_records`.`bcsMapId` IN (?) AND `student_records`.`academicSessionId` = ? \
		GROUP BY `users`.`id`",
		{replacements:[bcsmapIds,academicSessionId], type: models.sequelize.QueryTypes.SELECT}
	);
};

exports.getParentByBcsmapId = function(bcsmapIds, academicSessionId){
	return models.sequelize.query(
		"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
		WHERE FIND_IN_SET (`mobile`, (SELECT GROUP_CONCAT(`father_contact`,',',`father_contact_alternate`,',', \
		`mother_contact`,',',`mother_contact_alternate`,',',`guardian_contact`,',',`guardian_contact_alternate`) AS mob\
		FROM `students` \
		INNER JOIN `student_records` ON `students`.`id` = `student_records`.`studentId`\
		WHERE `student_records`.`bcsMapId` IN (?) AND `student_records`.`academicSessionId` = ?))\
		AND `users`.`user_type` = 'parent' GROUP BY `users`.`id`",
		{replacements:[bcsmapIds,academicSessionId], type: models.sequelize.QueryTypes.SELECT}
	);
};

exports.getParentByStudentId = function(bcsmapIds, academicSessionId){
	 return models.sequelize.query(
	 	"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
	 	WHERE FIND_IN_SET (`mobile`, (SELECT GROUP_CONCAT(`father_contact`,',',`father_contact_alternate`,',', \
		`mother_contact`,',',`mother_contact_alternate`,',',`guardian_contact`,',',`guardian_contact_alternate`) AS mob\
		FROM `students` \
		INNER JOIN `student_records` ON `students`.`id` = `student_records`.`studentId`\
		WHERE `student_records`.`bcsMapId` IN (?) AND `student_records`.`academicSessionId` = ?))\
	 	AND `users`.`device_id` != '' AND `users`.`user_type` = 'parent' GROUP BY `users`.`id`",
	 	{replacements:[bcsmapIds,academicSessionId], type: models.sequelize.QueryTypes.SELECT}
	 );
};

exports.getAllTeachers = function getAllTeacher(masterId) {
	return models.sequelize.query(
		"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
		WHERE `users`.`masterId` = ? AND `users`.`is_active` = 1 \
		AND `users`.`user_type` = 'teacher' \
		GROUP BY `users`.`id`",
		{replacements: [masterId], type: models.sequelize.QueryTypes.SELECT}
	);	
};

exports.list = function (req, res) {
	var setPage = req.app.locals.site.page;
    var currentPage = 1;
    var pag = 1;
    if (typeof req.query.page !== 'undefined') {
        currentPage = +req.query.page;
        pag = (currentPage - 1)* setPage;
        delete req.query.page;
    } else {
        pag = 0;
    }
    var reqData = req.body;
	if(typeof req.body.data !== 'undefined'){
		reqData = JSON.parse(req.body.data);
	}
	models.notificationreceiver.belongsTo(models.notification);
	models.notification.belongsTo(models.user, {foreignKey:'senderId'});
	models.user.hasMany(models.userdetail);
	models.user.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
	models.institute.hasMany(models.institutedetail);

	models.notificationreceiver.findAndCountAll({
		include: [
			{
				model: models.notification,
				attributes:['type', 'message'],
				include:[
					{
						model:models.user,
						attributes:['id', 'user_type'],
						include:[
							{
								model:models.userdetail,
								attributes:['fullname']
							},
							{
								model: models.institute,
								attributes: ['id'],
								include: [
									{
										model: models.institutedetail,
										where: language.buildLanguageQuery(
											{},
											req.langId,
											'`notification.user.institute`.`id`',
											models.institutedetail,
											'instituteId'
										),
										attributes: ['name', 'alias'],
									}
								],
							},
						]
					},
				]
			}
		],
		where: {
			receiverId:reqData.userId
		},
		order: [
			['id', 'DESC']
		],
		distinct: true,
		limit: setPage,
		offset: pag, subQuery: false
	})
		.then(result => ({
			totalData: result.count,
			pageCount: Math.ceil(result.count / setPage),
			pageLimit: setPage, 
			currentPage:currentPage, 
			status: true,
			message: language.lang({key: 'Notification List', lang: reqData.lang}),
			data: result.rows
		}))
		.then(res);
};

/*
   *Notification status update
*/
exports.notificationStatus = function(req, res) {
	models.notificationreceiver.update(
		{
			status:req.is_notification
		},
		{
			where:{
				notificationId:req.notificationId,
				receiverId:req.receiverId
			}
		}
	)
	.then(function(data){
	  res({
	  	status:true,
	  	message:language.lang({key:"updatedSuccessfully", lang:req.lang}),
	  	data:{notification:req.is_notification}
	  });
	});
};
