var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var sms = require('./sms');
var notification = require('./notification');

function filterMobileNumber(mobile) {
	if (! mobile.startsWith('+')) {
		mobile = '+' + mobile;
	}
	var res = '';
	for (var i = 0; i < mobile.length; i++) {
		if (mobile[i] >= '0' && mobile[i] <= '9') {
			res += mobile[i];
		}
	}
	return res;
}

function Studentleave() {
	/*
	 * save
	*/
	this.save = function(req, res){
		if (typeof req.leavestatus === 'undefined') {
			req.leavestatus = 0;
		}
		var studentleave = models.studentleave.build(req);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([
			function (callback) {
				studentleave.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			}
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
			if (uniqueError.length === 0) {
				models.studentleave.create(req).then(function(data){
					res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			} else {
				language.errors({errors:uniqueError, lang:req.lang}, function(errors){
					var newArr = {};
					newArr.errors = errors;
					newArr.message = errors[0].message;
					newArr.status = false;
					res(newArr);
				});
			}
		});
	};


	/*
	 * list of all
	*/
	this.list = function(req, res) {
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
		/*
		* for  filltering
		*/
		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			responseData.studentleave = {userId:reqData.userId};
			responseData.studentleave.academicSessionId = reqData.academicSessionId;
			responseData.tagdetail = {};
			async.forEach(Object.keys(req.query), function (item, callback) {
				if (req.query[item] !== ''){
					var modelKey = item.split('__');
					if(typeof responseData[modelKey[0]] =='undefined'){
						var col = {};
						col[modelKey[1]] = {$like: '%' + req.query[item] + '%'};
						responseData[modelKey[0]] = col;
					} else {
						responseData[modelKey[0]][modelKey[1]] = {$like: '%' + req.query[item] + '%'};
					}
				}
				callback();
			}, function () {
				isWhere = responseData;
			});
		}
		//isWhere['delete'] = 1;
		orderBy = 'id DESC';
		models.studentleave.belongsTo(models.tag);
		models.tag.hasMany(models.tagdetail);

		isWhere.tagdetail = language.buildLanguageQuery(
			isWhere.tagdetail, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
		);

		models.studentleave.findAndCountAll({
			include: [
				{model: models.tag, required:false, include: [{model: models.tagdetail, where:isWhere.tagdetail, required:false}]},
			],
			where: isWhere.studentleave,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);
			res({status:true, message:language.lang({key:"leaveRecord", lang:req.lang}), data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	};


	/*
	 * list of all
	*/
	this.teacherlist = function(req, res) {
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
		/*
		* for  filltering
		*/
		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			responseData.studentleave = {academicSessionId:reqData.academicSessionId};
			responseData.studentleave.status_updatedbytype = {$ne:'student'};
			responseData.tagdetail = {};
			responseData.userdetail = {};
			async.forEach(Object.keys(req.query), function (item, callback) {
				if (req.query[item] !== ''){
					var modelKey = item.split('__');
					if(typeof responseData[modelKey[0]] =='undefined'){
						var col = {};
						if (modelKey.length === 3) {
							col[modelKey[1]] = req.query[item];
						} else {
							col[modelKey[1]] = {$like: '%' + req.query[item] + '%'};
						}
						responseData[modelKey[0]] = col;
					} else {
						if (modelKey.length === 3) {
							responseData[modelKey[0]][modelKey[1]] = req.query[item];
						} else {
							responseData[modelKey[0]][modelKey[1]] = {$like: '%' + req.query[item] + '%'};
						}
					}
				}
				callback();
			}, function () {
				isWhere = responseData;
			});
		}

		isWhere.tagdetail = language.buildLanguageQuery(
			isWhere.tagdetail, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
		);
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		//isWhere['delete'] = 1;
		orderBy = 'id DESC';
		models.studentleave.belongsTo(models.tag);
		models.studentleave.belongsTo(models.user);
		models.user.hasOne(models.student);
		models.student.hasOne(models.studentrecord);
		models.user.hasMany(models.userdetail);
		models.tag.hasMany(models.tagdetail);
		models.timetable.find({where:{classteacherId:reqData.userId, academicSessionId:reqData.academicSessionId}}).then(function(data){
			if (data !== null) {
				isWhere.studentleave.bcsMapId = data.bcsMapId;
				models.studentleave.findAndCountAll({
					include: [
						{model: models.tag, required:false, include: [{model: models.tagdetail, where:isWhere.tagdetail, required:false}]},
						{model: models.user, include:
							[
								{model: models.userdetail, where:isWhere.userdetail},
								{
									model: models.student,
									include: [{
										model: models.studentrecord,
										where: {
											academicSessionId: reqData.academicSessionId
										},
										attributes: ['roll_no']
									}],
									attributes: ['id']
								}
							]
						}
					],
					where: isWhere.studentleave,
					order: [
						['id', 'DESC']
					],
					distinct: true,
					limit: setPage,
					offset: pag, subQuery: false
				}).then(function(result){
					var totalData = result.count;
					var pageCount = Math.ceil(totalData / setPage);
					res({status:true, message:language.lang({key:"leaveRecord", lang:req.lang}), data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			} else {
				res({status:true, message:language.lang({key:"leaveRecord", lang:req.lang}), data:[], totalData: 0, pageCount: 0,  pageLimit: 0 });
			}
		});
	};


	/*
	 * list of all
	*/
	this.institutelist = function(req, res) {
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
		/*
		* for  filltering
		*/
		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			responseData.studentleave = {academicSessionId:reqData.academicSessionId};
			responseData.studentleave.status_updatedbytype = {$ne:'student'};
			responseData.tagdetail = {};
			responseData.userdetail = {};
			async.forEach(Object.keys(req.query), function (item, callback) {
				if (req.query[item] !== ''){
					var modelKey = item.split('__');
					if(typeof responseData[modelKey[0]] =='undefined'){
						var col = {};
						if (modelKey.length === 3) {
							col[modelKey[1]] = req.query[item];
						} else {
							col[modelKey[1]] = {$like: '%' + req.query[item] + '%'};
						}
						responseData[modelKey[0]] = col;
					} else {
						if (modelKey.length === 3) {
							responseData[modelKey[0]][modelKey[1]] = req.query[item];
						} else {
							responseData[modelKey[0]][modelKey[1]] = {$like: '%' + req.query[item] + '%'};
						}
					}
				}
				callback();
			}, function () {
				isWhere = responseData;
			});
		}



		//isWhere['delete'] = 1;
		orderBy = 'id DESC';
		models.studentleave.belongsTo(models.tag);
		models.studentleave.belongsTo(models.user);
		models.user.hasOne(models.student);
		models.student.hasOne(models.studentrecord);
		models.user.hasMany(models.userdetail);
		models.tag.hasMany(models.tagdetail);
		models.studentleave.belongsTo(models.bcsmap, {foreignKey:'bcsMapId'});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);

		isWhere.tagdetail = language.buildLanguageQuery(
			isWhere.tagdetail, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
		);
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
		);

		const bcsInclude1 = [
			{
				model: models.board,
				attributes: ['id'],
				include:[{
					model: models.boarddetail,
					where: language.buildLanguageQuery({}, reqData.langId, '`board`.`id`', models.boarddetail, 'boardId'),
					attributes: ['alias']
				}]
			},
			{
				model: models.classes,
				attributes: ['id'],
				include:[{
					model: models.classesdetail,
					where: language.buildLanguageQuery({}, reqData.langId, '`class`.`id`', models.classesdetail, 'classId'),
					attributes: ['name']
				}]
			},
			{
				model: models.section,
				attributes: ['id'],
				include:[{
					model: models.sectiondetail,
					where: language.buildLanguageQuery({}, reqData.langId, '`section`.`id`', models.sectiondetail, 'sectionId'),
					attributes: ['name']
				}]
			}
		];

		const bcsInclude2 = [
			{
				model: models.board,
				attributes: ['id'],
				include:[{
					model: models.boarddetail,
					where: language.buildLanguageQuery({}, reqData.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'),
					attributes: ['alias']
				}]
			},
			{
				model: models.classes,
				attributes: ['id'],
				include:[{
					model: models.classesdetail,
					where: language.buildLanguageQuery({}, reqData.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'),
					attributes: ['name']
				}]
			},
			{
				model: models.section,
				attributes: ['id'],
				include:[{
					model: models.sectiondetail,
					where: language.buildLanguageQuery({}, reqData.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'),
					attributes: ['name']
				}]
			}
		];

		Promise.all([models.bcsmap.findAll({
			where: {masterId: reqData.masterId},
			include: bcsInclude1,
			attributes: ['id'],
			distinct: true,
			order: [
				['id', 'DESC']
			]
		}),
		models.studentleave.findAndCountAll({
			include: [
				{model: models.tag, required:false, include: [{model: models.tagdetail, where:isWhere.tagdetail, required:false}]},
				{model: models.user, include:
					[
						{model: models.userdetail, where:isWhere.userdetail},
						{
							model: models.student,
							include: [{
								model: models.studentrecord,
								where: {
									academicSessionId: reqData.academicSessionId
								},
								attributes: ['roll_no']
							}],
							attributes: ['id']
						}
					]
				},
				{model: models.bcsmap, include: bcsInclude2, attributes: ['id']}
			],
			where: isWhere.studentleave,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, subQuery: false
		})]).then(function(result){
			var totalData = result[1].count;
			var pageCount = Math.ceil(totalData / setPage);
			res({
				status:true,
				message:language.lang({key:"leaveRecord", lang:req.lang}),
				data:result[1].rows,
				totalData: totalData,
				pageCount: pageCount,
				pageLimit: setPage,
				currentPage:currentPage,
				classes: result[0]
			});
		});
	};





	/*
	 * Leave Tags
	*/
	this.leaveTags = function(req, res) {
		models.tag.hasMany(models.tagdetail);
		models.tag.findAll({
			include: [
				{model: models.tagdetail, where: language.buildLanguageQuery({}, req.langId, 'tag.id', models.tagdetail, 'tagId')},
			],
			where:{type:2, masterId:req.masterId}
		}).then(function(data){
			res({status:true, message:language.lang({key:"tagRecord", lang:req.lang}), data:data});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};


	/*
	 * status update for student
	*/
	this.st_status = function(req, res) {
		var date = moment(req.date).format('YYYY-MM-DD');
		models.studentleave.find({where:{id:req.id}}).then(function(result){
			var enddate = moment(result.end_date).format('YYYY-MM-DD');
			if (moment(date).isBefore(enddate)) {
				models.studentleave.update(req,{where:{id:req.id}}).then(function(data){
					res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			} else {
				res({status:false, message:language.lang({key:"notCancelBackDateLeave", lang:req.lang}), data:[]});
			}
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	/*
	 * status update
	*/
	this.status = function(req, res) {
		models.studentleave.find({where:{id:req.id}}).then(function(result){
			var date = moment(req.date).format('YYYY-MM-DD');
			var enddate = moment(result.end_date).format('YYYY-MM-DD');
			if (moment(date).isSameOrBefore(enddate)) {
				models.studentleave.update(req,{where:{id:req.id}}).then(function(data){
					var sendData = {
						masterId:result.masterId, 
						userId:result.userId, 
						start_date:result.start_date, 
						end_date:result.end_date, 
						leavestatus:req.leavestatus, 
						lang: req.lang,
						senderId:req.status_updatedby
					};
					module.exports.notification(sendData);
					module.exports.sendSMS(sendData, function(){
						res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
					});
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			} else {
				res({status:false, message:language.lang({key:"notChangeBackDateLeave", lang:req.lang}), data:[]});
			}
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.sendSMS = function(req, res){
		//console.log(req);
		models.student.belongsTo(models.user);
		models.institute.belongsTo(models.country);
		models.student.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
		models.student.find({
			include: [{
				model: models.institute,
				attributes: ['id'],
				include: [{
					model: models.country,
					attributes: ['code']
				}]
			}, {
				model: models.user,
				attributes: ['mobile']
			}],
			attributes: ['id'],
			where: {
				userId:req.userId,
				masterId: req.masterId
			}
		})
			.then(student => {
			//console.log(student);
				sms.leaveStatusSMS(
					filterMobileNumber(student.institute.country.code + student.user.mobile),
					{leavestatus: req.leavestatus, start_date:req.start_date, end_date:req.end_date, lang: req.lang},
					student.institute.sms_provider,
					req.masterId
				);
				res({status:true});
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.notification = function(data){
		Promise.all([
			models.sequelize.query(
				"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
				WHERE `users`.`id` = ?",
				{replacements:[data.userId], type: models.sequelize.QueryTypes.SELECT}
			),
			models.sequelize.query(
				"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
				WHERE FIND_IN_SET (`mobile`, (SELECT GROUP_CONCAT(`father_contact`,',',`father_contact_alternate`,',', \
				`mother_contact`,',',`mother_contact_alternate`,',',`guardian_contact`,',',`guardian_contact_alternate`) AS `mob`\
				FROM `students` \
				WHERE `students`.`userId` = ?))\
				AND `users`.`user_type` = 'parent' GROUP BY `users`.`device_id`",
				{replacements:[data.userId], type: models.sequelize.QueryTypes.SELECT}
			)
		]).then(function(result){
			var notiData = {};
			notiData.lang = data.lang;
			notiData.start_date = data.start_date;
			notiData.end_date = data.end_date;
			notiData.leavestatus = data.leavestatus;
			notiData.moment = moment;
			notification.send(result[0], 'front/notification/studentleave/student', notiData, {masterId:data.masterId, senderId:data.senderId, data:{type:'studentleave'}});
			notification.send(result[1], 'front/notification/studentleave/parent', notiData, {masterId:data.masterId, senderId:data.senderId, data:{type:'studentleave'}});
		});
	};

	this.view = function(req, res) {
		models.studentleave.belongsTo(models.tag);
		models.studentleave.belongsTo(models.user);
		models.user.hasOne(models.student);
		models.student.hasOne(models.studentrecord);
		models.user.hasMany(models.userdetail);
		models.tag.hasMany(models.tagdetail);
		models.studentleave.belongsTo(models.bcsmap, {foreignKey:'bcsMapId'});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		var  isWhere = {};
		isWhere.tagdetail = language.buildLanguageQuery(
			isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
		);
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
		);

		const bcsInclude = [
			{
				model: models.board,
				attributes: ['id'],
				include:[{
					model: models.boarddetail,
					where: language.buildLanguageQuery({}, req.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'),
					attributes: ['alias']
				}]
			},
			{
				model: models.classes,
				attributes: ['id'],
				include:[{
					model: models.classesdetail,
					where: language.buildLanguageQuery({}, req.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'),
					attributes: ['name']
				}]
			},
			{
				model: models.section,
				attributes: ['id'],
				include:[{
					model: models.sectiondetail,
					where: language.buildLanguageQuery({}, req.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'),
					attributes: ['name']
				}]
			}
		];
		models.studentleave.find({
			include: [
				{model: models.tag, required:false, include: [{model: models.tagdetail, where:isWhere.tagdetail, required:false}]},
				{model: models.user, include:
					[
						{model: models.userdetail, where:isWhere.userdetail, attributes:['fullname']},
						{
							model: models.student,
							include: [{
								model: models.studentrecord,
								where: {
									academicSessionId: req.academicSessionId
								},
								attributes: ['roll_no']
							}],
							attributes: ['id']
						}
					],
				attributes:['id']
				},
				{model: models.bcsmap, include: bcsInclude, attributes: ['id']}
			],
			where: {
				id:req.id
			}
		}).then(function(data){
			res({data:data});
		});
	};
}

module.exports = new Studentleave();
