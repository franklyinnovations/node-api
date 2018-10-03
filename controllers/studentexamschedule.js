var async = require('async');
const models = require('../models');
var language = require('./language');

function Examschedule() {
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
		var reqData = req.body.data ? JSON.parse(req.body.data) : req.body;
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			responseData.examschedule = {masterId:reqData.masterId, academicSessionId:reqData.academicSessionId, boardId:reqData.boardId, classId:reqData.classId,};
			responseData.examheaddetail = {};
			responseData.classesdetail = {};
			responseData.boarddetail = {};
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
		orderBy = 'id DESC';

		models.examschedule.hasMany(models.examscheduledetail);
		models.examschedule.belongsTo(models.examhead);
		models.examhead.hasMany(models.examheaddetail);
		models.examscheduledetail.belongsTo(models.subject);
		models.examscheduledetail.hasMany(models.examsyllabus);
		models.subject.hasMany(models.subjectdetail);
		models.examschedule.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.examschedule.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);

		isWhere.examheaddetail = language.buildLanguageQuery(
			isWhere.examheaddetail, reqData.langId, '`examhead`.`id`', models.examheaddetail, 'examheadId'
		);
		isWhere.boarddetail = language.buildLanguageQuery(
			isWhere.boarddetail, reqData.langId, '`board`.`id`', models.boarddetail, 'boardId'
		);
		isWhere.classesdetail = language.buildLanguageQuery(
			isWhere.classesdetail, reqData.langId, '`class`.`id`', models.classesdetail, 'classId'
		);

		models.examschedule.findAndCountAll({
			include: [
				{model: models.examhead, include:[{model: models.examheaddetail, where:isWhere.examheaddetail}]},
				{model: models.board, include:[{model: models.boarddetail, where:isWhere.boarddetail}]},
				{model: models.classes, include:[{model: models.classesdetail, where:isWhere.classesdetail}]},
				{ 
					model: models.examscheduledetail, 
					required:false, 
					include:[
						{
							model: models.examsyllabus, 
							attributes: ['syllabus'], 
							required: false, 
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`examscheduledetails`.`id`',
								models.examsyllabus,
								'examscheduledetailId'
							)
						},
						{
							model: models.subject, 
							required:false, 
							attributes:['id'], 
							include:[
								{
									model: models.subjectdetail, 
									attributes:['id', 'name'], 
									required:false, 
									where:isWhere.subjectdetail
								}
							]
						}
					]
				}
			],
			where: isWhere.examschedule,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);
			res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: reqData.lang}), url: true}));
	};

	this.examSchedule = function(req, res){
		models.examschedule.hasMany(models.examscheduledetail);
		models.examscheduledetail.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		models.examscheduledetail.hasMany(models.examsyllabus);
		models.examschedule.find({
			include:[
				{ model: models.examscheduledetail, required:false,
					include:[
						{model: models.examsyllabus, attributes: ['syllabus'], required: false, where: language.buildLanguageQuery({},req.langId,'`examscheduledetails`.`id`',models.examsyllabus,'examscheduledetailId')},
						{model: models.subject, required:false, attributes:['id'],
							include:[{model: models.subjectdetail, attributes:['id', 'name'], required:false,
								where: language.buildLanguageQuery({}, req.langId, '`examscheduledetails.subject`.`id`', models.subjectdetail, 'subjectId')}
							]}
					]}
			],
			attributes:['id'],
			order: [
				[models.examscheduledetail, 'date', 'ASC'],
				[models.examscheduledetail, 'start_time', 'ASC']
			],
			where:{is_active:1, masterId:req.masterId, boardId:req.boardId, classId:req.classId, academicSessionId:req.academicSessionId, examheadId:req.examheadId}
		}).then(function(examschedules){
			var data = (examschedules && examschedules.examscheduledetails) || [];
			res({
				status:true,
				message:language.lang({
					key: data.length ? "examScheduleList" : "No exam schedule found",
					lang:req.lang
				}),
				data
			});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	};

	this.viewSchedule = function(req, res){
		models.examschedule.hasMany(models.examscheduledetail);
		models.examscheduledetail.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		models.examscheduledetail.hasMany(models.examsyllabus);
		
		var isWhere = {};
		isWhere.subjectdetail = language.buildLanguageQuery(
			isWhere.subjectdetail, req.langId, '`examscheduledetails.subject`.`id`', models.subjectdetail, 'subjectId'
		);

		models.examschedule.find({
			include:[
				{ model: models.examscheduledetail, required:false, 
					include:[
						{model: models.examsyllabus, attributes: ['syllabus'], required: false, where: language.buildLanguageQuery({},req.langId,'`examsyllabus`.`id`',models.examsyllabus,'examscheduledetailId')},
						{model: models.subject, required:false, attributes:['id'], include:[{model: models.subjectdetail, attributes:['id', 'name'], required:false, where:isWhere.subjectdetail}]}
					]
				}
			],
			attributes:['id'],
			order: [[models.examscheduledetail, 'date', 'ASC'], [models.examscheduledetail, 'start_time', 'ASC'], [models.examscheduledetail, 'id', 'ASC']],
			where:{masterId:req.masterId, academicSessionId:req.academicSessionId, id:req.id}
		}).then(function(examschedules){
			res({examschedules:examschedules});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: req.lang}), url: true}));
	};

	this.viewSyllabus = function(req, res){
		models.examscheduledetail.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		models.examscheduledetail.hasMany(models.examsyllabus);
		
		var isWhere = {};
		isWhere.subjectdetail = language.buildLanguageQuery(
			isWhere.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
		);

		models.examscheduledetail.find({
			include:[
				{model: models.examsyllabus, attributes: ['syllabus'], required: false, where: language.buildLanguageQuery({},req.langId,'`examsyllabus`.`id`',models.examsyllabus,'examscheduledetailId')},
				{model: models.subject, required:false, attributes:['id'], include:[{model: models.subjectdetail, attributes:['id', 'name'], required:false, where:isWhere.subjectdetail}]}
			],
			attributes:['id'],
			where:{masterId:req.masterId, id:req.id}
		}).then(function(examschedule){
			res({examschedule:examschedule});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: req.lang}), url: true}));
	};

}

module.exports = new Examschedule();
