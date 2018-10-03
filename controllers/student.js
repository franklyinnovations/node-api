var async = require('async');
const models = require('../models');
var language = require('./language');
var bcrypt = require('bcrypt-nodejs');
var mail = require('./mail');
var userController = require('./users');
var oauth = require('./oauth');
var sms = require('./sms');
var randomstring = require('randomstring');
var moment = require('moment');
var country = require('./country');
var state = require('./state');
var city = require('./city');
var utils = require('./utils');
var route = require('./route');
var role = require('./role');
var feediscount = require('./feediscount');

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

models.student.hasMany(models.studentdetail);
models.student.belongsTo(models.user);
models.user.hasMany(models.userdetail);
models.student.hasOne(models.studentrecord);

function Student() {
	/*
	 * save
	*/
	this.save = function(req, res){
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}

		if (typeof req.student.is_health_issue === 'undefined') {
			req.student.is_health_issue = 0;
			req.studentdetails.health_issue_detail = '';
		}
		req.studentdetails.is_health_issue = req.student.is_health_issue;
		
		if (typeof req.student.is_allergies === 'undefined') {
			req.student.is_allergies = 0;
			req.studentdetails.allergies_detail = '';
		}
		req.studentdetails.is_allergies = req.student.is_allergies;

		if (typeof req.student.is_medicine === 'undefined') {
			req.student.is_medicine = 0;
			req.studentdetails.medicine_detail = '';
		}
		req.studentdetails.is_medicine = req.student.is_medicine;

		if (typeof req.student.is_asthma === 'undefined') {
			req.student.is_asthma = 0;
			req.studentdetails.asthma_detail = '';
		}
		req.studentdetails.is_asthma = req.student.is_asthma;

		if (typeof req.student.is_disability === 'undefined') {
			req.student.is_disability = 0;
			req.studentdetails.disability_detail = '';
		}
		req.studentdetails.is_disability = req.student.is_disability;

		if (req.student.routeId === '') {
			req.student.routeId = null;
			req.student.stoppage_point = null;
		}
        
		req.student.no_of_brother = (req.student.no_of_brother) ? req.student.no_of_brother : null;
		req.student.no_of_sister = (req.student.no_of_sister) ? req.student.no_of_sister : null;
		req.student.no_of_brother_in_school = (req.student.no_of_brother_in_school) ? req.student.no_of_brother_in_school : null;
		req.student.no_of_sister_in_school = (req.student.no_of_sister_in_school) ? req.student.no_of_sister_in_school : null;
		req.student.rank_in_family = (req.student.rank_in_family) ? req.student.rank_in_family : null;
		req.student.transportType = (req.student.transportType) ? req.student.transportType : null;
		
		if (typeof req.is_supervision === 'undefined' || !req.is_supervision) {
			req.is_supervision = '';
			req.studentdetails.guardian_name = '';
			req.studentdetails.guardian_relationship = '';
			req.student.guardian_contact = '';
			req.student.guardian_contact_alternate = '';
			req.studentdetails.guardian_address = '';
		}

		req.student.same_as_comm_add = (req.student.same_as_comm_add == 'on' || req.student.same_as_comm_add == true) ? true : false;
		req.student.age = 0;

		if (req.student.same_as_comm_add) {
			delete req.student.countryId_2;
			delete req.student.stateId_2;
			delete req.student.cityId_2;
			delete req.studentdetails.address_2;
		}


		if (req.countryISOCode !== 'IN') {
			req.student.aadhar = req.student.res_category = null;
		} else if (!req.student.aadhar || (req.student.aadhar.trim().length === 0)) {
			req.student.aadhar = null;
		}

		req.student.date_of_release = (req.student.date_of_release == '') ? null : req.student.date_of_release;
		req.student.date_of_expiration = (req.student.date_of_expiration == '') ? null : req.student.date_of_expiration;

		req.student.is_supervision = req.is_supervision;
		req.studentdetails.is_supervision = req.is_supervision;
		if(req.mark_list_img)
		 	req.student.mark_list_img = req.mark_list_img;
		if(req.birth_certificate_img)
			req.student.birth_certificate_img = req.birth_certificate_img;
		if(req.tc_img)
			req.student.tc_img = req.tc_img;
		if(req.cast_certificate_img)
			req.student.cast_certificate_img = req.cast_certificate_img;
		if(req.migration_certificate_img)
			req.student.migration_certificate_img = req.migration_certificate_img;
		if(req.affidavit_img)
			req.student.affidavit_img = req.affidavit_img;
		if(req.income_certificate_img)
			req.student.income_certificate_img = req.income_certificate_img;
		if(req.ration_card_img)
			req.student.ration_card_img = req.ration_card_img;
		if(req.labour_card_img)
			req.student.labour_card_img = req.labour_card_img;
		req.studentdetails.languageId = req.langId;
		req.userdetails.languageId = req.langId;
		req.user_type = 'student';
		req.student.masterId = req.masterId;
		req.studentdetails.masterId = req.masterId;
		if (typeof req.studentrecords === 'undefined') {
			req.studentrecords = {masterId:req.masterId};
		} else {
			req.studentrecords.masterId = req.masterId;
		}

		if (req.studentrecords && !req.studentrecords.roll_no)
			req.studentrecords.roll_no = null;

		var user = models.user.build(req);
		var userDetails = models.userdetail.build(req.userdetails);
		var student = models.student.build(req.student);
		var studentDetails = models.studentdetail.build(req.studentdetails);
		var studentrecordDetails = models.studentrecord.build(req.studentrecords);
		var passwordForMail = req.password;

		if (typeof req.feeDiscountId === 'undefined') {
			req.feeDiscountId = '';
		}
		if (typeof req.feeDiscountId === 'string') {
			req.feeDiscountId=req.feeDiscountId.split(',');
		}



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
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: req.lang}), url: true}));
			},
			function (callback) {
				userDetails.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: req.lang}), url: true}));
			},
			function (callback) {
				student.validate().then(function (err) {
						if (err !== null) {
								errors = errors.concat(err.errors);
								callback(null, errors);
						} else {
								callback(null, errors);
						}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function (callback) {
					studentDetails.validate().then(function (err) {
							if (err !== null) {
									errors = errors.concat(err.errors);
									callback(null, errors);
							} else {
									callback(null, errors);
							}
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function (callback) {
					studentrecordDetails.validate().then(function (err) {
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
					if (typeof req.password !== 'undefined') {
						req.password = bcrypt.hashSync(req.password, null, null);
					}
					delete req.confirm_password;
					if (typeof req.id !== 'undefined' && req.id !== '') {
						if (req.is_active === 0) {
							oauth.removeToken({id:req.id}, function(){});
						}

									var discountArr=[];
									var discountObj={};
									req.feeDiscountId.forEach(function(value){
										if (!value) return;
										discountObj={};  
										discountObj['feediscountId']=value;
										discountObj['studentId']=req.student.id;
										discountObj['masterId']=req.masterId;
										discountArr.push(discountObj);
									});

									models.studentdiscount.destroy({
										where: {
											studentId:req.student.id
										},
									}).then(function(data){
										if(discountArr.length) 
											models.studentdiscount.bulkCreate(discountArr);
									});
							 //}   
						//-----------------------------------------------
						req.userdetails.userId = req.id;
						req.studentdetails.studentId = req.student.id;
						models.user.update(req,{where: {id:req.id}, individualHooks: true}).then(function(data){
							async.parallel({
								one: function (callback) {
									models.userdetail.find({where:{userId:req.id,languageId:req.langId}}).then(function(resultData){
										if (resultData !==null) {
											req.userdetails.id = resultData.id;
											models.userdetail.update(req.userdetails, {where:{id:resultData.id, userId:req.id,languageId:req.langId}}).then(function(){
												callback(null, '1');
											}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
										} else {
											delete req.userdetails.id;
											models.userdetail.create(req.userdetails).then(function(){
												callback(null, '1');
											}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
										}
									}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
								},
								two: function (callback) {
									models.student.update(req.student,{where: {id:req.student.id}, individualHooks: true}).then(function(){
										models.studentdetail.find({where:{studentId:req.student.id,languageId:req.langId}}).then(function(resultData){
											if (resultData !==null) {
												delete req.studentdetails.id;
												models.studentdetail.update(req.studentdetails, {where:{id:resultData.id, studentId:req.student.id,languageId:req.langId}}).then(function(){
													callback(null, '2');
												}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
											} else {
												delete req.studentdetails.id;
												models.studentdetail.create(req.studentdetails).then(function(){
													callback(null, '2');
												}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
											}
										}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
									}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
								},
								three: function (callback) {
									models.studentrecord.update(req.studentrecords, {
										where: {
											id : req.studentrecords.id
										}
									})
									.then(() => callback(null, '3'));
								}
							}, function (err, result) {

								//----------Remove Student-Route Mapping Record-------------
								let qry = 'DELETE rvdhs_map_records FROM rvdhs_map_records INNER JOIN rvdhs_maps ON rvdhs_maps.id = rvdhs_map_records.rvdhsmapId WHERE';
								qry += ' rvdhs_maps.masterId = '+ req.masterId;
								qry += ' AND rvdhs_maps.academicSessionId = '+ req.studentrecords.academicSessionId;
								qry += ' AND rvdhs_map_records.studentId = '+ req.student.id;
								if(req.student.routeId) {
									qry += ' AND rvdhs_maps.routeId != '+ req.student.routeId;
								}
								models.sequelize.query(qry);
								//------------------------------------------------------------

								if (result.one === '1' && result.two === '2' && result.three === '3') {
									res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
								}
							});
						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					} else {
						var langId = parseInt(req.userdetails.languageId);
						userController.createUserName({fullname:req.userdetails.fullname}, function(username){
							req.user_name = username;
							models.user.create(req, {include: [models.userdetail], individualHooks: true}).then(function(data){
								username = data.user_name;
								req.student.userId = data.id;
								req.student.studentdetails = req.studentdetails;
								req.student.studentrecord = req.studentrecords;
								models.student.create(req.student, {include: [models.studentdetail, models.studentrecord], individualHooks: true}).then(function(studentData){


									//Create Discount data-------------------------
									if(req.feeDiscountId.length){
										var discountArr=[];
										var discountObj={};
										req.feeDiscountId.forEach(function(value){
											if (!value) return;
											discountObj={};
											discountObj['feediscountId']=value;
											discountObj['studentId']=studentData.id;
											discountObj['masterId']=req.masterId;
											discountArr.push(discountObj);
										});
										models.studentdiscount.bulkCreate(discountArr);
									}
									//------------------------------------------------


									if (langId === 1) {
										var mailData = {email: req.email, subject: language.lang({key:"studentRegistrationDetails", lang:req.lang}), list: {fullname: req.userdetails.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl, institute_name: req.institute_name}};
										mail.sendHtmlMailToStudent(mailData, req.lang);
										models.institute.belongsTo(models.country);
										models.institute.findOne({include: [{model: models.country, attributes: ['code']}], where: {userId: req.masterId}, attributes: ['sms_provider']})
										.then(institute => sms.sendStudentRegistrationSMS(filterMobileNumber(institute.country.code + req.mobile), {link: req.loginUrl, username: username, password: passwordForMail, lang: req.lang, institute_name: req.institute_name}, institute.sms_provider, req.masterId));
										// .then(console.log, console.log);
										res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
									} else {
										req.userdetails.userId = data.id;
										req.userdetails.languageId = 1;
										req.student.studentdetails.studentId =studentData.id;
										req.student.studentdetails.languageId =1;

										models.userdetail.create(req.userdetails).then(function(){
											models.studentdetail.create(req.student.studentdetails).then(function(){
												var mailData = {email: req.email, subject: language.lang({key:"studentRegistrationDetails", lang:req.lang}), list: {fullname: req.userdetails.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl, institute_name: req.institute_name}};
												mail.sendHtmlMailToStudent(mailData, req.lang);
												models.institute.belongsTo(models.country);
												models.institute.findOne({where: {userId: req.masterId}, attributes: ['sms_provider']})
												.then(institute => sms.sendStudentRegistrationSMS(filterMobileNumber(institute.country.code + req.mobile), {link: req.loginUrl, username: username, password: passwordForMail, lang: req.lang, institute_name: req.institute_name}, institute.sms_provider, req.masterId));
												// .then(console.log, console.log);
												res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
											}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
										});
									}
								}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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

	this.stepValidate = function(req, res){
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}

		if (typeof req.student.is_health_issue === 'undefined') {
			req.student.is_health_issue = 0;
			req.studentdetails.health_issue_detail = '';
		}
		req.studentdetails.is_health_issue = req.student.is_health_issue;
		
		if (typeof req.student.is_allergies === 'undefined') {
			req.student.is_allergies = 0;
			req.studentdetails.allergies_detail = '';
		}
		req.studentdetails.is_allergies = req.student.is_allergies;

		if (typeof req.student.is_medicine === 'undefined') {
			req.student.is_medicine = 0;
			req.studentdetails.medicine_detail = '';
		}
		req.studentdetails.is_medicine = req.student.is_medicine;

		if (typeof req.student.is_asthma === 'undefined') {
			req.student.is_asthma = 0;
			req.studentdetails.asthma_detail = '';
		}
		req.studentdetails.is_asthma = req.student.is_asthma;

		if (typeof req.student.is_disability === 'undefined') {
			req.student.is_disability = 0;
			req.studentdetails.disability_detail = '';
		}
		req.studentdetails.is_disability = req.student.is_disability;

		if (req.student.routeId === '') {
			req.student.routeId = null;
			req.student.stoppage_point = null;
		}
        
		req.student.no_of_brother = (req.student.no_of_brother) ? req.student.no_of_brother : null;
		req.student.no_of_sister = (req.student.no_of_sister) ? req.student.no_of_sister : null;
		req.student.no_of_brother_in_school = (req.student.no_of_brother_in_school) ? req.student.no_of_brother_in_school : null;
		req.student.no_of_sister_in_school = (req.student.no_of_sister_in_school) ? req.student.no_of_sister_in_school : null;
		req.student.rank_in_family = (req.student.rank_in_family) ? req.student.rank_in_family : null;
		req.student.transportType = (req.student.transportType) ? req.student.transportType : null;
		
		if (typeof req.is_supervision === 'undefined' || !req.is_supervision) {
			req.is_supervision = '';
			req.studentdetails.guardian_name = '';
			req.studentdetails.guardian_relationship = '';
			req.student.guardian_contact = '';
			req.student.guardian_contact_alternate = '';
			req.studentdetails.guardian_address = '';
		}

		req.student.same_as_comm_add = (req.student.same_as_comm_add == 'on' || req.student.same_as_comm_add == true) ? true : false;
		req.student.age = 0;

		if (req.student.same_as_comm_add) {
			delete req.student.countryId_2;
			delete req.student.stateId_2;
			delete req.student.cityId_2;
			delete req.studentdetails.address_2;
		}


		if (req.countryISOCode !== 'IN') {
			req.student.aadhar = req.student.res_category = null;
		} else if (!req.student.aadhar || (req.student.aadhar.trim().length === 0)) {
			req.student.aadhar = null;
		}

		req.student.date_of_release = (req.student.date_of_release == '') ? null : req.student.date_of_release;
		req.student.date_of_expiration = (req.student.date_of_expiration == '') ? null : req.student.date_of_expiration;

		req.student.is_supervision = req.is_supervision;
		req.studentdetails.is_supervision = req.is_supervision;
		if(req.mark_list_img)
		 	req.student.mark_list_img = req.mark_list_img;
		if(req.birth_certificate_img)
			req.student.birth_certificate_img = req.birth_certificate_img;
		if(req.tc_img)
			req.student.tc_img = req.tc_img;
		if(req.cast_certificate_img)
			req.student.cast_certificate_img = req.cast_certificate_img;
		if(req.migration_certificate_img)
			req.student.migration_certificate_img = req.migration_certificate_img;
		if(req.affidavit_img)
			req.student.affidavit_img = req.affidavit_img;
		if(req.income_certificate_img)
			req.student.income_certificate_img = req.income_certificate_img;
		if(req.ration_card_img)
			req.student.ration_card_img = req.ration_card_img;
		if(req.labour_card_img)
			req.student.labour_card_img = req.labour_card_img;
		req.studentdetails.languageId = req.langId;
		req.userdetails.languageId = req.langId;
		req.user_type = 'student';
		req.student.masterId = req.masterId;
		req.studentdetails.masterId = req.masterId;
		if (typeof req.studentrecords === 'undefined') {
			req.studentrecords = {masterId:req.masterId};
		} else {
			req.studentrecords.masterId = req.masterId;
		}

		if (req.studentrecords && !req.studentrecords.roll_no)
			req.studentrecords.roll_no = null;

		var user = models.user.build(req);
		var userDetails = models.userdetail.build(req.userdetails);
		var student = models.student.build(req.student);
		var studentDetails = models.studentdetail.build(req.studentdetails);
		var studentrecordDetails = models.studentrecord.build(req.studentrecords);
		var passwordForMail = req.password;


		if (typeof req.feeDiscountId === 'string') {
			req.feeDiscountId=req.feeDiscountId.split(',');
		}



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
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: req.lang}), url: true}));
			},
			function (callback) {
				userDetails.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: req.lang}), url: true}));
			},
			function (callback) {
				student.validate().then(function (err) {
						if (err !== null) {
								errors = errors.concat(err.errors);
								callback(null, errors);
						} else {
								callback(null, errors);
						}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function (callback) {
					studentDetails.validate().then(function (err) {
							if (err !== null) {
									errors = errors.concat(err.errors);
									callback(null, errors);
							} else {
									callback(null, errors);
							}
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function (callback) {
					studentrecordDetails.validate().then(function (err) {
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
					res({status: true})
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
				responseData.student = {masterId:reqData.masterId};
				responseData.studentrecord = {
				academicSessionId:reqData.academicSessionId,
				/*record_status:1,
				$or : [
					{transferred: 0},
					{transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}},
					{transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
				]*/
			};

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

		models.student.hasMany(models.studentdetail);
		models.student.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.student.hasOne(models.studentrecord);
		models.studentrecord.belongsTo(models.bcsmap,{'foreignKey':'bcsMapId'});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		isWhere.studentdetail = language.buildLanguageQuery(
			isWhere.studentdetail, reqData.langId, '`student`.`id`', models.studentdetail, 'studentId'
		);
		isWhere.boarddetail = language.buildLanguageQuery(
			isWhere.boarddetail, reqData.langId, '`studentrecord.bcsmap.board`.`id`', models.boarddetail, 'boardId'
		);
		isWhere.classesdetail = language.buildLanguageQuery(
			isWhere.classesdetail, reqData.langId, '`studentrecord.bcsmap.class`.`id`', models.classesdetail, 'classId'
		);
		isWhere.sectiondetail = language.buildLanguageQuery(
			isWhere.sectiondetail, reqData.langId, '`studentrecord.bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
		);
		models.student.findAndCountAll({
			include: [
				{model: models.studentrecord.scope(
					{ method: ['transferred', moment().format('YYYY-MM-DD')]},
					{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', reqData.academicSessionId]}
				),
				include:[
					{model: models.bcsmap,
						 include: [{model: models.board, attributes:['id'],
							 include: [{model: models.boarddetail,
								 attributes:['id', 'name', 'alias'],
								 where:isWhere.boarddetail
							 }]
						 },{model: models.classes, attributes:['id'],
							 include: [{model: models.classesdetail,
								 attributes:['id', 'name'],
								 where:isWhere.classesdetail
							 }]
						 },{model: models.section, attributes:['id'],
							 include: [{model: models.sectiondetail,
								 attributes:['id', 'name'],
								 where:isWhere.sectiondetail
							 }]
						 }],
						attributes: ['id']
					},
				],
				where: isWhere.studentrecord,
				attributes: ['id', 'bcsMapId', 'roll_no']
				},
				{model: models.user, where:isWhere.user, attributes:['id', 'email', 'user_name', 'mobile', 'user_image', 'is_active'], include: [{model: models.userdetail, where:isWhere.userdetail, attributes:['id', 'fullname']}]},
			],
			where: isWhere.student,
			attributes:['id', 'masterId', 'userId', 'enrollment_no'],
			order: [
				[models.studentrecord, 'roll_no'],
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, subQuery: false
		}).then(async function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);

			res({
				data:result.rows, 
				totalData: totalData, 
				pageCount: pageCount,  
				pageLimit: setPage, 
				currentPage:currentPage,
				feediscount: await feediscount.getAllFeediscount(reqData) 
			});
		})
			.catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: reqData.lang}), url: true}));
	};

	/*
	 * get By ID
	*/
	this.getById = function(req, res) {
		models.student.hasMany(models.studentdetail);
		models.student.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.student.hasOne(models.studentrecord);

		models.student.find({
			include: [
				{model: models.studentdetail, where: language.buildLanguageQuery({}, req.langId, '`student`.`id`', models.studentdetail, 'studentId')},
				{model:models.user, include: [{model: models.userdetail, where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId')}]},
				{model: models.studentrecord.scope(
					{ method: ['transferred', moment().format('YYYY-MM-DD')]},
					{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
				),
				where:{
					academicSessionId:req.academicSessionId,
				/*record_status:1,
				$or: [
					{transferred: 0},
					{transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}},
					{transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
				],*/
				}
				}
			],
			where:{
				id:req.id,
				masterId: req.masterId
			},
			order: [
				[ models.studentrecord, 'id', 'DESC'],
			]
		})
			.then(function(data){
				res(data);
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};



	/*
	* get By ID
	*/
	this.getEditData = function(req, res) {
		models.student.hasMany(models.studentdetail);
		models.student.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.student.hasOne(models.studentrecord);


		models.student.hasMany(models.studentdiscount);

		models.student.find({
			include: [
				{model: models.studentdiscount},
				{model: models.studentdetail, where: language.buildLanguageQuery({}, req.langId, '`student`.`id`', models.studentdetail, 'studentId')},
				{model:models.user, include: [{model: models.userdetail, where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId')}]},
				{model: models.studentrecord.scope(
					{ method: ['transferred', moment().format('YYYY-MM-DD')]},
					{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
				),
				where:{
					academicSessionId:req.academicSessionId,
					/*record_status:1,
					$or: [
						{transferred: 0},
						{transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}},
						{transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
					],*/
				}
				}
			],
			where:{
				id:req.id,
				masterId: req.masterId
			},
			order: [
				[ models.studentrecord, 'id', 'DESC'],
			],
		})
			.then(function(data){
				req.countryId = data.countryId;
				req.stateId = data.stateId;
				req.routeId = data.routeId;
				module.exports.getMetaInformations(req, function(result){
					city.getAllCity(req, function(cities){
						state.getAllState(req, function(states){
							route.viewAddress(req, async function(routeAddress){
								res({
									data: data,
									countries: result.countries,
									states:states,
									cities:cities,
									bcsmaps: result.bcsmaps,
									routes: result.routes,
									routeAddress:routeAddress,
									roleId:result.roleId,
									feediscount:await feediscount.getAllFeediscount(req) 
								});
							});
						});
					});
				});
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: req.lang}), url: true}));
	};

	/*
	 * get not eq. id
	*/
 this.getAllstudent = function(req, res) {
		models.student.hasMany(models.studentdetail);

		models.student.findAll({include: [{model: models.studentdetail, where: language.buildLanguageQuery({}, req.langId, '`student`.`id`', models.studentdetail, 'studentId')}], where:{id:{$ne:req.id}}}).then(function(data){
			res(data);
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	/*
	 * status update
	*/
 this.status = function(req, res) {
	delete req.masterId;
		models.user.update(req, {
			where:{
				id:req.id
			}
		}).then(function(data){
			oauth.removeToken(req, function(result){
				res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
			});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.sendLoginInfo = function (req, res) {
		models.user.hasMany(models.userdetail);
		models.student.belongsTo(models.user);
		models.institute.belongsTo(models.country);
		models.student.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
		models.student.findOne({
			include: [{
				model: models.institute,
				attributes: ['sms_provider'],
				include: [{
					model: models.country,
					attributes: ['code']
				}]
			}, {
				model: models.user,
				attributes: ['id', 'mobile', 'email', 'user_name'],
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId')
				}]
			}],
			attributes: [],
			where: {
				id: req.id,
				masterId: req.masterId
			}
		})
		.then(student => {
			var rstPswrdToken = randomstring.generate();
			var rstPswrdVrfUrl = req.resetPassUrl+ rstPswrdToken;
			models.user.update({reset_password_token: rstPswrdToken}, {where: {id: student.user.id}})
			.then(() => {
				var mailData = {
					email: student.user.email,
					subject: language.lang({key:"studentRegistrationDetails", lang:req.lang}),
					list: {username: student.user.user_name, link: rstPswrdVrfUrl, fullname: student.user.userdetails[0].fullname}
				};
				mail.sendResetPasswordMailStudent(mailData, req.lang);
				sms.sendForgotPasswordSMSStudent(
					filterMobileNumber(student.institute.country.code + student.user.mobile),
					{link: rstPswrdVrfUrl, username: student.user.user_name, lang: req.lang},
					student.institute.sms_provider,
					req.masterId
				);
				res({status: true, message: language.lang({key: "Login info sent", lang: req.lang}), data: {}});
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.sendsms = function(req, res) {
		models.student.belongsTo(models.user);
		models.institute.belongsTo(models.country);
		models.student.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
		models.student.findAll({
			include: [{
				model: models.institute,
				attributes: ['id', 'sms_provider'],
				include: [{
					model: models.country,
					attributes: ['code']
				}]
			}, {
				model: models.user,
				attributes: ['id', 'mobile']
			}],
			attributes: ['id'],
			where: {
				id: {
					$in: req.ids
				},
				masterId: req.masterId
			}
		})
		.then(students => {
			if (students.length === 0) {
				return res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
			}
			var logs = [];
			var sms_provider = students[0].institute.sms_provider;
			students.forEach((student, index) => {
				logs[index] = {
					senderId: req.userId, // id of sender in users tables
					receiverId: student.user.id,
					masterId: req.masterId,
					module: 'student',
					message: req.message
				};
				students[index] = filterMobileNumber(student.institute.country.code + student.user.mobile);
			});
			students = students.filter((student, index) => students.indexOf(student) === index);
			sms.customSMS(students, req.message, sms_provider, req.masterId);
			//sms.sendByMsg91(students, req.message);
			res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}})
			models.smslog.bulkCreate(logs);
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.promoted = function(req, res) {
		models.student.belongsTo(models.user);
		models.institute.belongsTo(models.country);
		models.student.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
			var studentRecords = [];
			//var sms_provider = students[0].institute.sms_provider;
			req.ids.forEach((studentId, index) => {
				studentRecords[index] = {
					studentId: studentId,
					masterId: req.masterId,
					academicSessionId: req.promotedAcademicSession,
					bcsMapId: req.promotedbcsMapId
				};
			});

			models.studentrecord.bulkCreate(
				studentRecords
			).then(function(data){
				var finalResult = [];
				data.forEach((item)=>{
					finalResult.push(models.studentrecord.update({
						promoted:1
					},{
						where:{
							studentId: item.studentId,
							masterId: req.masterId,
							academicSessionId: req.currentAcademicSessionId,
							bcsMapId: req.currentbcsMapId,
							promoted:{$ne: 1},
							transferred:{$ne: 1}
						}
					}));
				});
				Promise.all(finalResult).then(function(){
					res({status:true, message:language.lang({key:"All selected student have been promoted successfully", lang:req.lang}), data:{}});
				}).catch(console.log);
			});
			//sms.customSMS(students, req.message, sms_provider);
	};

	this.transferred = function(req, res) {
		models.student.belongsTo(models.user);
		models.institute.belongsTo(models.country);
		models.student.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
			var studentRecords = [];
			//var sms_provider = students[0].institute.sms_provider;
			req.ids.forEach((studentId, index) => {
				studentRecords[index] = {
					studentId: studentId,
					masterId: req.masterId,
					academicSessionId: req.currentAcademicSessionId,
					bcsMapId: req.transferredbcsMapId,
					transferred: 2,
					transferred_date: req.transferred_date,
					transerred_effective_from: req.transerred_effective_from
				};
			});
			//Checking for admission date
			models.student.find({
				attributes:['id'],
				where: {doa:{$gt:req.transerred_effective_from}, id:req.ids},
			}).then(function(data){
				if(!data){
						models.studentrecord.bulkCreate(
						studentRecords
						).then(function(data){
							var finalResult = [];
							data.forEach((item)=>{
							finalResult.push(models.studentrecord.update({
								transferred: 1,
								transferred_date: req.transferred_date,
								transerred_effective_from: req.transerred_effective_from
							},{
								where:{
									studentId: item.studentId,
									masterId: req.masterId,
									academicSessionId: req.currentAcademicSessionId,
									bcsMapId: req.currentbcsMapId,
									promoted:{$ne: 1},
									transferred:{$ne: 1}
								}
							}).then(function(){
								models.studentrecord.update({
									record_status:0
								},{
									where:{
										studentId: item.studentId,
										masterId: req.masterId,
										academicSessionId: req.currentAcademicSessionId,
										bcsMapId: req.transferredbcsMapId,
										promoted:{$ne: 1},
										transferred:1
									}
								});
							}));
						});
						Promise.all(finalResult).then(function(){
							res({status:true, message:language.lang({key:"All selected student have been transferred successfully", lang:req.lang}), data:{}});
						}).catch(console.log);
					});
				}else{
					res({status:false, message:language.lang({key:"Student admission date must be less than from effective date", lang:req.lang}), data:{}});
				}
			});
	};

	this.sendemail = function(req, res) {
		models.student.belongsTo(models.user);
		Promise.all([
			models.student.findAll({
				include: [{
					model: models.user,
					attributes: ['id', 'email']
				}],
				attributes: ['id'],
				where: {
					id: {
						$in: req.ids
					},
					masterId:req.masterId
				}
			}),
			models.user.find({
				where:{id:req.masterId},
				attributes:['id', 'email']
			})
		]).then(students => {
			if (students[0].length === 0) {
				return res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
			}
			var logs = [];
			var emailIds = [];
			students[0].forEach((student, index) => {
				if(student.user.email != ''){
					emailIds.push(student.user.email);
				}
			});

			var from = '';
			if(students[1]){
				from = students[1].email;
			}
			if(req.files){
				mail.sendMail({email:emailIds, subject:req.subject, msg:req.message, attachments:req.files, from:from});
			} else{
				mail.sendMail({email:emailIds, subject:req.subject, msg:req.message});
			}
			res({status:true, message:language.lang({key:"Email Sent", lang:req.lang}), data:{}});
		});
	};

	this.getMetaInformations = function(req, res){
		req.slug = 'student';
		country.getAllCountry(req, function(countries){
			utils.getAllBcsByMasterId(req, function(bcsmaps){
				route.getRoutes(req, function(routes){
					role.getAutoRoleId(req, async function(roleId){
						res({
							countries:countries, 
							bcsmaps:bcsmaps, 
							routes:routes, 
							roleId:roleId,
							feediscount:await feediscount.getAllFeediscount(req)
						});
					});
				});
			});
		});
	};


	this.applyDiscount = function(req, res) {


		if (typeof req.feeDiscountIds === 'string') {
			req.feeDiscountIds=req.feeDiscountIds.split(',');
		}

		async.forEach(req.ids, function (item, callback) {

									if(item !='all'){
									var discountArr=[];
									var discountObj={};
									req.feeDiscountIds.forEach(function(value){
									discountObj={};  
									discountObj['feediscountId']=value;
									discountObj['studentId']=item;
									discountObj['masterId']=req.masterId;
									discountArr.push(discountObj);
									});

									models.studentdiscount.destroy({
										where: {
											 studentId:item
										}
									}).then(function(data){

									 models.studentdiscount.bulkCreate(discountArr).then(function(data){

										
									 }); 

									});
				
								}

							callback();  
				
			}, function () {
				
				

			});

		res({status:true, message:language.lang({key:"Discount Applied Successfully", lang:req.lang}), data:{}});


	};  

	this.exportData = req => {
		return models.student.findAll({
			include: [
				{
					model: models.studentdetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`student`.`id`',
						models.studentdetail,
						'studentId'
					),
					attributes: [
						'father_name',
						'mother_name',
						'birthmark',
						'height',
						'weight',
						'address',
						'address_2',
						'guardian_name',
						'guardian_relationship',
						'guardian_address',
						'birthplace',
						'religion',
						'nationality',
						'pre_school_name',
						'pre_school_address',
						'pre_qualification',
						'father_occupation',
						'mother_occupation',
						'standard_of_living',
						'health_issue_detail',
						'allergies_detail',
						'medicine_detail',
						'asthma_detail',
						'disability_detail',
					],
				},
				{
					model: models.studentrecord.scope(
						{ method: ['transferred', moment().format('YYYY-MM-DD')]},
						{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
					),
					where: {
						academicSessionId: req.academicSessionId,
						bcsMapId: req.bcsMapId,
						/*record_status: 1,
						$or : [
							{transferred: 0},
							{transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}},
							{transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
						],*/
					},
					attributes: ['roll_no'],
				},
				{
					model: models.user,
					include: [
						{
							model: models.userdetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`user`.`id`',
								models.userdetail,
								'userId'
							),
							attributes: ['fullname'],
						},
					],
					where: {
						is_active: 1,
					},
					attributes: [
						'email',
						'mobile',
						'alternate_mobile',
					],
				}
			],
			where: {
				masterId: req.masterId,
			},
			order: [
				[models.studentrecord, 'roll_no'],
				['enrollment_no'],
				['id', 'DESC']
			],
			attributes: {
				exclude: [
					'id',
					'userId',
					'createdAt',
					'updateAt',
					'age',
					'masterId',
					'form_no',
					'affidavit_img',
					'birth_certificate_img',
					'cast_certificate_img',
					'cityId',
					'stateId',
					'countryId',
					'cityId_1',
					'stateId_2',
					'countryId_2',
					'fee_receipt_no',
					'income_certificate_img',
					'labour_card_img',
					'mark_list_img',
					'migration_certificate_img',
					'other_city',
					'ration_card_img',
					'routeId',
					'stoppage_point',
					'tc_img',
				],
			}
		});
	};

/*
* get By ID For show in TC
*/
this.getStudentDetail = function(req, res) {
	models.student.hasMany(models.studentdetail);
	models.student.belongsTo(models.user);
	models.user.hasMany(models.userdetail);
	models.student.hasOne(models.studentrecord);

	models.student.find({
		include: [
			{model: models.studentdetail, where: language.buildLanguageQuery({}, req.langId, '`student`.`id`', models.studentdetail, 'studentId')},
			{model:models.user, include: [{model: models.userdetail, where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId')}]},
			{model: models.studentrecord.scope(
					{ method: ['transferred', moment().format('YYYY-MM-DD')]}
				),
				where:{
					academicSessionId:req.academicsessionId,
					/*record_status:1,
					$or: [
						{transferred: 0},
						{transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}},
						{transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
					],*/
				}
			}
		],
		where:{
			id:req.id,
			masterId: req.masterId
		},
		order: [
			[ models.studentrecord, 'id', 'DESC'],
		]
	})
	.then(function(data){
		res({
			data: data
		});
	}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
};

this.remove = async req => {
    try {
      await models.user.destroy({where: {id: req.id}});
    } catch (err) {
      return {
        status: false,
        message: language.lang({key: 'Can not delete student, It is being used.'}),
      }
    }

    return {
      status: true,
      message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
    };
  };
}


module.exports = new Student();
