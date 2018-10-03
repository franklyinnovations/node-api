const async = require('async');
const models = require('../models');
const language = require('./language');

function Class() {
	/*
	 * save
	*/
	this.save = function(req, res) {
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}
		var classesHasOne = models.classes.hasOne(models.classesdetail, {
			as: 'class_detail'
		});
		req.class_detail.languageId = req.langId;
		req.class_detail.masterId = req.masterId;
		var classes = models.classes.build(req);
		var classesDetails = models.classesdetail.build(req.class_detail);
		var errors = [];
		// an example using an object instead of an array
		async.parallel(
			[
				function(callback) {
					classes
						.validate()
						.then(function(err) {
							if (err !== null) {
								errors = errors.concat(err.errors);
								callback(null, errors);
							} else {
								callback(null, errors);
							}
						})
						.catch(() =>
							res({
								status: false,
								error: true,
								error_description: language.lang({
									key: 'Internal Error',
									lang: req.lang
								}),
								url: true
							})
						);
				},
				function(callback) {
					classesDetails
						.validate()
						.then(function(err) {
							if (err !== null) {
								errors = errors.concat(err.errors);
								callback(null, errors);
							} else {
								callback(null, errors);
							}
						})
						.catch(() =>
							res({
								status: false,
								error: true,
								error_description: language.lang({
									key: 'Internal Error',
									lang: req.lang
								}),
								url: true
							})
						);
				}
			],
			function(err, errors) {
				var merged = [].concat.apply([], errors);
				var uniqueError = merged.filter(function(elem, pos) {
					return merged.indexOf(elem) == pos;
				});
				if (uniqueError.length === 0) {
					if (typeof req.id !== 'undefined' && req.id !== '') {
						req.class_detail.classId = req.id;
						models.classes
							.update(req, { where: { id: req.id } })
							.then(function(data) {
								models.classesdetail
									.find({ where: { classId: req.id, languageId: req.langId } })
									.then(function(resultData) {
										if (resultData !== null) {
											req.class_detail.id = resultData.id;
											models.classesdetail
												.update(req.class_detail, {
													where: {
														id: resultData.id,
														classId: req.id,
														languageId: req.langId
													}
												})
												.then(function() {
													res({
														status: true,
														message: language.lang({
															key: 'updatedSuccessfully',
															lang: req.lang
														}),
														id: req.id,
														detailId: resultData.id,
													});
												})
												.catch(() =>
													res({
														status: false,
														error: true,
														error_description: language.lang({
															key: 'Internal Error',
															lang: req.lang
														}),
														url: true
													})
												);
										} else {
											delete req.class_detail.id;
											models.classesdetail
												.create(req.class_detail)
												.then(function(class_detail) {
													res({
														status: true,
														message: language.lang({
															key: 'updatedSuccessfully',
															lang: req.lang
														}),
														id: req.id,
														detailId: class_detail.id,
													});
												})
												.catch(() =>
													res({
														status: false,
														error: true,
														error_description: language.lang({
															key: 'Internal Error',
															lang: req.lang
														}),
														url: true
													})
												);
										}
									})
									.catch(() =>
										res({
											status: false,
											error: true,
											error_description: language.lang({
												key: 'Internal Error',
												lang: req.lang
											}),
											url: true
										})
									);
							})
							.catch(() =>
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: 'Internal Error',
										lang: req.lang
									}),
									url: true
								})
							);
					} else {
						var langId = parseInt(req.class_detail.languageId);
						models.classes
							.create(req, { include: [classesHasOne] })
							.then(function(data) {
								if (langId === 1) {
									res({
										status: true,
										message: language.lang({
											key: 'addedSuccessfully',
											lang: req.lang
										}),
										id: data.id,
										detailId: data.class_detail.id,
									});
								} else {
									req.class_detail.classId = data.id;
									req.class_detail.languageId = 1;
									models.classesdetail
										.create(req.class_detail)
										.then(function() {
											res({
												status: true,
												message: language.lang({
													key: 'addedSuccessfully',
													lang: req.lang
												}),
												id: data.id,
												detailId: data.class_detail.id,
											});
										})
										.catch(() =>
											res({
												status: false,
												error: true,
												error_description: language.lang({
													key: 'Internal Error',
													lang: req.lang
												}),
												url: true
											})
										);
								}
							})
							.catch(() =>
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: 'Internal Error',
										lang: req.lang
									}),
									url: true
								})
							);
					}
				} else {
					language.errors({ errors: uniqueError, lang: req.lang }, function(
						errors
					) {
						var newArr = {};
						newArr.errors = errors;
						res(newArr);
					});
				}
			}
		);
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
		if (req.query) {
			var responseData = {};
			responseData.classes = { masterId: reqData.masterId };
			async.forEach(
				Object.keys(req.query),
				function(item, callback) {
					if (req.query[item] !== '') {
						var modelKey = item.split('__');
						if (typeof responseData[modelKey[0]] == 'undefined') {
							var col = {};
							col[modelKey[1]] = { $like: '%' + req.query[item] + '%' };
							responseData[modelKey[0]] = col;
						} else {
							responseData[modelKey[0]][modelKey[1]] = {
								$like: '%' + req.query[item] + '%'
							};
						}
					}
					callback();
				},
				function() {
					isWhere = responseData;
				}
			);
		}

		models.classes.hasMany(models.classesdetail);
		isWhere.classesdetail = language.buildLanguageQuery(
			isWhere.classesdetail,
			reqData.langId,
			'`classes`.`id`',
			models.classesdetail,
			'classId'
		);
		models.classes
			.findAndCountAll({
				include: [
					{
						model: models.classesdetail,
						where: isWhere.classesdetail,
						group: ['classId']
					}
				],
				where: isWhere.classes,
				order: [['id', 'DESC']],
				distinct: true,
				limit: setPage,
				offset: pag,
				subQuery: false
			})
			.then(function(result) {
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
			.catch(() =>
				res({
					status: false,
					error: true,
					error_description: language.lang({
						key: 'Internal Error',
						lang: reqData.lang
					}),
					url: true
				})
			);
	};

	/*
	 * get By ID
	*/
	this.getById = function(req, res) {
		var isWhere = {};
		isWhere.classesdetail = language.buildLanguageQuery(
			isWhere.classesdetail,
			req.langId,
			'`classes`.`id`',
			models.classesdetail,
			'classId'
		);
		models.classes.hasMany(models.classesdetail);
		models.classes
			.find({
				include: [
					{ model: models.classesdetail, where: isWhere.classesdetail }
				],
				where: {
					id: req.id,
					masterId: req.masterId
				}
			})
			.then(function(data) {
				res(data);
			})
			.catch(() =>
				res({
					status: false,
					error: true,
					error_description: language.lang({
						key: 'Internal Error',
						lang: req.lang
					}),
					url: true
				})
			);
	};

	/*
	 * get All Classes
	*/
	this.getAllClasses = function(req, res) {
		models.classes.hasMany(models.classesdetail);
		var isWhere = {};
		isWhere.classesdetail = language.buildLanguageQuery(
			isWhere.classesdetail,
			req.langId,
			'`classes`.`id`',
			models.classesdetail,
			'classId'
		);
		models.classes
			.findAll({
				include: [
					{ model: models.classesdetail, where: isWhere.classesdetail }
				],
				where: { is_active: 1, masterId: req.masterId },
				order: [['display_order', 'ASC'], ['id', 'ASC']]
			})
			.then(function(data) {
				res(data);
			})
			.catch(() =>
				res({
					status: false,
					error: true,
					error_description: language.lang({
						key: 'Internal Error',
						lang: req.lang
					}),
					url: true
				})
			);
	};

	/*
	 * status update
	*/
	this.status = function(req, res) {
		models.classes
			.update(req, { where: { id: req.id, masterId: req.masterId } })
			.then(function(data) {
				res({
					status: true,
					message: language.lang({
						key: 'updatedSuccessfully',
						lang: req.lang
					}),
					data: data
				});
			})
			.catch(() =>
				res({
					status: false,
					error: true,
					error_description: language.lang({
						key: 'Internal Error',
						lang: req.lang
					}),
					url: true
				})
			);
	};

	this.remove = req => models.bcsmap.count({where: {classId: req.id}})
		.then(count => {
			if (count !== 0) {
				return {
					status: false,
					message: language.lang({
						key: 'Can not delete this class, It is being used.',
						lang: req.lang,
					}),
				};
			} else {
				return Promise.all([
					models.classes.destroy({where: {id: req.id}}),
					models.classesdetail.destroy({where: {classId: req.id}}),
				])
					.then(() => ({
						status: true,
						message: language.lang({
							key: 'deletedSuccessfully',
							lang: req.lang,
						}),
					}));
			}
		});
}

module.exports = new Class();
