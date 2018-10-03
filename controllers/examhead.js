var async = require('async');
const models = require('../models');
var language = require('./language');

function Examhead() {
	/*
	 * save
	*/
	this.save = function(req, res){
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}
		if (typeof req.classId === 'undefined') {
			req.classId = '';
		}
		models.examheaddetail.belongsTo(models.examhead);
		var examheadHasOne = models.examhead.hasOne(models.examheaddetail, {as: 'examheaddetail'});
		req.examheaddetail.languageId = req.langId;
		req.examheaddetail.masterId = req.masterId;
		var examhead = models.examhead.build(req);
		var examheadDetails = models.examheaddetail.build(req.examheaddetail);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([
				function (callback) {
						examhead.validate().then(function (err) {
								if (err !== null) {
										errors = errors.concat(err.errors);
										callback(null, errors);
								} else {
										callback(null, errors);
								}
						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
				},
				function (callback) {
						examheadDetails.validate().then(function (err) {
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
					if (typeof req.id !== 'undefined' && req.id !== '') {
						req.examheaddetail.examheadId = req.id;
						models.examhead.update(req,{where: {id:req.id}}).then(function(data){
							models.examheaddetail.find({where:{examheadId:req.id,languageId:req.langId}}).then(function(resultData){
								if (resultData !==null) {
									req.examheaddetail.id = resultData.id;
									models.examheaddetail.update(req.examheaddetail, {where:{id:resultData.id, examheadId:req.id,languageId:req.langId}}).then(function(){
										res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
									}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
								} else {
									delete req.examheaddetail.id;
									models.examheaddetail.create(req.examheaddetail).then(function(){
										res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
									}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
								}
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					}else {
						var langId = parseInt(req.examheaddetail.languageId);
						models.examhead.create(req, {include: [examheadHasOne]}).then(function(data){
							if (langId === 1) {
								res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
							} else {
								req.examheaddetail.examheadId = data.id;
								req.examheaddetail.languageId = 1;
								models.examheaddetail.create(req.examheaddetail).then(function(){
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
			responseData.examhead = {masterId:reqData.masterId};
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

		models.examhead.hasMany(models.examheaddetail);
		isWhere.examheaddetail = language.buildLanguageQuery(
			isWhere.examheaddetail, reqData.langId, '`examhead`.`id`', models.examheaddetail, 'examheadId'
		);
		models.examhead.findAndCountAll({
			include: [
				{model: models.examheaddetail, where:isWhere.examheaddetail},
			],
			where: isWhere.examhead,
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
		models.examhead.hasMany(models.examheaddetail);
		var isWhere = {};
		isWhere.examheaddetail = language.buildLanguageQuery(
			isWhere.examheaddetail, req.langId, '`examhead`.`id`', models.examheaddetail, 'examheadId'
		);
		models.examhead.find({
			include: [
				{model: models.examheaddetail, where:isWhere.examheaddetail},
			],
			where:{
				id:req.id,
				masterId: req.masterId
			}
		}).then(function(data){
			res(data);
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.getAllExamheads = function(req, res){
		models.examhead.hasMany(models.examheaddetail);
		var isWhere = {};
		isWhere.examheaddetail = language.buildLanguageQuery(
			isWhere.examheaddetail, req.langId, '`examhead`.`id`', models.examheaddetail, 'examheadId'
		);
		models.examhead.findAll({
			include: [
				{model: models.examheaddetail, where:isWhere.examheaddetail}
			],
			where:{masterId:req.masterId, is_active:1}
		}).then(function(data){
			res({status:true, data:data});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	/*
	 * status update
	*/
 this.status = function(req, res) {
		models.examhead.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
			res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};
	this.remove = async req => {
		try {
			await models.examhead.destroy({where: {id: req.id}});
		} catch (err) {
			return {
				status: false,
				message: language.lang({key: 'Can not delete exam group, It is being used.'}),
			};
		}

		return {
			status: true,
			message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
		};
	};
}

module.exports = new Examhead();
