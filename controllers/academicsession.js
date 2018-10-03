var async = require('async');
const models = require('../models');
var language = require('./language');

function Academicsession() {
	/*
	 * save
	*/
	this.save = function(req, res){
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}
		var AcademicsessionHasOne = models.academicsession.hasOne(models.academicsessiondetail, {as: 'academicsession_detail'});
		req.academicsession_detail.languageId = req.langId;
		req.academicsession_detail.masterId = req.masterId;
		var academicsession = models.academicsession.build(req);
		var academicsessionDetails = models.academicsessiondetail.build(req.academicsession_detail);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([
			function (callback) {
				academicsession.validate().then(function (err) {
								if (err !== null) {
										errors = errors.concat(err.errors);
										callback(null, errors);
								} else {
										callback(null, errors);
								}

						});
				},
				function (callback) {
						academicsessionDetails.validate().then(function (err) {
								if (err !== null) {
										errors = errors.concat(err.errors);
										callback(null, errors);
								} else {
										callback(null, errors);
								}
						});
				}
		], function (err, errors) {
				var merged = [].concat.apply([], errors);
				var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
				if (uniqueError.length === 0) {
					if (typeof req.id !== 'undefined' && req.id !== '') {
						req.academicsession_detail.academicSessionId = req.id;
						models.academicsession.update(req,{where: {id:req.id}}).then(function(data){
							models.academicsessiondetail.find({where:{academicSessionId:req.id,languageId:req.langId}}).then(function(resultData){
								if (resultData !==null) {
									req.academicsession_detail.id = resultData.id;
									models.academicsessiondetail.update(req.academicsession_detail, {where:{id:resultData.id, academicSessionId:req.id,languageId:req.langId}}).then(function(){
										res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
									});
								} else {
									delete req.academicsession_detail.id;
									models.academicsessiondetail.create(req.academicsession_detail).then(function(){
										res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
									}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
								}
							});
						});
					} else {
						var langId = parseInt(req.academicsession_detail.languageId);
						models.academicsession.create(req, {include: [AcademicsessionHasOne]}).then(function(data){
							module.exports.setSession({masterId:req.masterId, id:data.id}, function(setSession){
								module.exports.getAllSessions({masterId:req.masterId, languageId:langId}, function(academicSession){
									if (langId === 1) {
										res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data, academicSession: academicSession});
									} else {
										req.academicsession_detail.academicSessionId = data.id;
										req.academicsession_detail.languageId = 1;
										models.academicsessiondetail.create(req.academicsession_detail).then(function(){
											res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data, academicSession: academicSession});
										}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
									}
								});
							});
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


	this.getAllSessions = function(req, res){
		var isWhere = {};
		models.academicsession.hasMany(models.academicsessiondetail);
		isWhere.academicsessiondetail = language.buildLanguageQuery(
			isWhere.academicsessiondetail, req.languageId, '`academicsession`.`id`', models.academicsessiondetail, 'academicsessionId'
		);
		models.academicsession.findAll(
			{
				where:{masterId:req.masterId, is_active:1}, 
				attributes:['id', 'start_date', 'end_date'], 
				include: [
				{
					model: models.academicsessiondetail, 
					where:isWhere.academicsessiondetail, 
					attributes:['name']
				}], 
				order: [['id', 'DESC']]
			}).then(function(sessionData){
			if (sessionData.length !== 0) {
				res(sessionData);
			} else {
				models.academicsession.findAll(
					{
						where:{masterId:req.masterId, is_active:1}, 
						attributes:['id', 'start_date', 'end_date'], 
						include: [
						{
							model: models.academicsessiondetail, 
							where:{languageId:1}, 
							attributes:['name']
						}]}).then(function(sessionData){
				 res(sessionData);
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			}
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};


	this.setSession = function(req, res){
		models.user.find({
			attributes:['id', 'defaultSessionId'],
			where:{id:req.masterId}
		}).then(function(result){
			if(result.defaultSessionId === -1){
				models.user.update({
					defaultSessionId:req.id
				},{
					where:{id:result.id}
				}).then(function(resultData){
					res(resultData);
				}).catch(() => res({
					status:false, 
					error: true, 
					error_description: language.lang({key: "Internal Error", lang: req.lang}), 
					url: true
				}));
			} else {
				res(result);
			}
		}).catch(() => res({
			status:false, 
			error: true, 
			error_description: language.lang({key: "Internal Error", lang: req.lang}), 
			url: true
		}));
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
			responseData.academicsession = {masterId:reqData.masterId};
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

		models.academicsession.hasMany(models.academicsessiondetail);
		
		isWhere.academicsessiondetail = language.buildLanguageQuery(
			isWhere.academicsessiondetail, reqData.langId, '`academicsession`.`id`', models.academicsessiondetail, 'academicsessionId'
		);
		Promise.all([
			models.academicsession.findAndCountAll({
				include: [
					{model: models.academicsessiondetail, where:isWhere.academicsessiondetail}
				],
				where: isWhere.academicsession,
				order: [
					['id', 'DESC']
				],
				distinct: true,
				limit: setPage,
				offset: pag, subQuery: false
			}),
		])
		.then(([result]) => {
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);
			res({
				data:result.rows,
				totalData: totalData,
				pageCount: pageCount, 
				pageLimit: setPage,
				currentPage:currentPage,
			});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	};

	/*
	 * get By ID
	*/
 this.getById = function(req, res) {
		models.academicsession.hasMany(models.academicsessiondetail);
		var isWhere = {};
		isWhere = language.buildLanguageQuery(
			isWhere, req.langId, '`academicsession`.`id`', models.academicsessiondetail, 'academicsessionId'
		);
		models.academicsession.find({
			include: [
			{model: models.academicsessiondetail, 
				where:isWhere
			}], 
			where:{
				id:req.id,
				masterId: req.masterId
			}}).then(function(data){
			res(data);
		}).catch(() => res(
			{status:false, 
				error: true, 
				error_description: language.lang({key: "Internal Error", lang: req.lang}), 
				url: true
			}
		));
	};

	/*
	 * get All Academicsession
	*/
 this.getAllAcademicsession = function(req, res) {
		models.academicsession.hasMany(models.academicsessiondetail);
		var isWhere = {};
		isWhere = language.buildLanguageQuery(
			isWhere, req.langId, '`academicsession`.`id`', models.academicsessiondetail, 'academicsessionId'
		);
		models.academicsession.findAll({include: [{model: models.academicsessiondetail, where:isWhere}],  where:{is_active:1, masterId:req.id}, order: [['id', 'DESC']]}).then(function(data){
			res(data);
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	/*
	 * status update
	*/
 this.status = function(req, res) {
		models.academicsession.update(
			req,
			{
				where:{id:req.id, masterId: req.masterId}
		}).then(function(data){
			module.exports.getAllSessions({masterId:req.masterId, languageId:req.langId}, function(academicSession){
				res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data, academicSession:academicSession});
			});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.remove = async req => {
		try {
			await models.academicsession.destroy({where: {id: req.id}});
		} catch (err) {
			return {
				status: false,
				message: language.lang({key: 'Can not delete academic session, It is being used.'}),
			};
		}

		return new Promise(resolve => {
			module.exports.getAllSessions({masterId:req.masterId, languageId:req.langId}, function(academicSession){
				resolve({
					status: true,
					message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
					academicSession:academicSession
				});
			});
		});
	};
}

module.exports = new Academicsession();
