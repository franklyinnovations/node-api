var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var country = require('./country');
var state = require('./state');
var city = require('./city');
var hospitalfile = require('./hospitalfile');
var hospitalservice = require('./hospitalservice');
var hospital_timings = require('./hospital_timings');
var doctor = require('./doctor');
var mongo = require('../config/mongo');
var tagtype = require('./tagtype');
var utils = require('./utils');
var _ = require('lodash');

function Hospital() {

	this.getAllCountry = function(req, res) {
		country.getAllCountry(req, function(countries) {
			res({
				countries: countries
			});
		});
	}

	this.hospital_doctor = function(req, res) {
		let _ref = this;
		async.parallel({
			doctors: function(callback) {
				doctor.list(req, function(data) {
					callback(null, data);
				});
			},
			hospitals: function(callback) {
				_ref.list(req, function(data) {
					callback(null, data);
				});
			},
		}, function(err, result) {
			res(result);
		});
	}

	this.list = function(req, res) {
		// var pageSize = req.app.locals.site.page, // number of items per page
		// page = req.query.page || 1;

		var setPage = req.app.locals.site.page;
		var currentPage = 1;
		var pag = 1;
		if (typeof req.query.page !== 'undefined') {
			currentPage = +req.query.page;
			pag = (currentPage - 1) * setPage;
			delete req.query.page;
		} else {
			pag = 0;
		}

		var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
			where = {
				hospitaldetail: {},
			};
		if (req.query) {
			Object.keys(req.query).forEach(key => {
				if (req.query[key] === '') return;
				var modalKey = key.split('__');
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = {
						'$like': '%' + req.query[key] + '%'
					};
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = {
						'$like': '%' + req.query[key] + '%'
					};
				}
			});
		}

		where.hospitaldetail = language.buildLanguageQuery(
			where.hospitaldetail, reqData.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
		);
		where.countrydetail = language.buildLanguageQuery(
			where.countrydetail, reqData.langId, '`country`.`id`', models.countrydetail, 'countryId'
		);
		where.statedetail = language.buildLanguageQuery(
			where.statedetail, reqData.langId, '`state`.`id`', models.statedetail, 'stateId'
		);
		where.citydetail = language.buildLanguageQuery(
			where.citydetail, reqData.langId, '`city`.`id`', models.citydetail, 'cityId'
		);


		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.belongsTo(models.country);
		models.hospital.belongsTo(models.state);
		models.hospital.belongsTo(models.city);
		models.country.hasMany(models.countrydetail);
		models.state.hasMany(models.statedetail);
		models.city.hasMany(models.citydetail);

		models.hospital.belongsTo(models.user)
		models.user.hasMany(models.userdetail)

		models.hospital.findAndCountAll({
				include: [{
						model: models.hospitaldetail,
						where: where.hospitaldetail
					},
					{
						model: models.hospitalfile,
						where: where.hospitalfile,
						required: false
					},
					{
						model: models.country,
						include: [{
							model: models.countrydetail,
							where: where.countrydetail
						}]
					},
					{
						model: models.state,
						include: [{
							model: models.statedetail,
							where: where.statedetail
						}]
					},
					{
						model: models.city,
						include: [{
							model: models.citydetail,
							where: where.citydetail
						}]
					},
					{
						model: models.user,
						include: [{
							model: models.userdetail,
							where: language.buildLanguageQuery({}, reqData.langId, '`user`.`id`', models.userdetail, 'userId'),
							required: false
						}],
						required: false
					},
				],
				distinct: true,
				where: where.hospital,
				order: [
					['id', 'DESC']
				],
				distinct: true,
				limit: setPage,
				offset: pag,
				subQuery: false
			})
			.then(result => {
				res({
					status: true,
					data: result.rows,
					totalData: result.count,
					pageCount: Math.ceil(result.count / setPage),
					pageLimit: setPage,
					currentPage: currentPage
				});
			})
			.catch(() => res({
				status: false,
				error: true,
				error_description: language.lang({
					key: "Internal Error",
					lang: req.lang
				}),
				url: true
			}));
	};

	/*
	 * save
	 */
	this.save = function(req, res) {
		let contact_infos = JSON.parse(req.contact_informations)
		let contact_emails = contact_infos.emails,
			contact_mobiles = contact_infos.mobiles;
		req.contact_informations = contact_infos.emails.concat(contact_infos.mobiles)

		req.latitude = typeof req.latitude === undefined ? '' : req.latitude;
		req.longitude = typeof req.longitude === undefined ? '' : req.longitude;

		var hospitalHasOne = models.hospital.hasOne(models.hospitaldetail, {
			as: 'hospital_detail'
		});

		var hospital = models.hospital.build(req);

		req.hospital_detail.languageId = req.languageId;
		var hospitaldetail = models.hospitaldetail.build(req.hospital_detail);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([

			function(callback) {
				hospital.validate().then(function(err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				})
				//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function(callback) {
				hospitaldetail.validate().then(function(err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				})
				//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function(callback) {
				async.forEachOf(contact_emails, function(values, key, callback) {
					let fieldType = values.type;
					var contactInfo = models.contactinformation.build(values);
					contactInfo.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = fieldType + '___' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
			function(callback) {
				async.forEachOf(contact_mobiles, function(values, key, callback) {
					let fieldType = values.type;
					var contactInfo = models.contactinformation.build(values);
					contactInfo.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = fieldType + '___' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			}
		], function(err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				if (typeof req.is_active === 'undefined') {
					req.is_active = 0;
				}
				if (req.is_active == 'on' || req.is_active == 1) {
					req.is_active = 1;
				} else {
					req.is_active = 0;
				}
				if (typeof req.id !== 'undefined' && req.id !== '') {

					hospitaldetailData = req.hospital_detail;
					hospitaldetailData.languageId = req.languageId
					hospitaldetailData.hospitalId = req.id
					delete req.hospital_detail;
					delete req.languageId;

					models.hospital.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function(data) {
						models.hospitaldetail.find({
							where: {
								hospitalId: req.id,
								languageId: hospitaldetailData.languageId
							}
						}).then(function(resultData) {

							if (resultData !== null) {
								hospitaldetailData.id = resultData.id;
								models.hospitaldetail.update(hospitaldetailData, {
									where: {
										id: resultData.id,
										hospitalId: req.id,
										languageId: hospitaldetailData.languageId
									},
									individualHooks: true
								}).then(function() {
									models.contactinformation.destroy({
										where: {
											key: req.id,
											model: 'hospital'
										}
									}).then(function(CIDeleteStatus) {
										models.contactinformation.bulkCreate(req.contact_informations).then(function(CIStatus) {
											res({
												status: true,
												message: language.lang({
													key: "addedSuccessfully",
													lang: hospitaldetailData.languageId
												}),
												data: data
											});
										}).catch(() => res({
											status: false,
											error: true,
											error_description: language.lang({
												key: "Internal Error",
												lang: req.lang
											}),
											url: true
										}));
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}).catch(() => res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								}));
							} else {
								delete hospitaldetailData.id;
								models.hospitaldetail.create(hospitaldetailData).then(function() {}) //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
							}
						}) //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					}) //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));

				} else {
					delete req.hospital_detail.id;
					req.is_complete = 0, req.is_live = 0;
					req.verified_status = "incomplete-profile";
					req.claim_status = undefined === typeof req.claim_status && '' == req.claim_status ? 'non-claimed' : req.claim_status;
					models.hospital.findOne({
						where: {
							userId: req.userId,
							headId: null
						}
					}).then(function(hospData) {
						req.headId = hospData ? hospData.id : null;
						models.hospital.create(req, {
							include: [hospitalHasOne],
							individualHooks: true
						}).then(function(hospitalData) {

							//json object insert in mongodb
							/* var save_json_data_in_mongodb = { key:hospitalData.id.toString(),title:req.hospital_detail.hospital_name,langId:req.languageId,image:req.hospital_logo,type:'hospital'}
							 if(req.is_active==1){
							   mongo.save(save_json_data_in_mongodb,type='add',function(mongodata){
							  })
							}*/

							let contactsInfoData = [];
							async.forEachOf(req.contact_informations, function(civalues, cikey, CICallback) {
								let setCIData = civalues;
								setCIData.key = hospitalData.id;
								contactsInfoData.push(setCIData)
								CICallback()
							}, function(err) {
								if (err) {
									res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									})
								} else {
									models.contactinformation.bulkCreate(contactsInfoData).then(function(CIStatus) {
										res({
											status: true,
											message: language.lang({
												key: "addedSuccessfully",
												lang: hospitalData.languageId
											}),
											data: hospitalData
										});
									}) //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
								}
							});


						}) //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					})

				}
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function(errors) {
					var newArr = {};
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	}

	this.save_time = (req, res) => {

		if (req.length === 0 || (_.isEmpty(req.timings) && parseInt(req.shift_24X7) === 0)) {
			res({
				status: false,
				message: language.lang({key: "Please first complete your request by filling either valid shift timings or mark shift 24x7 as true.", lang: req.lang})
			});
		} else {

			models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
				foreignKey: 'hospitalDoctorId',
				sourceKey: 'id'
			});
		
			models.hospital_doctors.findAll({
				include: [
					{
						model: models.hospital_doctor_timings,
						required: false,
						attributes: [
							[models.sequelize.fn('min', models.sequelize.col('shift_1_from_time')), 'minShift1Value'],
							[models.sequelize.fn('MAX', models.sequelize.col('shift_1_to_time')), 'maxShift1Value'],
							[models.sequelize.fn('min', models.sequelize.col('shift_2_from_time')), 'minShift2Value'],
							[models.sequelize.fn('MAX', models.sequelize.col('shift_2_to_time')), 'maxShift2Value'],
						],
					},
				],
				where: { hospitalId: req.hospitalId, available_on_req : 0 },
				group: ["id"]
			})
			.then((allHospTimings) => {
				
				allHospTimings = JSON.parse(JSON.stringify(allHospTimings));
				
				let errorMsg = '', error = false;

				req.timings.map(function (reqTimeArr) {
					if(error) return;
					allHospTimings.map(function (savedDocs) {
						
						if(error || _.isEmpty(savedDocs.hospital_doctor_timings)) return;

						savedDocs.hospital_doctor_timings.map(function (savedDocTimings) {
							if(error) return;
							let r11 = parseInt(reqTimeArr.shift_1_from_time);
							let r12 = parseInt(reqTimeArr.shift_1_to_time);
							let r21 = parseInt(reqTimeArr.shift_2_from_time);
							let r22 = parseInt(reqTimeArr.shift_2_to_time);

							let s11 = parseInt(savedDocTimings.minShift1Value);
							let s12 = parseInt(savedDocTimings.maxShift1Value);
							let s21 = parseInt(savedDocTimings.minShift2Value);
							let s22 = parseInt(savedDocTimings.maxShift2Value);
							
							if(r11 > s11){
								error = true;
								errorMsg = 'Shift 1 start time did not match with one of your mapped doctors. Start time should be equal or lesser than ' + savedDocTimings.minShift1Value.toHHMMSS();
								return;
							}

							if(r12 < s12 || r12 > s21){
								error = true;
								errorMsg = 'Shift 1 end time did not match with one of your mapped doctors. End time should be equal or greater than ' + savedDocTimings.maxShift1Value.toHHMMSS();
								return;
							}

							if(r21 > s21 || r21 < s12){
								error = true;
								errorMsg = 'Shift 2 start time did not match with one of your mapped doctors. Start time should be equal or lesser than ' + savedDocTimings.minShift2Value.toHHMMSS();
								return;
							}

							if(r22 < s22){
								error = true;
								errorMsg = 'Shift 2 end time did not match with one of your mapped doctors. End time should be equal or greater than ' + savedDocTimings.maxShift2Value.toHHMMSS();
								return;
							}
						});
					});
				});

				if(errorMsg != ""){
					res({
						status: false,
						error: true,
						error_description: language.lang({
							key: errorMsg,
							lang: req.lang
						}),
						url: true
					});
				} else {   
					models.hospital_timings.destroy({
						where: {
							hospitalId: req.hospitalId
						}
					}).then((data) => {
						models.hospital_timings.bulkCreate(req.timings, {
								validate: true
							})
							.then(anotherTask => {
		
								res({
									status: true,
									message: language.lang({key: "Time has been updated successfully!", lang: req.lang})
								});
							})
							.catch(error => {
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								})
							})
					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}
			});
		}
	}

	this.save_doctor_time = (req, res) => {

		models.hospital.save_doctor_time(req, function(response) {
			res(response);
		})

	}

	this.filter_doctor = (req, res) => {
		models.doctorprofile.filterDoctors(req, function(response) {
			res(response);
		})
	}


	/*
	 * status update
	 */
	this.status = function(req, res) {
		models.hospital.update(req, {
			where: {
				id: req.id
			},
			individualHooks: true
		}).then(function(data) {
			/*where = {};
			hospitaldetail = {};
			where.hospitaldetail = language.buildLanguageQuery(
				where.hospitaldetail, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
			);
			models.hospital.hasMany(models.hospitaldetail);
			models.hospital.find({
				attributes: ['hospital_logo', 'hospitaldetails.hospital_name', 'is_live'],
				include: [{
					model: models.hospitaldetail,
					where: where.hospitaldetail
				}],
				where: {
					id: req.id
				}
			}).then(function(resultData) {
				var save_json_data_in_mongodb = {
					key: req.id,
					title: resultData.hospitaldetails[0].hospital_name,
					langId: req.langId.toString(),
					image: resultData.hospital_logo,
					type: 'hospital'
				}
				if (req.is_active == 1 && resultData.is_live == 1) {
					mongo.save(save_json_data_in_mongodb, type = 'add', function(mongodata) {})
				} else {
					mongo.save(save_json_data_in_mongodb, type = 'delete', function(mongodata) {})
				}
			})*/
			//json object update in mongodb

			//end of json object save in mongodb


			res({
				status: true,
				message: language.lang({
					key: "updatedSuccessfully",
					lang: req.lang
				}),
				data: data
			});
		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: req.lang
			}),
			url: true
		}));
	};
	/*
	 * shiftstatus update
	 */
	this.shiftstatus = function(req, res) {
		models.hospital.update(req, {
			where: {
				id: req.id
			}
		}).then(function(data) {
			res({
				status: true,
				message: language.lang({
					key: "updatedSuccessfully",
					lang: req.lang
				}),
				data: data
			});
		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: req.lang
			}),
			url: true
		}));
	};

	/*
	 * shiftstatus update
	 */
	this.managefreeze = function(req, res) {
		models.hospital.update(req, {
			where: {
				id: req.id
			}
		}).then(function(data) {
			res({
				status: true,
				message: language.lang({
					key: "updatedSuccessfully",
					lang: req.lang
				}),
				data: data
			});
		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: req.lang
			}),
			url: true
		}));
	};
	/*
	 * get By ID
	 */
	this.getById = function(req, res) {
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalfile);
		//models.hospital.hasMany(models.hospital_doctors);

		
		
		models.hospital.hasMany(models.hospital_timings);
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalaward);
		models.hospitalaward.hasMany(models.hospitalawarddetail);
		models.hospital.belongsTo(models.country);
		models.hospital.belongsTo(models.state);
		models.hospital.belongsTo(models.city);
		models.country.hasMany(models.countrydetail);
		models.state.hasMany(models.statedetail);
		models.city.hasMany(models.citydetail);

		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		var isWhere = {};
		isWhere.hospitaldetail = language.buildLanguageQuery(
			isWhere.hospitaldetail, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
		);
		isWhere.countrydetail = language.buildLanguageQuery(
			isWhere.countrydetail, req.langId, '`country`.`id`', models.countrydetail, 'countryId'
		);
		isWhere.statedetail = language.buildLanguageQuery(
			isWhere.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId'
		);
		isWhere.citydetail = language.buildLanguageQuery(
			isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
		);
		isWhere.hospitalawarddetail = language.buildLanguageQuery(
			isWhere.hospitalawarddetail, req.langId, '`hospitalawards`.`id`', models.hospitalawarddetail, 'hospitalAwardId'
		);
		models.hospital.find({
			include: [{
					model: models.hospitaldetail,
					where: isWhere.hospitaldetail
				},
				{
					model: models.hospitalfile,
					where: isWhere.hospitalfile,
					required: false
				},
				{
					model: models.hospital_timings,
					required: false
				},
				{
					model: models.hospitalservice,
					where: isWhere.hospitalservice,
					required: false
				},
				{
					model: models.hospitalaward,
					include: [{
						model: models.hospitalawarddetail,
						where: isWhere.hospitalawarddetail,
						required: false
					}],
					required: false
				},
				{
					model: models.country,
					include: [{
						model: models.countrydetail,
						where: isWhere.countrydetail
					}]
				},
				{
					model: models.state,
					include: [{
						model: models.statedetail,
						where: isWhere.statedetail
					}]
				},
				{
					model: models.city,
					include: [{
						model: models.citydetail,
						where: isWhere.citydetail
					}]
				},
				{
					model: models.contactinformation,
					where: {
						model: 'hospital'
					},
					required: false
				},
			],
			where: {
				id: req.id
			}
		}).then(function(data) {
			req.countryId = data.countryId;
			req.stateId = data.stateId;

			models.hospital_doctors.belongsTo(models.doctorprofile, {foreignKey: 'doctorProfileId', targetKey: 'id'});
			models.doctorprofile.hasMany(models.doctorprofiledetail);
			models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
				foreignKey: 'hospitalDoctorId',
				sourceKey: 'id'
			});
			
			models.doctorprofile.hasMany(models.contactinformation, {
				foreignKey: 'key',
				sourceKey: 'id'
			});
			Promise.all([
				models.hospital_doctors.findAll({
					include: [{
							model: models.doctorprofile,
							required: false,
							include: [
								{
									model: models.doctorprofiledetail,
									where: language.buildLanguageQuery(
										{}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
									),
									required: false
								},
								{
									model: models.contactinformation,
									where: {
										model: 'doctorprofile'
									},
									required: false,
									attributes: ["type", "value"]
								}
							]
						},
						{
							model: models.hospital_doctor_timings,
							required: false,
							attributes: ["days", "id", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time", "shift_1_from_key", "shift_1_to_key", "shift_2_from_key", "shift_2_to_key"]
						},
					],
					where: {hospitalId: data.id},
				}),
				new Promise((resolve) => country.getAllCountry(req, (result) => resolve(result))),
				new Promise((resolve) => state.getAllState(req, (result) => resolve(result))),
				new Promise((resolve) => city.getAllCity(req, (result) => resolve(result))),
				new Promise((resolve) => doctor.listDoctor(req, (result) => resolve(result)))
			]).then(([hospital_doctors, countries, states, cities, doctors]) => {
				data.dataValues.hospital_doctors = hospital_doctors;
				res({
					data: data,
					countries: countries,
					states: states,
					cities: cities,
					doctors: doctors
				});
			})
		})
		// .catch(() => res({
		// 	status: false,
		// 	error: true,
		// 	error_description: language.lang({
		// 		key: "Internal Error",
		// 		lang: req.lang
		// 	}),
		// 	url: true
		// }));
	};

	this.checkProfile = function(req, res) {

		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.hasMany(models.hospitalaward);
		models.hospitalaward.hasMany(models.hospitalawarddetail)
		models.hospital.hasMany(models.hospital_timings);
		models.hospital.hasMany(models.hospital_doctors);
		models.hospital_doctors.belongsTo(models.doctorprofile);
		models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
			foreignKey: 'hospitalDoctorId',
			sourceKey: 'id'
		});
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.doctorprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		hospitalWhereCond = {};
		if (typeof req.associatedProfileData !== undefined && req.associatedProfileData != null) {
			hospitalWhereCond = {
				userId: req.userId,
				id: req.associatedProfileData.id
			}
		} else {
			hospitalWhereCond = {
				userId: req.userId
			}
		}

		models.hospital.findOne({
			where: hospitalWhereCond,
			include: [{
					model: models.hospitaldetail,
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				},
				{
					model: models.hospitalservice,
					attributes: ['tagId', 'tagtypeId'],
					required: false
				},
				{
					model: models.hospitalfile,
					required: false
				},
				{
					model: models.hospitalaward,
					include: [{
						model: models.hospitalawarddetail,
						where: language.buildLanguageQuery({}, req.langId, '`hospitalawards`.`id`', models.hospitalawarddetail, 'hospitalAwardId'),
						required: false
					}],
					required: false
				},
				{
					model: models.hospital_timings,
					required: false
				},
				{
					model: models.hospital_doctors,
					include: [{
							model: models.doctorprofile,
							required: false,
							attributes: ["doctor_id", "id", "mobile", "email"],
							include: [{
									model: models.doctorprofiledetail,
									required: false,
									attributes: ["name", "address_line_1"],
									where: language.buildLanguageQuery({}, req.langId, '`hospital_doctors.doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
								},
								{
									model: models.contactinformation,
									where: {
										model: 'doctorprofile'
									},
									attributes: ["type", "value"],
									required: false
								}
							]
						},
						{
							model: models.hospital_doctor_timings,
							required: false,
							attributes: ["days", "id", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time"]
						}
					],
					required: false
				},
				{
					model: models.contactinformation,
					where: {
						model: 'hospital'
					},
					required: false
				},
			],
		}).then(function(result) {
			if (result !== null) {
				async.parallel({
					countries: function(icallback) {
						country.getAllCountry(req, function(data) {
							icallback(null, data);
						});
					},
					states: function(icallback) {
						req.countryId = result.countryId;
						state.getAllState(req, function(data) {
							icallback(null, data.data);
						});
					},
					cities: function(icallback) {
						req.stateId = result.stateId;
						city.getAllCity(req, function(data) {
							icallback(null, data.data);
						});
					},
					service_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['ServiceTagId']
							},
							where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
						}, function(data) {
							icallback(null, data);
						});
					},
					insurance_companies_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['InsuranceCompaniesTagId']
							},
							where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
						}, function(data) {
							icallback(null, data);
						});
					},
					specialization_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['SpecializationTagId']
							}
						}, function(data) {
							icallback(null, data);
						});
					},
					membership_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['MembershipsTagId']
							},
							where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
						}, function(data) {
							icallback(null, data);
						});
					},
					doctors_list_all: function(icallback) {
						doctor.listDoctor(req, function(data) {
							icallback(null, data)
						})
					}
				}, function(err, metaData) {
					res({
						isClaimed: true,
						data: result,
						countries: metaData.countries,
						states: metaData.states,
						cities: metaData.cities,
						service_tags: metaData.service_tags,
						insurance_companies_tags: metaData.insurance_companies_tags,
						specialization_tags: metaData.specialization_tags,
						membership_tags: metaData.membership_tags,
						doctors_list_all: metaData.doctors_list_all
					})
				});
			} else {
				async.parallel({
					cities: function(callback) {
						city.getAllCityAtOnce(req, function(data) {
							callback(null, data);
						});
					},
					specialization_tags: function(callback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['SpecializationTagId']
							}
						}, function(data) {
							callback(null, data);
						});
					},
					claimed_profile: function(callback) {
						models.claimrequest.belongsTo(models.hospital, {
							foreignKey: 'keyId'
						});
						models.hospital.hasMany(models.hospitaldetail);
						models.hospital.hasMany(models.contactinformation, {
							foreignKey: 'key',
							sourceKey: 'id'
						});
						models.claimrequest.findOne({
							where: {
								userId: req.userId,
								status: 'pending',
								model: 'hospital'
							},
							include: [{
								model: models.hospital,
								attributes: ['id', 'hospital_logo'],
								include: [{
										model: models.hospitaldetail,
										where: language.buildLanguageQuery({}, req.langId, '`hospitals`.`id`', models.hospitaldetail, 'hospitalId'),
										attributes: ['hospital_name', 'about_hospital']
									},
									{
										model: models.contactinformation,
										attributes: ["type", "value"],
										where: {
											model: 'hospital'
										},
										required: false
									},
								]
							}]
						}).then(function(data) {
							callback(null, data);
						})
						// .catch(() => res({
						// 	status: false,
						// 	error: true,
						// 	error_description: language.lang({
						// 		key: "Internal Error",
						// 		lang: req.lang
						// 	}),
						// 	url: true
						// }));
					}
				}, function(err, result) {
					let is_any_claim_request_pending = result.claimed_profile ? true : false;
					let profile_data = result.claimed_profile ? result.claimed_profile.hospital : [];
					res({
						isClaimed: false,
						cities: result.cities,
						specialization_tags: result.specialization_tags,
						is_any_claim_request_pending: is_any_claim_request_pending,
						hospital_profile_data: profile_data
					})
				});
			}
		})
		// .catch(() => res({
		// 	status: false,
		// 	error: true,
		// 	error_description: language.lang({
		// 		key: "Internal Error",
		// 		lang: req.lang
		// 	}),
		// 	url: true
		// }));
	}

	this.getAllProfiles = function(req, res) {
      var setPage = 10;
      var currentPage = 1;
      var pag = 1;
      var orderBy = "";
      if (
          typeof req.query !== "undefined" &&
          typeof req.query.page !== "undefined"
      ) {
          currentPage = +req.query.page;
          pag = (currentPage - 1) * setPage;
          delete req.query.page;
      } else {
          pag = 0;
      }
      orderBy = "id DESC";

      if (req.name && req.selected_specialization && req.selected_city) {
          let emailMobileCond = [req.email, req.mobile];
          emailMobileCond = emailMobileCond.filter(function(e) {
              return e;
          });
          let whereCond = "";
          whereCond += " (hospitaldetails.hospital_name like '%" + req.name + "%'";
          if (emailMobileCond.length) {
              whereCond +=
                  " or (contactinformations.value in ('" +
                  emailMobileCond.join("','") +
                  "') and contactinformations.model = 'hospital') ";
          }
          whereCond += " ) and ";
          whereCond += " (hospital.cityId = " + req.selected_city;
          whereCond += " or hospitalservices.tagId = " + req.selected_specialization;
          whereCond += " ) ";
          whereCond +=
              " and hospital.claim_status = 'non-claimed' and hospital.is_active = 1";

          whereCond.hospitaldetail = language.buildLanguageQuery({},
              req.langId,
              "`hospitals`.`id`",
              models.hospitaldetail,
              "hospitalId"
          );

          models.hospital.hasMany(models.hospitaldetail);
          models.hospital.hasMany(models.hospitalservice);
          models.hospital.belongsTo(models.country);
          models.hospital.belongsTo(models.state);
          models.hospital.belongsTo(models.city);
          models.country.hasMany(models.countrydetail);
          models.state.hasMany(models.statedetail);
          models.city.hasMany(models.citydetail);
          models.hospital.hasMany(models.contactinformation, {
              foreignKey: "key",
              sourceKey: "id"
          });

          models.hospital
              .findAndCountAll({
                  attributes: ["id", "cityId", "stateId", "countryId", "hospital_logo"],
                  where: {
                      whereCondition: models.sequelize.literal(whereCond)
                  },
                  include: [{
                          model: models.hospitaldetail,
                          where: whereCond.hospitaldetail,
                          attributes: [
                              "hospital_name",
                              "contact_emails",
                              "contact_mobiles",
                              "address"
                          ]
                      },
                      {
                          model: models.hospitalservice,
                          where: {},
                          required: false
                      },
                      {
                          model: models.country,
                          attributes: ["id"],
                          include: [{
                              model: models.countrydetail,
                              where: language.buildLanguageQuery({},
                                  req.langId,
                                  "`country`.`id`",
                                  models.countrydetail,
                                  "countryId"
                              ),
                              attributes: ["name"]
                          }]
                      },
                      {
                          model: models.state,
                          attributes: ["id"],
                          include: [{
                              model: models.statedetail,
                              where: language.buildLanguageQuery({},
                                  req.langId,
                                  "`state`.`id`",
                                  models.statedetail,
                                  "stateId"
                              ),
                              attributes: ["name"]
                          }]
                      },
                      {
                          model: models.city,
                          attributes: ["id"],
                          include: [{
                              model: models.citydetail,
                              where: language.buildLanguageQuery({},
                                  req.langId,
                                  "`city`.`id`",
                                  models.citydetail,
                                  "cityId"
                              ),
                              attributes: ["name"]
                          }]
                      },
                      {
                          model: models.contactinformation,
                          where: {
                              model: "hospital",
                              is_primary: 1
                          },
                          required: false
                      }
                  ],
                  limit: setPage,
                  offset: pag,
                  subQuery: false
              })
              .then(function(result) {
                  var totalData = result.count;
                  var pageCount = Math.ceil(totalData / setPage);
                  res({
                      status: true,
                      totalData: totalData,
                      pageCount: pageCount,
                      pageLimit: setPage,
                      currentPage: currentPage,
                      data: result.rows
                  });
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      } else {
          res({
              status: false,
              message: language.lang({
                  key: "Missing required parameters",
                  lang: req.lang
              })
          });
      }
  };

	this.metaDataForNewProfile = function(req, res) {
		utils.getAllTagTypeId()['']
		async.parallel({
			countries: function(callback) {
				country.getAllCountry(req, function(data) {
					callback(null, data);
				});
			},
			service_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['ServiceTagId']
					},
					where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
				}, function(data) {
					callback(null, data);
				});
			},
			insurance_companies_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['InsuranceCompaniesTagId']
					},
					where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
				}, function(data) {
					callback(null, data);
				});
			},
			specialization_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['SpecializationTagId']
					}
				}, function(data) {
					callback(null, data);
				});
			},
			membership_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['MembershipsTagId']
					},
					where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
				}, function(data) {
					callback(null, data);
				});
			}
		}, function(err, result) {
			res(result);
		});
	}

	this.verifystatus = function(req, res) {
		if (req.id) {
			models.hospital.hasMany(models.hospitaldetail);
			models.hospital.hasMany(models.hospitalservice);
			models.hospital.hasMany(models.hospitalfile);
			var isWhere = {};
			models.hospital.findOne({
				include: [{
						model: models.hospitaldetail,
						where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'),
						attributes: ['hospital_name', 'languageId']
					},
					{
						model: models.hospitalservice,
						where: isWhere.hospitalservice,
						required: false
					},
					{
						model: models.hospitalfile,
						where: isWhere.hospitalfile,
						required: false
					}
				],
				where: {
					id: req.id
				}
			}).then(function(data) {
				if (data) {
					// check condition befor live 
					let tagTypeIds = utils.getAllTagTypeId()
					let servicesTagStatus = data.hospitalservices.some((item) => {
						return item.tagtypeId == tagTypeIds.ServiceTagId
					})
					let specializationTagStatus = data.hospitalservices.some((item) => {
						return item.tagtypeId == tagTypeIds.SpecializationTagId
					})
					let membershipTagStatus = data.hospitalservices.some((item) => {
						return item.tagtypeId == tagTypeIds.MembershipsTagId
					})
					let insuranceCompaniesTagStatus = data.hospitalservices.some((item) => {
						return item.tagtypeId == tagTypeIds.InsuranceCompaniesTagId
					})
					let filesStatus = data.hospitalfiles.some((item) => {
						return ["prescription_pad", "clinic_reg_proof", "waste_disposal_certificate", "tax_receipt"].indexOf(item.document_type) !== -1;
					})
					//end of check conditions
					let profileCompletionStatus = servicesTagStatus && specializationTagStatus && membershipTagStatus && insuranceCompaniesTagStatus && filesStatus;
					
					if (profileCompletionStatus) {
						var checkStatus = 1 === data.is_complete && ("approved" === data.claim_status || "user-created" === data.claim_status);
						if (checkStatus) {
							models.hospital.update({
								verified_status: 'verified',
								is_live: 1
							}, {
								where: {
									id: req.id
								},
								individualHooks: true
							}).then(function(response) {

								//mongo entry for live doctor
								/*var save_json_data_in_mongodb = {
									key: req.id,
									title: data.hospitaldetails[0].hospital_name,
									langId: data.hospitaldetails[0].languageId.toString(),
									image: data.hospital_logo,
									type: 'doctor'
								}
								mongo.save(save_json_data_in_mongodb, type = 'add', function(mongodata) {})*/
								res({
									status: true,
									message: language.lang({
										key: "updatedSuccessfully",
										lang: req.lang
									})
								});
							}).catch(() => res({
								status: false,
								error: true,
								error_description: language.lang({
									key: "Internal Error",
									lang: req.lang
								}),
								url: true
							}));
						}
					} else {
						res({
							status: false,
							message: language.lang({
								key: "Your profile is not complete yet",
								lang: req.lang
							}),
							data: []
						});
					}
				} else {
					res({
						status: false,
						message: language.lang({
							key: "invalidRecord",
							lang: req.lang
						}),
						data: []
					});
				}
			}) //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		} else {
			res({
				status: false,
				message: language.lang({
					key: "invalidRequest",
					lang: req.lang
				}),
				data: []
			});
		}
	}

	/*
	 * doctor get By ID
	*/
	this.hospitalById = function(req, res) {
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key'
		});
		models.hospital.hasMany(models.hospitalservice);

		models.doctorfeedback.belongsTo(models.patient);
		models.patient.belongsTo(models.user);
		models.user.hasMany(models.userdetail);

		models.hospital_doctors.belongsTo(models.doctorprofile);
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctoreducation.hasMany(models.doctoreducationdetail)
		models.doctoreducation.belongsTo(models.tag, {
			foreignKey: 'tagtypeId'
		})
		models.tag.hasMany(models.tagdetail)
		models.doctorprofile.hasMany(models.doctorexperience);
		models.doctorprofile.hasMany(models.doctortags);

		Promise.all([
			models.hospital.find({
				attributes: [
					'id',
					'hospital_logo',
					'active_schedule',
					'latitude',
					'longitude', 
					'shift_24X7',
					[models.sequelize.literal('(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.hospitalId = hospital.id)'), 'avg_rating']
				],
				include: [{
					model: models.hospitaldetail,
					attributes: ['id', 'hospital_name', 'about_hospital', 'address'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				}, {
					model: models.hospitalfile,
					attributes: ['id', 'hospital_files', 'file_type', 'document_type'],
					where:{
						is_active:1,
						document_type:'public_photos'
					},
					required: false
				}, {
					model: models.contactinformation,
					attributes: ['type', 'value', 'is_primary'],
					where: {
						is_primary: 1,
						model: 'hospital'
					},
					required: false
				}, {
					model: models.hospitalservice,
					attributes: ['id', 'tagId'],
					required: false
				}],
				where: {
					id: req.id,
					is_active: 1,
					is_live: 1
				}
			}),
			models.hospital_timings.findAll({
				attributes: [
					[models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
						), "%h:%i %p"
					), 'shift_1_from_time'],
					[models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
						), "%h:%i %p"
					), 'shift_1_to_time'],

					[models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
						), "%h:%i %p"
					), 'shift_2_from_time'],

					[models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
						), "%h:%i %p"
					), 'shift_2_to_time'],
					'days'
				],
				where: {
					hospitalId: req.id
				}
			}),
			models.doctorfeedback.findOne({
				attributes: ['id', 'patientId', 'feedback', 'rating', 'createdAt'],
				include: [
					{
						model: models.patient,
						attributes: ['id'],
						include: [{
							model: models.user,
							attributes: ['id'],
							include: [{
								model: models.userdetail,
								attributes: ['id', 'fullname'],
								where: language.buildLanguageQuery(
									{}, req.langId, '`patient.user`.`id`', models.doctorfeedbackdetail, 'userId'
								),
							}]
						}]
					},
				],
				order: [['createdAt', 'DESC']],
				where: {
					is_approved: 1,
					hospitalId: req.id
				}
			}),
			models.hospital_doctors.findAll({
				attributes: ['id', 'consultation_charge', 'available_on_req'],
				include: [{
					model: models.doctorprofile,
					where: {
						is_active: 1,
						is_live: 1
					},
					attributes: [
						'id',
						'salutation',
						'doctor_profile_pic', 
						[models.sequelize.literal('(SELECT IFNULL(ROUND(AVG(doctor_feedbacks.rating)),0) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id)'), 'avg_rating'],
						[models.sequelize.literal('(SELECT IFNULL((MAX(duration_to)-MIN(duration_from)),0) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'), 'total_exp']
					],
					include: [{
							model: models.doctorprofiledetail,
							attributes: ['id', 'name'],
							where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
						},
						{
							model: models.doctoreducation,
							attributes: ['id'],
							include: [{
								model: models.tag,
								attributes: ['id'],
								include: [{
									model: models.tagdetail,
									attributes: ['title'],
									where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'),
									required: false
								}],
								required: false
							}],
							required: false
						},
						{
							model: models.doctortags,
							attributes: ['id'],
							include: [{
								model: models.tag,
								attributes: ['id'],
								include: [{
									model: models.tagdetail,
									attributes: ['title'],
									where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'),
									required: false
								}],
								required: false,
							}],
							required: false,
							where: {
								tagtypeId: 2
							},
						},
						{
							model: models.doctorexperience,
							attributes: ["id", "duration_from", "duration_to"],
							required: false
						}
					],
					required: false
				}],
				where: {
					hospitalId: req.id
				}
			})
		]).then(([data, hospital_timings, doctorfeedback, hospital_doctors]) => {
			let arrtag = [];
			if(data){
				data = JSON.parse(JSON.stringify(data)) || {};
				if(data.hospitalservices){
					arrtag = data.hospitalservices.map(item => item.tagId);
				}
			}
			data.hospital_timings = hospital_timings;
			data.doctorfeedback = doctorfeedback;
			data.hospital_doctors = hospital_doctors;
			Promise.all([
				tagtype.listByTypeAndTagsNew({body: {id: 1,tagIDS:arrtag}})
			]).then(([service_tags]) => {
				res({
					data,
					service_tags: {data: service_tags}
				});
			}).catch(console.log);
		}).catch(console.log);
	};

	this.createByDoctor = function(req, res) {
		models.hospital.findOne({
			where: {
				userId: req.userId,
				headId: null
			}
		}).then(function(hosData) {

			let contact_infos = JSON.parse(req.contact_informations)
			let contact_emails = contact_infos.emails,
				contact_mobiles = contact_infos.mobiles;
			req.contact_informations = contact_infos.emails.concat(contact_infos.mobiles)
			var hospitalHasOne = models.hospital.hasOne(models.hospitaldetail, {
				as: 'hospital_detail'
			});
			var hospital = models.hospital.build(req);
			req.hospital_detail.languageId = req.languageId;
			var hospitaldetail = models.hospitaldetail.build(req.hospital_detail);
			var errors = [];

			req.latitude = typeof req.latitude === undefined ? '' : null;
			req.longitude = typeof req.longitude === undefined ? '' : null;

			async.parallel([
				function(callback) {
					hospital.validate().then(function(err) {
						if (err !== null) {
							errors = errors.concat(err.errors);
							callback(null, errors);
						} else {
							callback(null, errors);
						}
					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				},
				function(callback) {
					hospitaldetail.validate().then(function(err) {
						if (err !== null) {
							errors = errors.concat(err.errors);
							callback(null, errors);
						} else {
							callback(null, errors);
						}
					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				},
				function(callback) {
					async.forEachOf(contact_emails, function(values, key, callback) {
						let fieldType = values.type;
						var contactInfo = models.contactinformation.build(values);
						contactInfo.validate().then(function(err) {
							if (err != null) {
								async.forEach(err.errors, function(errObj, inner_callback) {
									errObj.path = fieldType + '___' + key;
									errors = errors.concat(errObj);
								});
							}
							callback(null, errors);
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						}));
					}, function(err) {
						callback(null, errors);
					});
				},
				function(callback) {
					async.forEachOf(contact_mobiles, function(values, key, callback) {
						let fieldType = values.type;
						var contactInfo = models.contactinformation.build(values);
						contactInfo.validate().then(function(err) {
							if (err != null) {
								async.forEach(err.errors, function(errObj, inner_callback) {
									errObj.path = fieldType + '___' + key;
									errors = errors.concat(errObj);
								});
							}
							callback(null, errors);
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						}));
					}, function(err) {
						callback(null, errors);
					});
				}
			], function(err, errors) {
				var merged = [].concat.apply([], errors);
				var uniqueError = merged.filter(function(elem, pos) {
					return merged.indexOf(elem) == pos;
				});
				if (uniqueError.length === 0) {
					if (typeof req.is_active === 'undefined') {
						req.is_active = 0;
					}
					if (req.is_active == 'on' || req.is_active == 1) {
						req.is_active = 1;
					} else {
						req.is_active = 0;
					}
					if (typeof req.id !== 'undefined' && req.id !== '') {

						//json object update in mongodb
						/*  var save_json_data_in_mongodb = { key:req.id,title:req.hospital_detail.hospital_name,langId:req.languageId,image:req.hospital_logo,type:'hospital'}
						  if(req.is_active==1){
						   mongo.save(save_json_data_in_mongodb,type='edit',function(mongodata){
							})
						  }else{
							mongo.save(save_json_data_in_mongodb,type='delete',function(mongodata){
						   })
						 }*/
						//end of json object save in mongodb

						hospitaldetailData = req.hospital_detail;
						hospitaldetailData.languageId = req.languageId
						hospitaldetailData.hospitalId = req.id
						delete req.hospital_detail;
						delete req.languageId;
						models.hospital.update(req, {
							where: {
								id: req.id
							},
							individualHooks: true
						}).then(function(data) {
							models.hospitaldetail.find({
								where: {
									hospitalId: req.id,
									languageId: hospitaldetailData.languageId
								}
							}).then(function(resultData) {
								if (resultData !== null) {
									hospitaldetailData.id = resultData.id;
									models.hospitaldetail.update(hospitaldetailData, {
										where: {
											id: resultData.id,
											hospitalId: req.id,
											languageId: hospitaldetailData.languageId
										}
									}).then(function() {
										models.contactinformation.destroy({
											where: {
												key: req.id,
												model: 'hospital'
											}
										}).then(function(CIDeleteStatus) {
											models.contactinformation.bulkCreate(req.contact_informations).then(function(CIStatus) {
												res({
													status: true,
													message: language.lang({
														key: "addedSuccessfully",
														lang: hospitaldetailData.languageId
													}),
													data: data
												});
											}).catch(() => res({
												status: false,
												error: true,
												error_description: language.lang({
													key: "Internal Error",
													lang: req.lang
												}),
												url: true
											}));
										}).catch(() => res({
											status: false,
											error: true,
											error_description: language.lang({
												key: "Internal Error",
												lang: req.lang
											}),
											url: true
										}));
									}).catch(() => res({
										status: false,
										error: true,
										'error_description': language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								} else {
									delete hospitaldetailData.id;
									models.hospitaldetail.create(hospitaldetailData).then(function() {}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}
							}).catch(() => res({
								status: false,
								error: true,
								error_description: language.lang({
									key: "Internal Error",
									lang: req.lang
								}),
								url: true
							}));
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						}));
					} else {
						delete req.hospital_detail.id;
						req.is_complete = 0, req.is_live = 0;
						req.verified_status = "incomplete-profile";
						req.claim_status = undefined === typeof req.claim_status && '' == req.claim_status ? 'non-claimed' : req.claim_status;
						req.headId = hosData ? hosData.id : null;
						models.hospital.create(req, {
							include: [hospitalHasOne],
							individualHooks: true
						}).then(function(hospitalData) {

							//json object insert in mongodb
							/* var save_json_data_in_mongodb = { key:hospitalData.id.toString(),title:req.hospital_detail.hospital_name,langId:req.languageId,image:req.hospital_logo,type:'hospital'}
								if(req.is_active==1){
									mongo.save(save_json_data_in_mongodb,type='add',function(mongodata){
								})
							}*/

							let contactsInfoData = [];
							async.forEachOf(req.contact_informations, function(civalues, cikey, CICallback) {
								let setCIData = civalues;
								setCIData.key = hospitalData.id;
								contactsInfoData.push(setCIData)
								CICallback()
							}, function(err) {
								if (err) {
									res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									})
								} else {
									models.contactinformation.bulkCreate(contactsInfoData).then(function(CIStatus) {
										res({
											status: true,
											message: language.lang({
												key: "addedSuccessfully",
												lang: hospitalData.languageId
											}),
											data: hospitalData
										});
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}
							});
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						}));
					}
				} else {
					language.errors({
						errors: uniqueError,
						lang: req.lang
					}, function(errors) {
						var newArr = {};
						newArr.errors = errors;
						res(newArr);
					});
				}
			});
		})
	}

	this.getProfileForDoctor = function(req, res) {
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.hasMany(models.hospitalaward);
		models.hospitalaward.hasMany(models.hospitalawarddetail)
		models.hospital.hasMany(models.hospital_timings);
		models.hospital.hasMany(models.hospital_doctors);
		models.hospital_doctors.belongsTo(models.doctorprofile);
		models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
			foreignKey: 'hospitalDoctorId',
			sourceKey: 'id'
		});
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.doctorprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		models.hospital.findOne({
			where: {
				id: req.id
			},
			include: [{
					model: models.hospitaldetail,
					where: language.buildLanguageQuery({}, req.langId, '`hospitals`.`id`', models.hospitaldetail, 'hospitalId')
				},
				{
					model: models.hospitalservice,
					attributes: ['tagId', 'tagtypeId'],
					required: false
				},
				{
					model: models.hospitalfile,
					required: false
				},
				{
					model: models.hospitalaward,
					include: [{
						model: models.hospitalawarddetail,
						where: language.buildLanguageQuery({}, req.langId, '`hospitalaward`.`id`', models.hospitalawarddetail, 'hospitalAwardId'),
						required: false
					}],
					required: false
				},
				{
					model: models.hospital_timings,
					required: false
				},
				{
					model: models.hospital_doctors,
					include: [{
							model: models.doctorprofile,
							required: false,
							attributes: ["doctor_id", "id", "mobile", "email"],
							include: [{
									model: models.doctorprofiledetail,
									required: false,
									attributes: ["name", "address_line_1"],
									where: language.buildLanguageQuery({}, req.langId, '`doctorprofiles`.`id`', models.doctorprofiledetail, 'doctorProfileId')
								},
								{
									model: models.contactinformation,
									where: {
										model: 'doctorprofile'
									},
									attributes: ["type", "value"],
									required: false
								}
							]
						},
						{
							model: models.hospital_doctor_timings,
							required: false,
							attributes: ["days", "id", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time"]
						}
					],
					required: false
				},
				{
					model: models.contactinformation,
					where: {
						model: 'hospital'
					},
					required: false
				},
			],
		}).then(function(result) {
			res({
				data: result
			})
		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: req.lang
			}),
			url: true
		}));
	}

	this.metaDataForEditProfile = function(req, res) {
		models.hospital.findOne({
			where: {
				id: req.id
			}
		}).then(function(result) {
			async.parallel({
				countries: function(icallback) {
					country.getAllCountry(req, function(data) {
						icallback(null, data);
					});
				},
				states: function(icallback) {
					req.countryId = result.countryId;
					state.getAllState(req, function(data) {
						icallback(null, data.data);
					});
				},
				cities: function(icallback) {
					req.stateId = result.stateId;
					city.getAllCity(req, function(data) {
						icallback(null, data.data);
					});
				},
				service_tags: function(icallback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['ServiceTagId']
						},
						where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
					}, function(data) {
						icallback(null, data);
					});
				},
				insurance_companies_tags: function(icallback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['InsuranceCompaniesTagId']
						},
						where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
					}, function(data) {
						icallback(null, data);
					});
				},
				specialization_tags: function(icallback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['SpecializationTagId']
						}
					}, function(data) {
						icallback(null, data);
					});
				},
				membership_tags: function(icallback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['MembershipsTagId']
						},
						where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
					}, function(data) {
						icallback(null, data);
					});
				},
				doctors_list_all: function(icallback) {
					doctor.listDoctor(req, function(data) {
						icallback(null, data)
					})
				}
			}, function(err, metaData) {
				res({
					countries: metaData.countries,
					states: metaData.states,
					cities: metaData.cities,
					service_tags: metaData.service_tags.data.tags,
					insurance_companies_tags: metaData.insurance_companies_tags.data.tags,
					specialization_tags: metaData.specialization_tags.data.tags,
					membership_tags: metaData.membership_tags.data.tags,
					doctors_list_all: metaData.doctors_list_all
				})
			});
		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: req.lang
			}),
			url: true
		}));
	}

	this.viewHospitalInfo = function(req, res) {
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key'
		});
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalaward);
		models.hospitalaward.hasMany(models.hospitalawarddetail)

		models.hospital_doctors.belongsTo(models.doctorprofile);
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctoreducation.hasMany(models.doctoreducationdetail)
		models.doctoreducation.belongsTo(models.tag, {
			foreignKey: 'tagtypeId'
		})
		models.tag.hasMany(models.tagdetail)
		models.doctorprofile.hasMany(models.doctorexperience);
		models.doctorprofile.hasMany(models.doctortags);

		Promise.all([
			models.hospital.find({
				attributes: [
					'id',
					'hospital_logo',
					'active_schedule',
					'shift_24X7',
					'is_freeze',
					'latitude',
					'longitude', [models.sequelize.literal('(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.hospitalId = hospital.id)'), 'avg_rating']
				],
				include: [{
					model: models.hospitaldetail,
					attributes: ['id', 'hospital_name', 'about_hospital', 'address'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				}, {
					model: models.hospitalfile,
					attributes: ['id', 'hospital_files', 'file_type', 'document_type'],
					where: {document_type: 'public_photos'},
					required: false
				}, {
					model: models.contactinformation,
					attributes: ['type', 'value', 'is_primary'],
					where: {
						is_primary: 1,
						model: 'hospital'
					},
					required: false
				}, {
					model: models.hospitalservice,
					attributes: ['id', 'tagId'],
					required: false
				}, {
					model: models.hospitalaward,
					attributes: ['id', 'award_year'],
					include: [{
						model: models.hospitalawarddetail,
						attributes: ['award_gratitude_title'],
						where: language.buildLanguageQuery({}, req.langId, '`hospitalaward`.`id`', models.hospitalawarddetail, 'hospitalAwardId'),
						required: false
					}],
					required: false
				}],
				where: {
					id: req.id,
					is_active: 1
				}
			}),
			models.hospital_timings.findAll({
				attributes: [
					[models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
						), "%h:%i %p"
					), 'shift_1_from_time'],
					[models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
						), "%h:%i %p"
					), 'shift_1_to_time'],

					[models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
						), "%h:%i %p"
					), 'shift_2_from_time'],

					[models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
						), "%h:%i %p"
					), 'shift_2_to_time'],
					'days'
				],
				where: {
					hospitalId: req.id
				}
			}),
			models.hospital_doctors.findAll({
				attributes: ['id', 'consultation_charge', 'available_on_req'],
				include: [{
					model: models.doctorprofile,
					where: {
						is_active: 1
					},
					attributes: [
						'id',
						'salutation',
						'doctor_profile_pic', [models.sequelize.literal('(SELECT IFNULL(ROUND(AVG(doctor_feedbacks.rating)),0) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = id)'), 'avg_rating']
					],
					include: [{
							model: models.doctorprofiledetail,
							attributes: ['id', 'name'],
							where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
						},
						{
							model: models.doctoreducation,
							attributes: ['id'],
							include: [{
								model: models.tag,
								attributes: ['id'],
								include: [{
									model: models.tagdetail,
									attributes: ['title'],
									where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'),
									required: false
								}],
								required: false
							}],
							required: false
						},
						{
							model: models.doctortags,
							attributes: ['id'],
							include: [{
								model: models.tag,
								attributes: ['id'],
								include: [{
									model: models.tagdetail,
									attributes: ['title'],
									where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'),
									required: false
								}],
								required: false,
							}],
							required: false,
							where: {
								tagtypeId: 2
							},
						},
						{
							model: models.doctorexperience,
							attributes: ["id", "duration_from", "duration_to"],
							required: false
						}
					],
					required: false
				}],
				where: {
					hospitalId: req.id
				}
			})
		]).then(([data, hospital_timings, hospital_doctors]) => {
			let arrtag = [];
			if(data){
				data = JSON.parse(JSON.stringify(data)) || {};
				if(data.hospitalservices){
					arrtag = data.hospitalservices.map(item => item.tagId);
				}
			}
			data.hospital_timings = hospital_timings;
			data.hospital_doctors = hospital_doctors;
			Promise.all([
				tagtype.listByTypeAndTagsNew({body: {id: utils.getAllTagTypeId()['ServiceTagId'],tagIDS:arrtag}}),
				tagtype.listByTypeAndTagsNew({body: {id: utils.getAllTagTypeId()['SpecializationTagId'],tagIDS:arrtag}}),
				tagtype.listByTypeAndTagsNew({body: {id: utils.getAllTagTypeId()['MembershipsTagId'],tagIDS:arrtag}}),
				tagtype.listByTypeAndTagsNew({body: {id: utils.getAllTagTypeId()['InsuranceCompaniesTagId'],tagIDS:arrtag}})
			]).then(([service_tags, specialization_tags, membership_tags, insurance_comp_tags]) => {
				res({
					data,
					service_tags: {data: service_tags},
					specialization_tags: {data: specialization_tags},
					membership_tags: {data: membership_tags},
					insurance_comp_tags: {data: insurance_comp_tags}
				});
			}).catch(console.log);
		}).catch(console.log);
	};
}

module.exports = new Hospital();