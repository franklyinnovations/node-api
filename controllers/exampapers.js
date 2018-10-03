var async = require('async');
const models = require('../models');
var language = require('./language');
var utils = require('./utils');

function ExamPapers() {
	
	/*
	 * save
	*/
	this.save = function(req, res) {
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}

		req.is_published = 0;
		req.languageId = req.langId;
		var exampaperHasOne = models.exampaper.hasOne(models.exampaperdetail, {as: 'exam_paper_details'});
		var exampaperHasMany = models.exampaper.hasMany(models.exampapersection, {as: 'exam_paper_sections'});
		req.exam_paper_sections = [];
		if(req.sections.length > 0) {
			async.forEachOf(req.sections, function (iterationData, iterationKey, secCallback) {
				req.exam_paper_sections.push({section_title: iterationData,languageId: req.langId});
			});
		}

		//req.published_date = moment(req.published_date, "DD-MM-YYYY").format('YYYY-MM-DD');

		req.exam_paper_details = {};
		req.exam_paper_details.languageId = req.langId;
		req.exam_paper_details.masterId = req.masterId;
		req.exam_paper_details.paper_title = req.paper_title;
		req.exam_paper_details.tags_for_search = req.tags_for_search;
		req.exam_paper_details.comments = req.comments;

		var exam_paper_build = models.exampaper.build(req);
		var exam_paper_detail_build = models.exampaperdetail.build(req.exam_paper_details);
		var errors = [];

		async.parallel([
			function (callback) {
				exam_paper_build.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function (callback) {
				exam_paper_detail_build.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
			if (uniqueError.length === 0) {
				if (typeof req.id !== 'undefined' && req.id !== '') {
					req.exam_paper_details.examPaperId = req.id;
					models.exampaper.update(req,{where: {id:req.id}, individualHooks: true}).then(function(data){
						models.exampaperdetail.find({where:{examPaperId:req.id,languageId:req.langId}}).then(function(resultData){
							if (resultData !==null) {
								req.exam_paper_details.id = resultData.id;
								models.exampaperdetail.update(req.exam_paper_details, {where:{id:resultData.id, examPaperId:req.id,languageId:req.langId}}).then(function(){
									res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
								}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
							} else {
								//delete req.exam_paper_details.id;
								models.exampaperdetail.create(req.exam_paper_details).then(function(){
									res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
								}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
							}
						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
				} else {
					delete req.id;
					var langId = parseInt(req.exam_paper_details.languageId);
					models.exampaper.create(req, {include: [exampaperHasOne, exampaperHasMany], individualHooks: true}).then(function(data){
						if (langId === 1) {
							res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
						} else {
							req.exam_paper_details.examPaperId = data.id;
							req.exam_paper_details.languageId = 1;
							models.exampaperdetail.create(req.exam_paper_details).then(function(){
								res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						}
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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

	/*
	 * list
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
		if (req.query) {
			var responseData = {};
			responseData.exampaper = {masterId:reqData.masterId, academicSessionId: reqData.academicSessionId};
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

		models.exampaper.hasMany(models.exampaperdetail);
		isWhere.exampaperdetail = language.buildLanguageQuery(
			isWhere.exampaperdetail, reqData.langId, '`exampaper`.`id`', models.exampaperdetail, 'examPaperId'
		);

		var mapped_questions = models.exampaper.hasMany(models.mappingexampaperquestion, {foreignKey: 'examPaperId', as: 'mapped_questions'})
		models.exampaper.findAndCountAll({
			include: [
				{model: models.exampaperdetail, where:isWhere.exampaperdetail, group:['examPaperId']},
				mapped_questions  
			],
			where: isWhere.exampaper,
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
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	};

	/*
	 * get By ID
	 */
	this.getById = function(req, res) {
		var isWhere = {};
		isWhere.exampaperdetail = language.buildLanguageQuery(
			isWhere.exampaperdetail, req.langId, '`exampaper`.`id`', models.exampaperdetail, 'examPaperId'
		);
		isWhere.exampapersection = language.buildLanguageQuery(
			isWhere.exampapersection, req.langId, '`exampaper`.`id`', models.exampapersection, 'examPaperId'
		);

		models.exampaper.hasMany(models.exampaperdetail);
		models.exampaper.hasMany(models.exampapersection);
		models.exampaper.find({
			include: [{model: models.exampaperdetail, where:isWhere.exampaperdetail}, {model: models.exampapersection, where:isWhere.exampapersection, required: false}],
			where:{
				id:req.id,
				masterId: req.masterId
			}
		}).then(function(data){
			let classFunc = req.user_type === "teacher" ? "getAllbcsByTeacher" : "getAllbcsByInstitute";
			let subjectFunc = req.user_type === "teacher" ? "getSubjectByTeacher" : "getSubjectByInstitute";

			utils[classFunc]({academicSessionId: req.academicSessionId, masterId: req.masterId, langId: req.langId, userId: req.userId}, function(classes) {
				utils[subjectFunc]({academicSessionId: req.academicSessionId, masterId: req.masterId, langId: req.langId, bcsMapId: data.classId, userId: req.userId}, function(subjects) {
					res({data: data, classes: classes, subjects: subjects})
				})
			})

			//res(data);
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	/*
	 * status update
	 */
	this.status = function(req, res) {
		models.exampaper.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
			res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	/*
	 * publish status update
	 */
	this.publishStatus = function(req, res) {
		models.exampaper.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
			res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.listForMapQustion = function(req, res) {
		//required -------      masterId | languageId | userId | classId | subjectId 
		
		var isWhere = {};
		isWhere.exampaper = {
			masterId: req.masterId,
			academicSessionId: req.academicSessionId,
			languageId: req.langId,
			classId: req.classId,
			subjectId: req.subjectId,
			is_active: 1
		}
		
		models.exampaper.hasMany(models.exampaperdetail);
		isWhere.exampaperdetail = language.buildLanguageQuery(
			isWhere.exampaperdetail, req.langId, '`exampaper`.`id`', models.exampaperdetail, 'examPaperId'
		);

		models.exampaper.hasMany(models.exampapersection);
		isWhere.exampapersection = language.buildLanguageQuery(
			isWhere.exampapersection, req.langId, '`exampaper`.`id`', models.exampapersection, 'examPaperId'
		);
		
		models.exampaper.findAll({
			include: [{model: models.exampaperdetail, where:isWhere.exampaperdetail}, {model: models.exampapersection, where:isWhere.exampapersection, required: false}],
			where:isWhere.exampaper
		}).then(function(data){
			res(data);
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.getMappedQuestion = function(req, res) {
		var isWhere = {};

		var questions = models.mappingexampaperquestion.belongsTo(models.question, {foreignKey: 'questionId', as: 'question'})
		var questionDetail = models.mappingexampaperquestion.belongsTo(models.question, {foreignKey: 'questionId', as: 'question'})

		models.question.hasMany(models.questiondetail);
		models.mappingexampaperquestion.belongsTo(models.exampapersection);
		isWhere.questiondetail = language.buildLanguageQuery(
			isWhere.questiondetail, req.langId, '`question`.`id`', models.questiondetail, 'questionId'
		);
		models.question.hasMany(models.questionoption);

		models.question.belongsTo(models.questioncontroltype, {foreignKey: 'questionControlTypeId', targetKey: 'id'});
		models.questioncontroltype.hasMany(models.questioncontroltypedetail, {foreignKey: 'questionControlTypeId', sourceKey: 'id'});
		isWhere.questioncontroltypedetail = language.buildLanguageQuery(
			isWhere.questioncontroltypedetail, req.langId, '`question_control_type`.`id`', models.questioncontroltypedetail, 'questionControlTypeId'
		);

		models.mappingexampaperquestion.findAll({
			include: [
				{
					association: questions,
					include: [
						{model: models.questiondetail, where:isWhere.questiondetail, group:['questionId'], required: false},
						{model: models.questionoption, where:{}, group:['questionId'], required: false},
						{model: models.questioncontroltype, where:{}, include: [{model: models.questioncontroltypedetail, where: isWhere.questioncontroltypedetail}]},
					]
				},
				{model: models.exampapersection, required: false},
			],
			where: {
				examPaperId: req.id,
				masterId: req.masterId,
				languageId: req.langId
			},
			order: [
				['id', 'DESC']
			],
		}).then(function(result){
			res({data:result});
		});
	};

	this.getCountOfMappedQuestion = function(req, res) {
		models.mappingexampaperquestion.count({
			where: {
				examPaperId: req.examPaperId,
				masterId: req.masterId,
				languageId: req.langId
			}
		}).then(function(result){
			res({count:result});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.remove = async req => {
		try {
			await models.exampaper.destroy({where: {id: req.id}});
		} catch (err) {
			return {
				status: false,
				message: language.lang({key: 'Can not delete exam paper, It is being used.'}),
			};
		}

		return {
			status: true,
			message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
		};
	};
}

module.exports = new ExamPapers();
