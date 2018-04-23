var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var mail = require('./mail');
var bcrypt = require('bcrypt-nodejs');
var randomstring = require("randomstring");
var moment = require('moment');
var utils = require('./utils');
var crypto = require('crypto');
var roles = require('./role');
var subscription = require('./subscription');

function myController() {
	/*
	 * save
	 */
	this.save = function (req, res) {

		if (typeof req.is_active === 'undefined') {
			req.is_active = 1;
		}

		req.user_detail = {}
		var UserHasOne = models.user.hasOne(models.userdetail, {
			as: 'user_detail'
		});
		var PatientHasOne = models.patient.hasOne(models.patientdetail, {
			as: 'patient_detail'
		});
		req.user_detail.languageId = req.langId;
		req.user_detail.fullname = req.name;
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
				})
				//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error11", lang: req.lang}), url: true}));
			},

			function (callback) {
				userDetails.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
					console.log('---get userDetails----');
				}).catch(() => res({
					status: false,
					error: true,
					error_description: language.lang({
						key: "Internal Error22",
						lang: req.lang
					}),
					url: true
				}));
			}
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function (elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				if (typeof req.password !== 'undefined') {
					req.password = bcrypt.hashSync(req.password, null, null);
				}
				delete req.confirm_password;
				if (typeof req.id !== 'undefined' && req.id !== '') {
					if (req.is_active === 0) {
						oauth.removeToken({
							id: req.id
						}, function () {});
					}
					req.user_detail.userId = req.id;
					models.user.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function (data) {
						models.userdetail.find({
							where: {
								userId: req.id,
								languageId: req.langId
							}
						}).then(function (resultData) {
							if (resultData !== null) {
								req.user_detail.id = resultData.id;
								models.userdetail.update(req.user_detail, {
									where: {
										id: resultData.id,
										userId: req.id,
										languageId: req.langId
									}
								}).then(function () {
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
							} else {
								delete req.user_detail.id;
								models.userdetail.create(req.user_detail).then(function () {
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
					var langId = parseInt(req.user_detail.languageId);
					module.exports.createUserName({
						fullname: req.user_detail.fullname
					}, function (username) {

						req.user_name = username;
						models.user.create(req, {
							include: [UserHasOne],
							individualHooks: true
						}).then(function (data) {

							//blank entry in patient table 
							//if(req.user_type == 'Patient'){
							var patient_save = {
								userId: data.id,
								patient_detail: {
									languageId: req.langId
								}
							};
							models.patient.create(patient_save, {
								include: [PatientHasOne],
								individualHooks: true
							}).then(function (patientdata) {
								//}
								username = data.user_name;
								if (langId === 1) {
									module.exports.getProfileById({
										userId: data.id,
										langId: langId
									}, function (userInfo) {
										res({
											status: true,
											message: language.lang({
												key: "addedSuccessfully",
												lang: req.lang
											}),
											data: userInfo.data
										});
									})

								} else {
									req.user_detail.userId = data.id;
									req.user_detail.languageId = 1;
									models.userdetail.create(req.user_detail).then(function () {
										var mailData = {
											email: req.email,
											subject: language.lang({
												key: "registrationDetails",
												lang: req.lang
											}),
											list: {
												fullname: req.user_detail.fullname,
												username: data.username,
												email: req.email,
												password: passwordForMail,
												link: req.loginUrl
											}
										};
										mail.sendHtmlMail(mailData, req.lang);
										module.exports.getProfileById({
											userId: data.id,
											langId: langId
										}, function (userInfo) {
											res({
												status: true,
												message: language.lang({
													key: "addedSuccessfully",
													lang: req.lang
												}),
												data: userInfo
											});
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
					});

				}
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function (errors) {
					var newArr = {};
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	};

	this.webregister = function (req, res) {
		//console.log(req);process.exit()
		if (typeof req.is_active === 'undefined') {
			req.is_active = 1;
		}

		req.user_detail = {}
		var UserHasOne = models.user.hasOne(models.userdetail, {
			as: 'user_detail'
		});
		req.user_detail.languageId = req.langId;
		req.user_detail.fullname = req.name;
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
				})
				//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error11", lang: req.lang}), url: true}));
			},

			function (callback) {
				userDetails.validate().then(function (err) {
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
						key: "Internal Error22",
						lang: req.lang
					}),
					url: true
				}));
			}
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function (elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				if (typeof req.password !== 'undefined') {
					req.password = bcrypt.hashSync(req.password, null, null);
				}
				delete req.confirm_password;
				var langId = parseInt(req.user_detail.languageId);
				module.exports.createUserName({
					fullname: req.user_detail.fullname
				}, function (username) {

					req.user_name = username;
					models.user.create(req, {
						include: [UserHasOne],
						individualHooks: true
					}).then(function (data) {

						username = data.user_name;
						subscription.createTrialPlan({
							userId: data.id
						}).then(() => {
							if (langId === 1) {
								var mailData = {
									email: req.email,
									subject: language.lang({
										key: "registrationDetails",
										lang: req.lang
									}),
									list: {
										fullname: req.user_detail.fullname,
										email: req.email,
										password: passwordForMail,
										link: req.loginUrl
									}
								};
								mail.sendHtmlMail(mailData, req.lang);
								res({
									status: true,
									message: language.lang({
										key: "registrationSuccessfully",
										lang: req.lang
									}),
									data: data
								});
							} else {
								req.user_detail.userId = data.id;
								req.user_detail.languageId = 1;
								models.userdetail.create(req.user_detail).then(function () {
									var mailData = {
										email: req.email,
										subject: language.lang({
											key: "registrationDetails",
											lang: req.lang
										}),
										list: {
											fullname: req.user_detail.fullname,
											email: req.email,
											password: passwordForMail,
											link: req.loginUrl
										}
									};
									mail.sendHtmlMail(mailData, req.lang);
									res({
										status: true,
										message: language.lang({
											key: "registrationSuccessfully",
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
							}
						}).catch(console.log);
					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				});
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function (errors) {
					var newArr = {};
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	}


	this.doctorRegister = function (req, res) {
		req.loginUrl = '';
		if (typeof req.is_active === 'undefined') {
			req.is_active = 1;
		}

		req.user_detail = {}
		var UserHasOne = models.user.hasOne(models.userdetail, {
			as: 'user_detail'
		});
		req.user_detail.languageId = req.langId;
		req.user_detail.fullname = req.name;
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
				})
				//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error11", lang: req.lang}), url: true}));
			},

			function (callback) {
				userDetails.validate().then(function (err) {
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
						key: "Internal Error22",
						lang: req.lang
					}),
					url: true
				}));
			}
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function (elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				if (typeof req.password !== 'undefined') {
					req.password = bcrypt.hashSync(req.password, null, null);
				}
				delete req.confirm_password;
				if (typeof req.id !== 'undefined' && req.id !== '') {
					if (req.is_active === 0) {
						oauth.removeToken({
							id: req.id
						}, function () {});
					}
					req.user_detail.userId = req.id;
					models.user.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function (data) {
						models.userdetail.find({
							where: {
								userId: req.id,
								languageId: req.langId
							}
						}).then(function (resultData) {
							if (resultData !== null) {
								req.user_detail.id = resultData.id;
								models.userdetail.update(req.user_detail, {
									where: {
										id: resultData.id,
										userId: req.id,
										languageId: req.langId
									}
								}).then(function () {
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
							} else {
								delete req.user_detail.id;
								models.userdetail.create(req.user_detail).then(function () {
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
					var langId = parseInt(req.user_detail.languageId);
					module.exports.createUserName({
						fullname: req.user_detail.fullname
					}, function (username) {

						req.user_name = username;
						models.user.create(req, {
							include: [UserHasOne],
							individualHooks: true
						}).then(function (data) {

							username = data.user_name;
							subscription.createTrialPlan({
								userId: data.id
							}).then(() => {
								if (langId === 1) {
									var mailData = {
										email: req.email,
										subject: language.lang({
											key: "registrationDetails",
											lang: req.lang
										}),
										list: {
											fullname: req.user_detail.fullname,
											email: req.email,
											password: passwordForMail
										}
									};
									mail.sendHtmlMail(mailData, req.lang);
									res({
										status: true,
										message: language.lang({
											key: "registrationSuccessfully",
											lang: req.lang
										}),
										data: data
									});
								} else {
									req.user_detail.userId = data.id;
									req.user_detail.languageId = 1;
									models.userdetail.create(req.user_detail).then(function () {
										var mailData = {
											email: req.email,
											subject: language.lang({
												key: "registrationDetails",
												lang: req.lang
											}),
											list: {
												fullname: req.user_detail.fullname,
												email: req.email,
												password: passwordForMail
											}
										};
										mail.sendHtmlMail(mailData, req.lang);
										res({
											status: true,
											message: language.lang({
												key: "registrationSuccessfully",
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
								}
							}).catch(console.log);
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						}));
					});

				}
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function (errors) {
					var newArr = {};
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	}

	this.userupdate = function (req, res) {
		req.user_detail = {}
		var UserHasOne = models.user.hasOne(models.userdetail, {
			as: 'user_detail'
		});
		req.user_detail.languageId = req.langId;
		req.user_detail.fullname = req.name;
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

			function (callback) {
				userDetails.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
					console.log('---get userDetails----');
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
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function (elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {

				if (typeof req.id !== 'undefined' && req.id !== '') {

					req.user_detail.userId = req.id;
					models.user.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function (data) {
						models.userdetail.find({
							where: {
								userId: req.id,
								languageId: req.langId
							}
						}).then(function (resultData) {
							if (resultData !== null) {
								req.user_detail.id = resultData.id;
								models.userdetail.update(req.user_detail, {
									where: {
										id: resultData.id,
										userId: req.id,
										languageId: req.langId
									}
								}).then(function () {
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
							} else {
								delete req.user_detail.id;
								models.userdetail.create(req.user_detail).then(function () {
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
					var langId = parseInt(req.user_detail.languageId);
					module.exports.createUserName({
						fullname: req.user_detail.fullname
					}, function (username) {
						req.user_name = username;
						models.user.create(req, {
							include: [UserHasOne],
							individualHooks: true
						}).then(function (data) {
							if (langId === 1) {
								res({
									status: true,
									message: language.lang({
										key: "addedSuccessfully",
										lang: req.lang
									}),
									data: data
								});
							} else {
								req.user_detail.userId = data.id;
								req.user_detail.languageId = 1;
								models.userdetail.create(req.user_detail).then(function () {
									res({
										status: true,
										message: language.lang({
											key: "addedSuccessfully",
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
					});
				}
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function (errors) {



			errors = errors[0].message;
         var newArr = {status:false,message:errors,data:''};
        res(newArr);

				});
			}
		});
	};



	this.update_profile = function (req, res) {
		var user = models.user.build(req);
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
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function (elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {

				if (typeof req.id !== 'undefined' && req.id !== '') {
					models.user.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function (data) {
						module.exports.patientInfo({
							id: req.id,
							languageId: req.langId
						}, function (userInfo) {
							res({
								status: true,
								message: language.lang({
									key: "updatedSuccessfully",
									lang: req.lang
								}),
								data: userInfo
							});
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
				} else {
					res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					})
				}
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function (errors) {
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
	this.list = function (req, res) {
		//var data = JSON.parse(req.body.data);

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
		/*
		 * for  filltering
		 */
		var reqData = req.body;
		if (typeof req.body.data !== 'undefined') {
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			if (reqData.masterId !== 1) {
				responseData.user = {
					masterId: reqData.masterId
				};
				responseData.user.id = {
					$ne: 1
				};
				responseData.user.user_type = 'admin';
			} else {
				responseData.user = {
					id: {
						$ne: 1
					}
				};
				responseData.user.user_type = 'admin';
			}
			async.forEach(Object.keys(req.query), function (item, callback) {
				if (req.query[item] !== '') {
					var modelKey = item.split('__');
					if (typeof responseData[modelKey[0]] == 'undefined') {
						var col = {};
						col[modelKey[1]] = {
							$like: '%' + req.query[item] + '%'
						};
						responseData[modelKey[0]] = col;
					} else {
						responseData[modelKey[0]][modelKey[1]] = {
							$like: '%' + req.query[item] + '%'
						};
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
		models.user.belongsTo(models.role);
		models.role.hasMany(models.roledetail);

		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		isWhere.roledetail = language.buildLanguageQuery(
			isWhere.roledetail, reqData.langId, '`role`.`id`', models.roledetail, 'roleId'
		);

		models.user.findAndCountAll({
				include: [{
						model: models.userdetail,
						where: isWhere.userdetail
					},
					{
						model: models.role,
						include: [{
							model: models.roledetail,
							where: isWhere.roledetail
						}]
					}
				],
				where: isWhere.user,
				order: [
					['id', 'DESC']
				],
				distinct: true,
				limit: setPage,
				offset: pag,
				subQuery: false
			}).then(function (result) {
				var totalData = result.count;
				var pageCount = Math.ceil(totalData / setPage);
				res({
					data: result.rows,
					totalData: totalData,
					pageCount: pageCount,
					pageLimit: setPage,
					currentPage: currentPage
				});
			})
			.catch(() => res({
				status: false,
				error: true,
				error_description: language.lang({
					key: "Internal Error",
					lang: reqData.lang
				}),
				url: true
			}))
	};

	/*
	 * get By ID
	 */
	this.getById = function (req, res) {
		var isWhere = {};
		isWhere = language.buildLanguageQuery(
			isWhere, req.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		models.user.hasMany(models.userdetail);
		models.user.find({
				include: [{
					model: models.userdetail,
					where: isWhere
				}],
				where: {
					id: req.id
				}
			}).then(function (data) {
				res(data);
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
	 * status update
	 */
	this.status = function (req, res) {
		models.user.update(req, {
			where: {
				id: req.id
			}
		}).then(function (data) {
			oauth.removeToken(req, function (result) {
				res({
					status: true,
					message: language.lang({
						key: "updatedSuccessfully",
						lang: req.lang
					}),
					data: data
				});
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
	 * function login
	 */
	this.login = function (req, res) {
		var device_type = (typeof req.device_type === 'undefined') ? 'web' : req.device_type;
		var deviceType = (req.deviceType == 'DESKTOP') ? 'web' : device_type;
		var deviceId = (typeof req.deviceId === 'undefined') ? '' : req.deviceId;
		var usr = models.user.build(req);
		usr.validate().then(function (err) {
			if (err !== null) {
				language.errors({
					errors: err.errors,
					lang: req.lang
				}, function (errors) {
					err.errors = errors;
					res(err);
				});
			} else {

				var whereCondition = {
					$or: [{
						mobile: req.username
					}, {
						email: req.username
					}]
				};
				models.user.find({
					where: whereCondition,
					attributes: ['id', 'email', 'password', 'user_name', 'user_type', 'secondary_lang', 'roleId', 'default_lang', 'createdAt', 'is_active']
				}).then(function (userData) {
					if (userData === null) {
						res({
							status: false,
							message: language.lang({
								key: "invalid_detail",
								lang: req.lang
							})
						});
					} else {
						// if (userData.user_type !== 'Patient' || req.deviceType !== 'DESKTOP') {
						if (userData.is_active === 1) {
							if (!bcrypt.compareSync(req.userpassword, userData.password)) {
								res({
									status: false,
									message: language.lang({
										key: "invalid_detail",
										lang: req.lang
									})
								});
							} else {
								models.user.update({
									device_id: deviceId,
									device_type: deviceType
								}, {
									where: {
										id: userData.id
									}
								}).then(function () {
									module.exports.getProfileById({
										userId: userData.id,
										langId: userData.default_lang
									}, function (userInfo) {
										module.exports.useInfo({
											id: userData.id,
											languageId: userData.default_lang
										}, function (userDetails) {
											language.getUserLanguages(userData, function (langData) {
												language.geLanguageById({
													id: userData.default_lang
												}, function (primaryLang) {
													// module.exports.getModules({roleId:userData.roleId, id:userData.id},function(modules){
													userInfo.data.currency = '$';
													res({
														status: true,
														message: language.lang({
															key: "success",
															lang: req.lang
														}),
														data: userInfo.data,
														primaryLang: {
															code: primaryLang.code,
															name: primaryLang.name,
															direction: primaryLang.direction
														},
														languages: langData,
														servicePath: global.image_url,
														userdetails: userDetails
													});
													// });
												});
											});
										});
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
									key: "accountDeactivated",
									lang: req.lang
								})
							});
						}
						// } else {
						// res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang})});
						// }
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
	};

	/*
	 * get patient profile data
	 */
	this.getProfileById = function (req, res) {
		models.user.hasMany(models.userdetail);
		models.user.hasOne(models.patient, {
			foreignKey: 'userId'
		});
		models.patient.hasMany(models.patientdetail);
		models.patient.belongsTo(models.country);
		models.patient.belongsTo(models.state);
		models.patient.belongsTo(models.city);
		models.country.hasMany(models.countrydetail);
		models.state.hasMany(models.statedetail);
		models.city.hasMany(models.citydetail);
		models.patient.hasMany(models.patienttag);
		models.patienttag.belongsTo(models.tag);
		models.tag.hasMany(models.tagdetail);

		var isWhere = {};
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		isWhere.patientdetail = language.buildLanguageQuery(
			isWhere.patientdetail, req.langId, '`patient`.`id`', models.patientdetail, 'patientId'
		);
		isWhere.countrydetail = language.buildLanguageQuery(
			isWhere.countrydetail, req.langId, '`patient.country`.`id`', models.countrydetail, 'countryId'
		);
		isWhere.statedetail = language.buildLanguageQuery(
			isWhere.statedetail, req.langId, '`patient.state`.`id`', models.statedetail, 'stateId'
		);
		isWhere.citydetail = language.buildLanguageQuery(
			isWhere.citydetail, req.langId, '`patient.city`.`id`', models.citydetail, 'cityId'
		);

		Promise.all([
			models.user.find({
				include: [{
					model: models.userdetail,
					where: isWhere.userdetail,
					required: false
				}, {
					model: models.patient,
					include: [{
						model: models.patientdetail,
						where: isWhere.patientdetail,
						required: false
					}, {
						model: models.patienttag,
						include: [{
							model: models.tag,
							include: [{
								model: models.tagdetail,
								required: false
							}],
							required: false
						}],
						required: false
					}, {
						model: models.country,
						include: [{
							model: models.countrydetail,
							where: isWhere.countrydetail,
							required: false
						}],
						required: false
					}, {
						model: models.state,
						include: [{
							model: models.statedetail,
							where: isWhere.statedetail,
							required: false
						}],
						required: false
					}, {
						model: models.city,
						include: [{
							model: models.citydetail,
							where: isWhere.citydetail,
							required: false
						}],
						required: false
					}],
					required: false,
				}],
				where: {
					id: req.userId
				}
			}),
			models.subscriber.findOne({
				attributes: ['end_date'],
				where: {
					userId: req.userId,
					payment_status: 'success'
				},
				order: [
					['id', 'DESC']
				]
			})
		]).then(([data, subscriber]) => {
			data =JSON.parse(JSON.stringify(data));
			let subscription = false;
			if(subscriber) {
				subscription = moment(subscriber.end_date).isSameOrAfter(new Date());
			}
			data.subscription = subscription;
			res({
				status: true,
				message: 'Patient profile data',
				data: data
			});
		});
	};

	this.createUserName = function (req, res) {
		res(crypto.randomBytes(16).toString('hex'));
	};

	this.createUserNameImport = function (req, res) {
		res(crypto.randomBytes(16).toString('hex'));
	};

	this.useInfo = function (req, res) {
		var userInfo = {};
		var isWhere = {};
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.languageId, '`user`.`id`', models.userdetail, 'userId'
		);

		models.user.hasMany(models.userdetail);

		models.user.find({
			include: [{
				model: models.userdetail,
				where: isWhere.userdetail
			}],
			where: {
				id: req.id
			},
			attributes: ['id', 'email', 'password', 'user_name', 'user_type', 'secondary_lang', 'roleId', 'default_lang', 'createdAt', 'is_active']
		}).then(function (userData) {


			userInfo.userId = userData.id;
			userInfo.fullname = userData.userdetails[0].fullname;
			res(userInfo);

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

	this.patientInfo = function (req, res) {
		var userInfo = {};
		var isWhere = {};
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.languageId, '`user`.`id`', models.userdetail, 'userId'
		);
		models.user.hasMany(models.userdetail);
		models.user.find({
			include: [{
				model: models.userdetail,
				where: isWhere.userdetail
			}],
			where: {
				id: req.id
			},
			attributes: ['id', 'default_lang', 'user_image', 'user_type', 'mobile', 'email', 'user_name']
		}).then(function (userData) {
			userInfo.userId = userData.id;
			userInfo.user_image = userData.user_image;
			userInfo.fullname = userData.userdetails[0].fullname;
			res(userInfo);

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

	this.academicSession = function (req, res) {
		var isWhere = {};
		isWhere.academicsessiondetail = language.buildLanguageQuery(
			isWhere.academicsessiondetail, req.languageId, '`academicsession`.`id`', models.academicsessiondetail, 'academicSessionId'
		);
		models.academicsession.hasMany(models.academicsessiondetail);
		models.academicsession.findAll({
			where: {
				masterId: req.masterId,
				is_active: 1
			},
			attributes: ['id', 'start_date', 'end_date'],
			include: [{
				model: models.academicsessiondetail,
				where: isWhere.academicsessiondetail,
				attributes: ['name']
			}],
			order: [
				['id', 'DESC']
			]
		}).then(function (sessionData) {
			res(sessionData);
		});
	};

	/*
	 * function forgotpassword
	 */
	this.forgotpassword = function (req, res) {
		var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (req.email === '') {
			res({
				status: false,
				errors: [{
					path: "email",
					message: "This is a required field."
				}]
			});
		} else if(!re.test(req.email)) {
			res({
				status: false,
				errors: [{
					path: "email",
					message: language.lang({
						key: "isEmail",
						lang: req.lang
					})
				}]
			});
		} else {
			models.user.hasMany(models.userdetail);
			models.user.find({
				where: {
					email: req.email
				},
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId')
				}]
			}).then(function (userData) {
				if (!userData) {
					res({
						status: false,
						message: language.lang({
							key: "Email Id does not exist in our database.",
							lang: req.lang
						})
					});
				} else {
					var rstPswrdToken = randomstring.generate();
					var rstPswrdVrfUrl = req.resetPassUrl + rstPswrdToken;
					models.user.update({
						reset_password_token: rstPswrdToken
					}, {
						where: {
							id: userData.id
						}
					}).then(function () {
						var mailData = {
							email: userData.email,
							subject: language.lang({
								key: "Reset Password Request",
								lang: req.lang
							}),
							list: {
								username: req.email,
								link: rstPswrdVrfUrl,
								fullname: userData.userdetails[0].fullname
							}
						};
						mail.sendResetPasswordMail(mailData, req.lang);
						res({
							status: true,
							message: language.lang({
								key: "Reset password link has been sent to your email.",
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
	};

	/*
	 * function resetpassword
	 */
	this.resetpassword = function (req, res) {
		var usr = models.user.build(req);
		usr.validate().then(function (err) {
			if (err !== null) {
				language.errors({
					errors: err.errors,
					lang: req.lang
				}, function (errors) {
					err.errors = errors;
					res(err);
				});
			} else {
				models.user.find({
					where: {
						reset_password_token: req.reset_password_token
					}
				}).then(function (userData) {
					if (userData !== null) {
						var newPassword = bcrypt.hashSync(req.password, null, null);
						models.user.update({
							reset_password_token: '',
							password: newPassword
						}, {
							where: {
								reset_password_token: req.reset_password_token
							}
						}).then(function () {
							res({
								status: true,
								message: language.lang({
									key: "updatedPasswordSuccess",
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
					} else {
						res({
							status: false,
							message: language.lang({
								key: "Token has been expired.",
								lang: req.lang
							})
						});
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
	};

	this.getModules = function (req, res) {
		if (req.id == 1) {
			models.manager.findAll({
				attributes: ['module_name']
			}).then(function (data) {
				//res(data);
				var newData = {};
				async.forEach(data, function (item, callback) {
					newData[item.module_name] = item.module_name;
					callback();
				}, function () {
					res(newData);
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
		} else {
			models.rolepermission.belongsTo(models.permission);
			models.rolepermission.findAll({
				include: [{
					model: models.permission,
					attributes: ['action']
				}],
				where: {
					roleId: req.roleId
				},
				attributes: ['module_name']
			}).then(function (data) {
				//console.log(JSON.stringify(data, 0 ,4));
				var newData = {};
				async.forEach(data, function (item, callback) {
					if (typeof newData[item.module_name] == 'undefined') {
						newData[item.module_name] = [];
						newData[item.module_name].push(item.permission.action);
					} else {
						newData[item.module_name].push(item.permission.action);
					}
					callback();
				}, function () {
					res(newData);
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
	};

	/*
	 * Parent Registration
	 */
	this.parentRegistration = function (req, res) {
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}
		var UserHasOne = models.user.hasOne(models.userdetail, {
			as: 'user_detail'
		});
		req.user_detail.languageId = req.langId;
		req.user_type = 'parent';
		var langId = parseInt(req.user_detail.languageId);
		models.user.create(req, {
			include: [UserHasOne],
			individualHooks: true
		}).then(function (data) {
			if (langId === 1) {
				//var mailData = {email: req.email, subject: language.lang({key:"registrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl}};
				//mail.sendHtmlMail(mailData, req.lang);
				res(data.id);
			} else {
				req.user_detail.userId = data.id;
				req.user_detail.languageId = 1;
				models.userdetail.create(req.user_detail).then(function () {
					//var mailData = {email: req.email, subject: language.lang({key:"registrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl}};
					//mail.sendHtmlMail(mailData, req.lang);
					res(data.id);
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

	this.getSignUpMetaData = function (req, res) {
		roles.getSignupRoles(req, function (roles) {
			res({
				roles: roles
			});
		});
	}
	this.checkClaimStatus = function (req, res) {
		models.claimrequest.findOne({
			attributes: ['keyId', 'status'],
			where: {
				userId: req,
				model: 'doctorprofile',
				status: {
					$in: ['pending', 'approved']
				}
			},
		}).then(function (resData) {
			res({
				resData
			});
		})
	}
	/*
	 * function weblogin
	 */
	this.weblogin = function (req, res) {
		var device_type = (typeof req.device_type === 'undefined') ? 'web' : req.device_type;
		var deviceType = (req.deviceType == 'DESKTOP') ? 'web' : device_type;
		var deviceId = (typeof req.deviceId === 'undefined') ? '' : req.deviceId;
		var usr = models.user.build(req);
		usr.validate().then(function (err) {
			if (err !== null) {
				language.errors({
					errors: err.errors,
					lang: req.lang
				}, function (errors) {
					res(errors);
				});
			} else {
				var whereCondition = {
					$or: [{
						mobile: req.username
					}, {
						email: req.username
					}]
				};
				models.user.find({
					where: whereCondition,
					attributes: ['id', 'email', 'password', 'user_name', 'user_type', 'secondary_lang', 'roleId', 'default_lang', 'createdAt', 'is_active']
				}).then(function (userData) {
					if (userData === null) {
						res({
							status: false,
							message: language.lang({
								key: "Invalid Email Id or Mobile Number.",
								lang: req.lang
							})
						});
					} else {
						if(["admin", "doctor", "hospital", "doctor_clinic_both"].indexOf(userData.user_type) !== -1) {
							if (userData.is_active === 1) {
								if (!bcrypt.compareSync(req.userpassword, userData.password)) {
									res({
										status: false,
										errors: [{
											path: "userpassword",
											message: language.lang({
												key: "Incorrect password please try again.",
												lang: req.lang
											})
										}]
									});
								} else {
									models.user.update({
										device_id: deviceId,
										device_type: deviceType
									}, {
										where: {
											id: userData.id
										}
									}).then(function () {
										module.exports.getProfileById({
											userId: userData.id,
											langId: userData.default_lang
										}, function (userInfo) {
											delete userInfo.data.patient;
											module.exports.useInfo({
												id: userData.id,
												languageId: userData.default_lang
											}, function (userDetails) {
												module.exports.getAssociateProfile({
													id: userData.id,
													user_type: userData.user_type,
													lang: userData.default_lang
												}, function (associatedProfileData) {
													language.getUserLanguages(userData, function (langData) {
														language.geLanguageById({
															id: userData.default_lang
														}, function (primaryLang) {
															res({
																status: true,
																message: language.lang({
																	key: "success",
																	lang: req.lang
																}),
																data: userInfo.data,
																primaryLang: {
																	code: primaryLang.code,
																	name: primaryLang.name,
																	direction: primaryLang.direction
																},
																languages: langData,
																servicePath: global.image_url,
																userdetails: userDetails,
																associatedProfileData: associatedProfileData.data,
																allHospitalProfiles: associatedProfileData.allHospitalProfiles,
																currency: '$'
															});
														});
													});
												});
											});
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
										key: "accountDeactivated",
										lang: req.lang
									})
								});
							}
						} else {
							res({
								status: false,
								message: language.lang({
									key: "Invalid login details. Please check and try again.",
									lang: req.lang
								})
							});
						}
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
	};

	this.getAssociateProfile = function (req, res) {
		//{user_type, id}
		if (req.user_type === 'admin') {
			res({
				data: null
			});
		} else {
			let getModel;
			(req.user_type === 'doctor' || req.user_type === 'doctor_clinic_both') && (getModel = 'doctorprofile');
			req.user_type === 'hospital' && (getModel = 'hospital');

			if (req.user_type === 'doctor' || req.user_type === 'doctor_clinic_both') {
				models.doctorprofile.findOne({
					attributes: ["id", "claim_status", "is_active", "is_complete", "is_live", "verified_status"],
					where: {
						userId: req.id
					}
				}).then(function (data) {
					if (req.user_type === 'doctor_clinic_both') {
						//to find all hospital profiles of user
						models.hospital.hasMany(models.hospitaldetail);
						models.hospital.findAll({
							attributes: ["id", "claim_status", "is_active", "is_complete", "is_live", "verified_status"],
							include: [{
								model: models.hospitaldetail,
								attributes: ["hospital_name"],
								where: language.buildLanguageQuery({}, req.lang, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
							}],
							where: {
								userId: req.id
							}
						}).then(function (allProfiles) {
							res({
								data: data,
								allHospitalProfiles: allProfiles
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
					} else {
						res({
							data: data,
							allHospitalProfiles: null
						});
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
			} else if (req.user_type === 'hospital') {
				models.hospital.findOne({
					attributes: ["id", "claim_status", "is_active", "is_complete", "is_live", "verified_status"],
					where: {
						userId: req.id,
						headId: null
					}
				}).then(function (data) {
					//to find all hospital profiles of user
					models.hospital.hasMany(models.hospitaldetail);
					models.hospital.findAll({
						attributes: ["id", "claim_status", "is_active", "is_complete", "is_live", "verified_status"],
						include: [{
							model: models.hospitaldetail,
							attributes: ["hospital_name"],
							where: language.buildLanguageQuery({}, req.lang, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
						}],
						where: {
							userId: req.id
						}
					}).then(function (allProfiles) {
						res({
							data: data,
							allHospitalProfiles: allProfiles
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
			} else {
				res({
					data: null,
					allHospitalProfiles: null
				});
			}
		}
	}
}
module.exports = new myController();