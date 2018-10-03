const async = require("async");
const models = require("../models");
const language = require("./language");

function Section() {
	/*
	 * save
	*/
	this.save = function(req, res) {
		if (typeof req.is_active === "undefined") {
			req.is_active = 0;
		}
		var SectionHasOne = models.section.hasOne(models.sectiondetail, {
			as: "section_detail"
		});
		req.section_detail.languageId = req.langId;
		req.section_detail.masterId = req.masterId;
		var section = models.section.build(req);
		var sectionDetails = models.sectiondetail.build(req.section_detail);
		var errors = [];
		async.parallel(
			[
				function(callback) {
					section
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
									key: "Internal Error",
									lang: req.lang
								}),
								url: true
							})
						);
				},
				function(callback) {
					sectionDetails
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
									key: "Internal Error",
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
					if (typeof req.id !== "undefined" && req.id !== "") {
						req.section_detail.sectionId = req.id;
						models.section
							.update(req, { where: { id: req.id } })
							.then(function(data) {
								models.sectiondetail
									.find({
										where: { sectionId: req.id, languageId: req.langId }
									})
									.then(function(resultData) {
										if (resultData !== null) {
											req.section_detail.id = resultData.id;
											models.sectiondetail
												.update(req.section_detail, {
													where: {
														id: resultData.id,
														sectionId: req.id,
														languageId: req.langId
													}
												})
												.then(function() {
													res({
														status: true,
														message: language.lang({
															key: "updatedSuccessfully",
															lang: req.lang
														}),
														data: data,
														id: req.id,
														detailId: resultData.id,
													});
												})
												.catch(() =>
													res({
														status: false,
														error: true,
														error_description: language.lang({
															key: "Internal Error",
															lang: req.lang
														}),
														url: true
													})
												);
										} else {
											delete req.section_detail.id;
											models.sectiondetail
												.create(req.section_detail)
												.then(function(section_detail) {
													res({
														status: true,
														message: language.lang({
															key: "updatedSuccessfully",
															lang: req.lang
														}),
														data: data,
														detailId: section_detail.id,
														id: req.id,
													});
												})
												.catch(() =>
													res({
														status: false,
														error: true,
														error_description: language.lang({
															key: "Internal Error",
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
												key: "Internal Error",
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
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								})
							);
					} else {
						var langId = parseInt(req.section_detail.languageId);
						models.section
							.create(req, { include: [SectionHasOne] })
							.then(function(data) {
								if (langId === 1) {
									res({
										status: true,
										message: language.lang({
											key: "addedSuccessfully",
											lang: req.lang
										}),
										data: data,
										id: data.id,
										detailId: data.section_detail.id,
									});
								} else {
									req.section_detail.sectionId = data.id;
									req.section_detail.languageId = 1;
									models.sectiondetail
										.create(req.section_detail)
										.then(function() {
											res({
												status: true,
												message: language.lang({
													key: "addedSuccessfully",
													lang: req.lang
												}),
												data: data,
												id: data.id,
												detailId: data.section_detail.id,
											});
										})
										.catch(() =>
											res({
												status: false,
												error: true,
												error_description: language.lang({
													key: "Internal Error",
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
										key: "Internal Error",
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
		if (typeof req.query.page !== "undefined") {
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
		if (typeof req.body.data !== "undefined") {
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};
		var orderBy = "";
		if (req.query) {
			var responseData = {};
			if (reqData.masterId !== 1) {
				responseData.section = { masterId: reqData.masterId };
			}
			responseData.sectiondetail = {};
			async.forEach(
				Object.keys(req.query),
				function(item, callback) {
					if (req.query[item] !== "") {
						var modelKey = item.split("__");
						if (typeof responseData[modelKey[0]] == "undefined") {
							var col = {};
							col[modelKey[1]] = { $like: "%" + req.query[item] + "%" };
							responseData[modelKey[0]] = col;
						} else {
							responseData[modelKey[0]][modelKey[1]] = {
								$like: "%" + req.query[item] + "%"
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
		//isWhere['delete'] = 1;
		orderBy = "id DESC";

		models.section.hasMany(models.sectiondetail);

		isWhere.sectiondetail = language.buildLanguageQuery(
			isWhere.sectiondetail,
			reqData.langId,
			"`section`.`id`",
			models.sectiondetail,
			"sectionId"
		);

		models.section
			.findAndCountAll({
				include: [
					{ model: models.sectiondetail, where: isWhere.sectiondetail }
				],
				where: isWhere.section,
				order: [["id", "DESC"]],
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
						key: "Internal Error",
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
		models.section.hasMany(models.sectiondetail);
		models.section
			.find({
				include: [
					{
						model: models.sectiondetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							"`section`.`id`",
							models.sectiondetail,
							"sectionId"
						)
					}
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
						key: "Internal Error",
						lang: req.lang
					}),
					url: true
				})
			);
	};

	/*
	 * get All Sections
	*/
	this.getAllSection = function(req, res) {
		models.section.hasMany(models.sectiondetail);
		models.section
			.findAll({
				include: [
					{
						model: models.sectiondetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							"`section`.`id`",
							models.sectiondetail,
							"sectionId"
						)
					}
				],
				where: { is_active: 1, masterId: req.masterId },
				order: [["display_order", "ASC"], ["id", "ASC"]]
			})
			.then(function(data) {
				res(data);
			})
			.catch(() =>
				res({
					status: false,
					error: true,
					error_description: language.lang({
						key: "Internal Error",
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
		models.section
			.update(req, { where: { id: req.id, masterId: req.masterId } })
			.then(function(data) {
				res({
					status: true,
					message: language.lang({
						key: "updatedSuccessfully",
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
						key: "Internal Error",
						lang: req.lang
					}),
					url: true
				})
			);
	};

	this.remove = req => models.bcsmap.count({where: {sectionId: req.id}})
		.then(count => {
			if (count !== 0) {
				return {
					status: false,
					message: language.lang({
						key: 'Can not delete this section, It is being used.',
						lang: req.lang,
					}),
				};
			} else {
				return Promise.all([
					models.section.destroy({where: {id: req.id}}),
					models.sectiondetail.destroy({where: {sectionId: req.id}}),
				])
				.then(() => ({
					status: true,
					message: language.lang({
						key: 'deletedSuccessfully',
						lang: req.lang,
					}),
				}))
			}
		});
}

module.exports = new Section();
