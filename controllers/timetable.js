var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var notification = require('./notification');
var utils = require('./utils');

function Timetable() {

	this.dayAssign = function(req, res) {
		var count = 1;
		var dataObj = req.timetableallocationData;
		async.forEach(req.weekdays, function(item, callback) {
			dataObj.map(function(v) {
				v.weekday = item;
				v.timetableId = req.timetableId;
			});
			models.timetableallocation.bulkCreate(dataObj).then(function() {
				if (req.weekdays.length === count) {
					callback(dataObj);
				}
				count++;
			}).catch(() => res({
				status: false,
				error: true,
				error_description: language.lang({
					key: 'Internal Error',
					lang: req.lang
				}),
				url: true
			}));
		}, function() {
			res(dataObj);
		});
	};

	this.saveSubjectTeacher = function(req, res) {
		models.timetableallocation.update({
			subjectId: req.subjectId,
			teacherId: req.teacherId
		}, {
			where: {
				id: req.id
			}
		}).then(function(data) {
			res({
				status: true,
				message: language.lang({
					key: "updateSuccessfully",
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
		var reqData = req.body.data ? JSON.parse(req.body.data) : req.body;
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			responseData.timetable = {
				academicSessionId: reqData.academicSessionId
			};
			if (reqData.masterId !== 1) {
				responseData.timetable.masterId = reqData.masterId;
			}
			responseData.classesdetail = {};
			responseData.sectiondetail = {};
			responseData.boarddetail = {};
			async.forEach(Object.keys(req.query), function(item, callback) {
				if (req.query[item] !== '') {
					var modelKey = item.split('__');
					if (typeof responseData[modelKey[0]] == 'undefined') {
						var col = {};
						if (modelKey.length === 3) {
							col[modelKey[1]] = req.query[item];
						} else {
							col[modelKey[1]] = {
								$like: '%' + req.query[item] + '%'
							};
						}
						responseData[modelKey[0]] = col;
					} else {
						if (modelKey.length === 3) {
							responseData[modelKey[0]][modelKey[1]] = req.query[item];
						} else {
							responseData[modelKey[0]][modelKey[1]] = {
								$like: '%' + req.query[item] + '%'
							};
						}
					}
				}
				callback();
			}, function() {
				isWhere = responseData;
			});
		}
		//isWhere['delete'] = 1;
		orderBy = 'id DESC';

		isWhere.boarddetail = language.buildLanguageQuery(
			isWhere.boarddetail, reqData.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
		);
		isWhere.classesdetail = language.buildLanguageQuery(
			isWhere.classesdetail, reqData.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
		);
		isWhere.sectiondetail = language.buildLanguageQuery(
			isWhere.sectiondetail, reqData.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
		);
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, reqData.langId, '`teacher.user`.`id`', models.userdetail, 'userId'
		);

		models.timetable.belongsTo(models.bcsmap, {
			foreignKey: 'bcsMapId'
		});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);

		models.timetable.belongsTo(models.teacher, {
			foreignKey: 'classteacherId'
		});
		models.teacher.belongsTo(models.user);
		models.user.hasMany(models.userdetail);

		models.timetable.findAndCountAll({
			include: [{
				model: models.bcsmap,
				include: [{
					model: models.board,
					attributes: ['id'],
					include: [{
						model: models.boarddetail,
						attributes: ['id', 'name', 'alias'],
						where: isWhere.boarddetail
					}]
				}, {
					model: models.classes,
					attributes: ['id'],
					include: [{
						model: models.classesdetail,
						attributes: ['id', 'name'],
						where: isWhere.classesdetail
					}]
				}, {
					model: models.section,
					attributes: ['id'],
					include: [{
						model: models.sectiondetail,
						attributes: ['id', 'name'],
						where: isWhere.sectiondetail
					}]
				}],
			}, {
				model: models.teacher,
				attributes: ['id'],
				include: [{
					model: models.user,
					attributes: ['id'],
					include: [{
						model: models.userdetail,
						attributes: ['fullname'],
						where: isWhere.userdetail
					}]
				}]
			}],
			attributes: ['id', 'academicSessionId', 'classteacherId', 'bcsMapId', 'masterId', 'start_time', 'period_no', 'is_active'],
			where: isWhere.timetable,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag,
			subQuery: false,
		}).then(function(result) {
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);
			res({
				data: result.rows,
				totalData: totalData,
				pageCount: pageCount,
				pageLimit: setPage,
				currentPage: currentPage
			});
		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: reqData.lang
			}),
			url: true
		}));
	};

	/*
	 * get By ID
	 */
	this.getById = function(req, res) {
		models.timetable.hasMany(models.timetableallocation);
		models.timetableallocation.belongsTo(models.teacher);
		models.teacher.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.timetableallocation.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);

		models.timetable.belongsTo(models.bcsmap, {
			foreignKey: 'bcsMapId'
		});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		models.timetable.belongsTo(models.teacher, {
			foreignKey: 'classteacherId'
		});
		models.teacher.belongsTo(models.user);
		models.user.hasMany(models.userdetail);

		models.timetableallocation.belongsTo(models.tag);
		models.tag.hasMany(models.tagdetail);

		models.timetable.find({
			include: [
				{
					model: models.timetableallocation,
					include: [
						{
							model: models.teacher,
							attributes: ['id'],
							include: [{
								model: models.user,
								attributes: ['id'],
								include: [{
									model: models.userdetail,
									attributes: ['id', 'fullname'],
									where: language.buildLanguageQuery({}, req.langId, '`timetableallocations.teacher.user`.`id`', models.userdetail, 'userId'),
									required: false
								}],
								required: false
							}],
							required: false
						},
						{
							model: models.subject,
							attributes: ['id'],
							include: [{
								model: models.subjectdetail,
								attributes: ['id', 'name'],
								where: language.buildLanguageQuery({}, req.langId, '`timetableallocations.subject`.`id`', models.subjectdetail, 'subjectId'),
								required: false
							}],
							required: false
						},
						{
							model: models.tag,
							attributes: ['id'],
							include: [{
								model: models.tagdetail,
								attributes: ['id', 'title'],
								where: language.buildLanguageQuery({}, req.langId, '`timetableallocations.tag`.`id`', models.tagdetail, 'tagId'),
								required: false
							}],
							required: false
						}
					],
					required: false
				},
				{
					model: models.bcsmap,
					include: [{
						model: models.board,
						attributes: ['id'],
						include: [{
							model: models.boarddetail,
							attributes: ['id', 'name', 'alias'],
							where: language.buildLanguageQuery({}, req.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId')
						}]
					}, {
						model: models.classes,
						attributes: ['id'],
						include: [{
							model: models.classesdetail,
							attributes: ['id', 'name'],
							where: language.buildLanguageQuery({}, req.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId')
						}]
					}, {
						model: models.section,
						attributes: ['id'],
						include: [{
							model: models.sectiondetail,
							attributes: ['id', 'name'],
							where: language.buildLanguageQuery({}, req.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId')
						}]
					}],
				},
				{
					model: models.teacher,
					attributes: ['id'],
					include: [{
						model: models.user,
						attributes: ['id'],
						include: [{
							model: models.userdetail,
							attributes: ['id', 'fullname'],
							where: language.buildLanguageQuery({}, req.langId, '`teacher.user`.`id`', models.userdetail, 'userId')
						}]
					}]
				}
			],
			where: {
				id: req.id,
				academicSessionId: req.academicSessionId,
				masterId: req.masterId
			},
			order: [
				[models.timetableallocation, 'order', 'ASC'],
				// [ models.timetableallocation, 'end_time', 'ASC'],
				[models.timetableallocation, 'id', 'ASC']
			]
		}).then(function(data) {
			if (data === null || typeof data === 'undefined') {
				res({
					status: false,
					data: data
				});
			} else {
				res({
					status: true,
					data: data
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
	};

	/*
	 * get All Teacher
	 */
	this.getTeacherBySubjectId = function(req, res) {
		models.timetableallocation.belongsTo(models.timetable);
		models.timetableallocation.findAll({
			include: [{
				model: models.timetable,
				where: {
					academicSessionId: req.academicSessionId
				}
			}],
			where: {
				weekday: req.weekday,
				$or: [{
					start_time: {
						$lt: req.start_time
					},
					end_time: {
						$gt: req.start_time
					}
				}, {
					start_time: {
						$lt: req.end_time
					},
					end_time: {
						$gt: req.end_time
					}
				}, {
					start_time: {
						$gte: req.start_time
					},
					end_time: {
						$lte: req.end_time
					}
				}]
			}
		}).then(function(resultData) {
			var teacherIds = [0];
			var count = 1;
			var tId = parseInt(req.teacherId);
			async.forEach(resultData, function(item, callback) {
				if (item.teacherId !== tId && item.teacherId !== null) {
					teacherIds.push(item.teacherId);
				}
				if (resultData.length == count) {
					callback(teacherIds);
				}
				count++;
			}, function() {
				models.teachersubject.belongsTo(models.teacher);
				models.teacher.belongsTo(models.user);
				models.user.hasMany(models.userdetail);
				models.teachersubject.findAll({
					include: [{
						model: models.teacher,
						include: [{
							model: models.user,
							include: [{
								model: models.userdetail,
								where: language.buildLanguageQuery({}, req.langId, '`teacher.user`.`id`', models.userdetail, 'userId'),
								attributes: ['id', 'fullname']
							}],
							where: {
								is_active: 1
							},
							attributes: ['id']
						}],
						where: {
							id: {
								$notIn: teacherIds
							},
							masterId: req.id
						},
						attributes: ['id']
					}],
					attributes: ['id'],
					where: {
						subjectId: req.subjectId
					}
				}).then(function(data) {
					res({
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
	 * get ClassTeacher
	 */
	this.getClassTeacher = function(req, res) {
		models.timetable.findAll({
			where: {
				academicSessionId: req.academicSessionId,
				masterId: req.masterId
			},
			attributes: ['id', 'classteacherId']
		}).then(function(resultData) {
			var teacherIds = [0];
			var count = 1;
			async.forEach(resultData, function(item, callback) {
				if (item.classteacherId !== parseInt(req.classteacherId)) {
					teacherIds.push(item.classteacherId);
				}
				if (resultData.length == count) {
					callback(teacherIds);
				}
				count++;
			}, function() {
				models.teacher.belongsTo(models.user);
				models.user.hasMany(models.userdetail);
				models.teacher.findAll({
					include: [{
						model: models.user,
						include: [{
							model: models.userdetail,
							where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId'),
							attributes: ['id', 'fullname']
						}],
						where: {
							is_active: 1
						},
						attributes: ['id']
					}],
					where: {
						id: {
							$notIn: teacherIds
						},
						masterId: req.masterId
					},
					attributes: ['id']
				}).then(function(data) {
					res(data);
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
	 * status update
	 */
	this.status = function(req, res) {
		models.timetable.update(req, {
			where: {
				id: req.id,
				masterId: req.masterId
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

	this.timeShift = function(req, res) {
		var qry = '';
		var qryTa = '';
		qry = "SELECT group_concat(id) as tid FROM timetables WHERE masterId = ? AND academicSessionId = ?";
		models.sequelize.query(qry, {
			replacements: [req.masterId, req.academicSessionId],
			type: models.sequelize.QueryTypes.SELECT
		}).then(function(result) {
			//console.log(result[0].tid);
			//res({data:[], message:language.lang({key:"updatedSuccessfully", lang:req.lang}), status:true});
			if (req.shift_type == 'addtime') {
				qryTimetable = "UPDATE timetables set start_time = addtime(start_time, ?) WHERE FIND_IN_SET(id, ?)";
				qryTa = "UPDATE timetable_allocations set start_time = addtime(start_time, ?), end_time = addtime(end_time, ?) WHERE FIND_IN_SET(timetableId, ?)";
				models.sequelize.query(qryTimetable, {
					replacements: [req.time, result[0].tid]
				}).then(function() {
					models.sequelize.query(qryTa, {
						replacements: [req.time, req.time, result[0].tid]
					}).then(function(data) {
						res({
							data: data,
							message: language.lang({
								key: "updatedSuccessfully",
								lang: req.lang
							}),
							status: true
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
				qryTimetable = "UPDATE timetables set start_time = subtime(start_time, ?) WHERE FIND_IN_SET(id, ?)";
				qryTa = "UPDATE timetable_allocations set start_time = subtime(start_time, ?), end_time = subtime(end_time, ?) WHERE FIND_IN_SET(timetableId, ?)";
				models.sequelize.query(qryTimetable, {
					replacements: [req.time, result[0].tid]
				}).then(function() {
					models.sequelize.query(qryTa, {
						replacements: [req.time, req.time, result[0].tid]
					}).then(function(data) {
						res({
							data: data,
							message: language.lang({
								key: "updatedSuccessfully",
								lang: req.lang
							}),
							status: true
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
	 * Get Time Table Id By bcsmap Id
	 */
	this.getTimetableId = function(req, res) {
		models.timetable.find({
			where: {
				bcsMapId: req.bcsMapId,
				academicSessionId: req.academicSessionId
			},
			attributes: ['id']
		}).then(function(data) {
			if (data === null) {
				res({
					status: false,
					message: language.lang({
						key: "Time table not exist",
						lang: req.lang
					}),
					data: {}
				});
			} else {
				res({
					status: true,
					data: data.id
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
	};

	this.updateTable = function() {
		models.timetable.hasMany(models.timetableallocation);
		var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		models.timetable.findAll().then(function(data) {
			data.forEach(function(item) {
				weekdays.forEach(function(day) {
					models.timetableallocation.findAll({
						where: {
							timetableId: item.id,
							weekday: day
						}
					}).then(function(result) {
						var order = 1;
						var period = 1;
						result.forEach(function(itemta) {
							if (itemta.is_break !== 1) {
								models.timetableallocation.update({
									period: period,
									order: order
								}, {
									where: {
										id: itemta.id
									}
								});
								period++;
							} else {
								models.timetableallocation.update({
									period: 0,
									order: order
								}, {
									where: {
										id: itemta.id
									}
								});
							}
							order++;
						});
					});
				});
			});
		});
	};

	this.copyTimetable = function(req, res) {
		models.timetableallocation.belongsTo(models.timetable);
		models.timetableallocation.find({
			where: {
				id: req.taId
			}
		}).then(function(data) {
			if (data) {
				models.timetableallocation.findAll({
					where: {
						id: {
							$ne: data.id
						},
						timetableId: data.timetableId,
						start_time: data.start_time,
						end_time: data.end_time
					},
					attributes: ['id', 'weekday']
				}).then(function(result) {
					if (result) {
						var newData = [];
						result.forEach(function(item) {
							//-----------------START--------------
							newData.push(
								models.timetableallocation.count({
									include: [{
										model: models.timetable,
										where: {
											academicSessionId: req.academicSessionId,
											masterId: req.masterId
										}
									}],
									where: {
										weekday: item.weekday,
										teacherId: data.teacherId,
										$or: [{
											start_time: {
												$lt: data.start_time
											},
											end_time: {
												$gt: data.start_time
											}
										}, {
											start_time: {
												$lt: data.end_time
											},
											end_time: {
												$gt: data.end_time
											}
										}, {
											start_time: {
												$gte: data.start_time
											},
											end_time: {
												$lte: data.end_time
											}
										}]
									}
								}).then(function(resultData) {
									if (!resultData) {
										return models.timetableallocation.update({
											teacherId: data.teacherId,
											subjectId: data.subjectId
										}, {
											where: {
												id: item.id
											}
										}).then(function(finalResult) {
											return {
												id: item.id,
												weekday: item.weekday,
												status: true
											};
										}).catch(() => {
											return {
												id: item.id,
												weekday: item.weekday,
												status: false
											};
										});
									} else {
										return {
											id: item.id,
											weekday: item.weekday,
											status: false
										};
									}
								})
							);
						});
						Promise.all(
							newData
						).then(function(allResult) {
							res({
								status: false,
								message: language.lang({
									key: "updatedSuccessfully",
									lang: req.lang
								}),
								data: allResult
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
						//-------------------END---------------
					} else {
						res({
							status: false,
							message: language.lang({
								key: "Time table not exist",
								lang: req.lang
							}),
							data: {}
						});
					}
				});
			} else {
				res({
					status: false,
					message: language.lang({
						key: "Time table not exist",
						lang: req.lang
					}),
					data: {}
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
	};

	this.remove = function(req, res) {
		models.timetable.find({
			where: {
				id: req.id
			}
		}).then(function(data) {
			if (data) {
				Promise.all([
					models.attendance.count({
						where: {
							bcsMapId: data.bcsMapId,
							academicSessionId: data.academicSessionId
						}
					}),
					models.mark.count({
						where: {
							bcsMapId: data.bcsMapId,
							academicSessionId: data.academicSessionId
						}
					})
				]).then(function(result) {
					if (!(result[0] || result[1])) {
						Promise.all([
							models.timetable.destroy({
								where: {
									id: req.id
								}
							}),
							models.timetableallocation.destroy({
								where: {
									timetableId: req.id
								}
							})
						]).then(function() {
							res({
								status: true,
								message: language.lang({
									key: "deletedSuccessfully",
									lang: req.lang
								}),
								data: {}
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
								key: "You can't delete this, Its assign in other modules.",
								lang: req.lang
							}),
							data: {}
						});
					}
				});
			} else {
				res({
					status: false,
					message: language.lang({
						key: "Time table not exist",
						lang: req.lang
					}),
					data: {}
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
	};

	this.changeClassTeacher = function(req, res) {
		models.timetable.findAll({
			where: {
				academicSessionId: req.academicSessionId,
				masterId: req.masterId
			},
			attributes: ['id', 'classteacherId']
		}).then(function(resultData) {
			var teacherIds = [0];
			var count = 1;
			async.forEach(resultData, function(item, callback) {
				if (item.classteacherId !== parseInt(req.id)) {
					teacherIds.push(item.classteacherId);
				}
				if (resultData.length == count) {
					callback(teacherIds);
				}
				count++;
			}, function() {
				models.teacher.belongsTo(models.user);
				models.user.hasMany(models.userdetail);
				models.teacher.findAll({
					include: [{
						model: models.user,
						include: [{
							model: models.userdetail,
							where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId'),
							attributes: ['id', 'fullname']
						}],
						where: {
							is_active: 1
						},
						attributes: ['id']
					}],
					where: {
						id: {
							$notIn: teacherIds
						},
						masterId: req.masterId
					},
					attributes: ['id']
				}).then(function(data) {
					res({
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

	this.changeTeacher = function(req, res) {
		models.timetable.update({
			classteacherId: req.teacherId
		}, {
			where: {
				id: req.timetableId
			}
		}).then(function(result) {
			res({
				status: true,
				message: language.lang({
					key: "updatedSuccessfully",
					lang: req.lang
				}),
				data: result
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

	this.notification = function(req, res) {
		notification.getTeachersByTimetableId(req.id, req.academicSessionId).then(function(result) {
			notification.send(result, 'front/notification/timetable/teacher', {
				lang: req.lang
			}, {
				masterId: req.masterId,
				senderId: req.userId,
				data: {
					type: 'timetable'
				}
			});
			res({
				status: true,
				message: language.lang({
					key: "notificationSentSuccessfully",
					lang: req.lang
				}),
				data: []
			});
		});
	};

	this.getMetaInformations = function(req, res) {
		utils.getFilteredBcsByMasterId(req, function(bcsmaps) {
			module.exports.getClassTeacher(req, function(teachers) {
				res({
					bcsmaps: bcsmaps,
					teachers: teachers
				});
			});
		});
	};

	/*
	 * Update save function for react-redux admin
	 */
	this.newsave = function(req, res) {

		if (typeof req.is_active === 'undefined') {
			req.is_active = 1;
		}
		if (typeof req.weekday === 'undefined') {
			req.weekday = '';
		}
		if (typeof req.bcsMapId === 'undefined') {
			req.bcsMapId = '';
		}
		if (typeof req.classteacherId === 'undefined') {
			req.classteacherId = '';
		}
		req.start_time = moment(req.start_time, ["h:mm A"]).format('HH:mm');
		if (req.start_time == 'Invalid date') {
			req.start_time = '';
		}
		var weekdays = req.weekday;
		if (req.weekday !== '') {
			req.weekday = req.weekday.join();
		}

		var timetable = models.timetable.build(req);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([
			function(callback) {
				timetable.validate().then(function(err) {
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
						key: 'Internal Error',
						lang: req.lang
					}),
					url: true
				}));
			}
		], function(err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				var totalPeriods = parseInt(req.period_no);
				var timetableallocationData = [];
				for (let i = 1; i <= totalPeriods; i++) {
					let allocationObj = {
						start_time: null,
						end_time: null,
						is_break: 0,
						tagId: null,
						period: i,
						order: i,
						icon: 'fa-utensils'
					};
					timetableallocationData.push(allocationObj);
				}
				models.timetable.create(req).then(function(data) {
					module.exports.dayAssign({
						timetableId: data.id,
						weekdays: weekdays,
						timetableallocationData: timetableallocationData
					}, function() {
						res({
							status: true,
							message: language.lang({
								key: 'addedSuccessfully',
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
	};

	this.saveTimeSubjectTeacher = function(req, res) {

		if(!req.is_break) {
			req.is_break = 0;
			req.tagId = null;
		}

		models.timetableallocation.count({
			where: {
				timetableId: req.timetableId,
				weekday: req.weekday,
				id: {
					$ne: req.id
				},
				$or: [{
					start_time: {
						$lt: req.start_time
					},
					end_time: {
						$gt: req.start_time
					}
				}, {
					start_time: {
						$lt: req.end_time
					},
					end_time: {
						$gt: req.end_time
					}
				}, {
					start_time: {
						$gte: req.start_time
					},
					end_time: {
						$lte: req.end_time
					}
				}]
			}
		}).then(function(data) {
			if (data) {
				res({
					status: false,
					overlapped: language.lang({
						key: 'Time has overlapped.',
						lang: req.lang
					})
				});
			} else {
				models.timetableallocation.update({
					start_time: req.start_time,
					end_time: req.end_time,
					subjectId: req.subjectId,
					teacherId: req.teacherId,
					is_break: req.is_break,
					tagId: req.tagId,
					icon: req.icon
				}, {
					where: {
						id: req.id
					}
				}).then(function(data) {
					module.exports.getById({
						id: req.timetableId,
						masterId: req.masterId,
						academicSessionId: req.academicSessionId,
						langId: req.langId,
						lang: req.lang
					}, function(result) {
						res({
							status: true,
							message: language.lang({
								key: 'updateSuccessfully',
								lang: req.lang
							}),
							timetableallocations: result.data
						});
					});
				}).catch(() => res({
					status: false,
					error: true,
					error_description: language.lang({
						key: 'Internal Error',
						lang: req.lang
					}),
					url: true
				}));
			}
		});
	};

	this.copyTimetableNew = function(req, res) {
		models.timetableallocation.belongsTo(models.timetable);
		models.timetableallocation.find({
			where: {
				id: req.taId
			}
		}).then(function(data) {
			if (data) {
				models.timetableallocation.findAll({
					where: {
						id: {
							$ne: data.id
						},
						timetableId: data.timetableId,
						order: data.order
					},
					attributes: ['id', 'weekday'],
					order: [
						['id', 'DESC']
					]
				}).then(function(result) {
					if (result) {
						var newData = [];
						result.forEach(function(item) {
							//-----------------START--------------
							if(data.is_break === 1) {
								newData.push(
									models.timetableallocation.update({
										teacherId: null,
										subjectId: null,
										start_time: data.start_time,
										end_time: data.end_time,
										is_break: 1,
										tagId: data.tagId,
										icon: data.icon
									}, {
										where: {
											id: item.id
										}
									}).then(function(finalResult) {
										return {
											id: item.id,
											weekday: item.weekday,
											status: true
										};
									}).catch(() => {
										return {
											id: item.id,
											weekday: item.weekday,
											status: false
										};
									})
								);
							} else {
								newData.push(
									models.timetableallocation.count({
										include: [{
											model: models.timetable,
											where: {
												academicSessionId: req.academicSessionId,
												masterId: req.masterId
											}
										}],
										where: {
											weekday: item.weekday,
											teacherId: data.teacherId,
											$or: [{
												start_time: {
													$lt: data.start_time
												},
												end_time: {
													$gt: data.start_time
												}
											}, {
												start_time: {
													$lt: data.end_time
												},
												end_time: {
													$gt: data.end_time
												}
											}, {
												start_time: {
													$gte: data.start_time
												},
												end_time: {
													$lte: data.end_time
												}
											}]
										}
									}).then(function(resultData) {
										if (!resultData) {
											return models.timetableallocation.update({
												teacherId: data.teacherId,
												subjectId: data.subjectId,
												start_time: data.start_time,
												end_time: data.end_time,
												is_break: data.is_break,
												tagId: data.tagId,
												icon: data.icon
											}, {
												where: {
													id: item.id
												}
											}).then(function(finalResult) {
												return {
													id: item.id,
													weekday: item.weekday,
													status: true
												};
											}).catch(() => {
												return {
													id: item.id,
													weekday: item.weekday,
													status: false
												};
											});
										} else {
											return {
												id: item.id,
												weekday: item.weekday,
												status: false
											};
										}
									})
								);
							}
						});
						Promise.all(
							newData
						).then(function(allResult) {
							module.exports.getById({
								id: data.timetableId,
								masterId: req.masterId,
								academicSessionId: req.academicSessionId,
								langId: req.langId,
								lang: req.lang
							}, function(result) {
								res({
									status: true,
									data: allResult,
									timetableallocations: result.data
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
						//-------------------END---------------
					} else {
						res({
							status: false,
							message: language.lang({
								key: "Time table not exist",
								lang: req.lang
							}),
							data: {}
						});
					}
				});
			} else {
				res({
					status: false,
					message: language.lang({
						key: "Time table not exist",
						lang: req.lang
					}),
					data: {}
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
	};

	this.newTimeShift = function(req, res) {
		req.time = req.hour + ':' + req.minute + ':00';
		var qry = '';
		var qryTa = '';
		qry = "SELECT group_concat(id) as tid FROM timetables WHERE masterId = ? AND academicSessionId = ?";
		models.sequelize.query(qry, {
			replacements: [req.masterId, req.academicSessionId],
			type: models.sequelize.QueryTypes.SELECT
		}).then(function(result) {
			if (result[0].tid) {
				if (req.shift_type == 'addtime') {
					qryTimetable = "UPDATE timetables set start_time = addtime(start_time, ?) WHERE FIND_IN_SET(id, ?)";
					qryTa = "UPDATE timetable_allocations set start_time = addtime(start_time, ?), end_time = addtime(end_time, ?) WHERE start_time IS NOT NULL AND end_time IS NOT NULL AND FIND_IN_SET(timetableId, ?)";
					models.sequelize.query(qryTimetable, {
						replacements: [req.time, result[0].tid]
					}).then(function() {
						models.sequelize.query(qryTa, {
							replacements: [req.time, req.time, result[0].tid]
						}).then(function(data) {
							res({
								data: data,
								message: language.lang({
									key: "updatedSuccessfully",
									lang: req.lang
								}),
								status: true
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
					qryTimetable = "UPDATE timetables set start_time = subtime(start_time, ?) WHERE FIND_IN_SET(id, ?)";
					qryTa = "UPDATE timetable_allocations set start_time = subtime(start_time, ?), end_time = subtime(end_time, ?) WHERE start_time IS NOT NULL AND end_time IS NOT NULL AND FIND_IN_SET(timetableId, ?)";
					models.sequelize.query(qryTimetable, {
						replacements: [req.time, result[0].tid]
					}).then(function() {
						models.sequelize.query(qryTa, {
							replacements: [req.time, req.time, result[0].tid]
						}).then(function(data) {
							res({
								data: data,
								message: language.lang({
									key: "updatedSuccessfully",
									lang: req.lang
								}),
								status: true
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
				}
			} else {
				res({
					status: false,
					message: language.lang({
						key: "There is no timetable for update",
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
	};

	this.tags = (req, res) => {
		models.tag.hasMany(models.tagdetail);
		models.tag.findAll({
			include: [
				{
					model: models.tagdetail,
					attributes: ['id', 'title'],
					where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')
				}
			],
			where: {
				is_active: 1,
				type: 8,
				masterId: req.masterId
			}
		}).then(data => res({status: true, data}));
	};
}

module.exports = new Timetable();