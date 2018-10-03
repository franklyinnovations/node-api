var async = require('async');
const models = require('../models');
var language = require('./language');
var userCont = require('./users');
var oauth = require('./oauth');
var mail = require('./mail');
var sms = require('./sms');
var bcrypt = require('bcrypt-nodejs');
var randomstring = require("randomstring");
var moment = require('moment');

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


function Transportemp(){
	/*
	* save
	*/
	this.save = function(req, res){
		if (typeof req.is_active === 'undefined') {
		  req.is_active = 0;
		}
		 if (! req.govt_identity_image && req.user_type === 'driver') req.govt_identity_image = '';
		 if (! req.govt_identity_expiry && req.user_type === 'helper') req.govt_identity_expiry = null;
		var UserHasOne = models.user.hasOne(models.userdetail, {as: 'user_detail'});
		req.user_detail.languageId = req.langId;
		var passwordForMail = req.password;
		var user = models.user.build(req);
		var userDetails = models.userdetail.build(req.user_detail);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([
			function (callback) {
				user.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}

				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function (callback) {
				userDetails.validate().then(function (err) {
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
				if (req.is_active === 0) {
				  oauth.removeToken({id:req.id}, function(){});
				}
				if (typeof req.password !== 'undefined') {
				  req.password = bcrypt.hashSync(req.password, null, null);
				}
				req.user_detail.userId = req.id;
				models.user.update(req,{where: {id:req.id}, individualHooks: true}).then(function(data){
				  models.userdetail.find({where:{userId:req.id,languageId:req.langId}}).then(function(resultData){
					if (resultData !==null) {
					  req.user_detail.id = resultData.id;
					  models.userdetail.update(req.user_detail, {where:{id:resultData.id, userId:req.id,languageId:req.langId}}).then(function(){
						res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
					  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					} else {
					  delete req.user_detail.id;
					  models.userdetail.create(req.user_detail).then(function(){
						res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
					  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					}
				  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			  } else {
				var langId = parseInt(req.user_detail.languageId);
				userCont.createUserName({fullname:req.user_detail.fullname}, function(username){
				  req.user_name = username;
				  models.user.create(req, {
					include: [UserHasOne],
					individualHooks: true,
				  }).then(function(data){
					data.set('password', bcrypt.hashSync(data.user_name, null, null));
					return data.save().then(() => data);
				  })
				  .then(data => {
					//-------------SMS---------------
					models.institute.belongsTo(models.country);
					models.institute.findOne({
						include: [{
							model: models.country,
							attributes: ['code']
						}],
						where: {
							userId: req.masterId
						},
						attributes: ['sms_provider']
					}).then(institute => sms.sendEmpRegistrationSMS(
						filterMobileNumber(institute.country.code + req.mobile), {
							link: req.loginUrl,
							username: data.user_name,
							password: data.user_name,
							lang: req.lang,
							institute_name: req.institute_name,
						},
						institute.sms_provider,
						req.masterId
					));
				  	//-------------SMS---------------
					if (langId === 1) {
					  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
					} else {
					  req.user_detail.userId = data.id;
					  req.user_detail.languageId = 1;
					  models.userdetail.create(req.user_detail).then(function(){
						res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
					  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					}
				  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			  });

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
		//var data = JSON.parse(req.body.data);

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
			responseData.user = {masterId:reqData.masterId};
			responseData.user.id ={$ne:1};
			responseData.user.user_type = {$in:['driver', 'helper']};
			async.forEach(Object.keys(req.query), function (item, callback) {
				if (req.query[item] !== ''){
					var modelKey = item.split('__');

					if(modelKey[1] == 'user_type' && req.query[item] !== 'driver' && req.query[item] !== 'helper'){
						req.query[item] = '%20';
					}

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

		models.user.hasMany(models.userdetail);
		
		isWhere.userdetail = language.buildLanguageQuery(
		 	isWhere.userdetail, reqData.langId, 'user.id', models.userdetail, 'userId'
		);

		models.user.findAndCountAll({
			include: [
				{
					model: models.userdetail,
					where:isWhere.userdetail
				},
			],
			where: isWhere.user,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag,
			subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);
			res({
				data:result.rows, 
				totalData: totalData,
				pageCount: pageCount,
				pageLimit: setPage,
				currentPage:currentPage
			});
		}).catch(() => res({
			status:false,
			error: true,
			error_description: language.lang({key: "Internal Error", lang: reqData.lang}),
			url: true
		}));
	};

	/*
	* get By ID
	*/
	this.getById = function(req, res) {
		var isWhere = {};
		isWhere = language.buildLanguageQuery(
		isWhere, req.langId, 'user.id', models.userdetail, 'userId'
		);
		models.user.hasMany(models.userdetail);
		models.user.find({
			include: [{
				model: models.userdetail, where:isWhere
			}], 
			where:{
				id:req.id,
				masterId: req.masterId
			}
		}).then(function(data){
			res(data);
		});
	};

	/*
	* status update
	*/
	this.status = function(req, res) {
		models.user.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
			oauth.removeToken(req, function(result){
				res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
			});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.remove = async req => {
		try {
			await models.user.destroy({where: {id: req.id}});
		} catch (err) {
		  return {
				status: false,
				message: language.lang({key: 'Can not delete user, It is being used.'}),
		  }
		}

		return {
			status: true,
			message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
		};
	};
}
module.exports = new Transportemp();
