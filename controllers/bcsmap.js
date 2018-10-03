const async = require('async');
const models = require('../models');
const language = require('./language');
const board = require('./board');
const classes = require('./class');
const section = require('./section');

function Bcsmap() {
	/*
	 * save
	*/
	this.save = function(req, res) {
		models.bcsmap.findOrCreate({
			where: {
				masterId: req.masterId,
				boardId: req.boardId,
				classId: req.classId,
				sectionId: req.sectionId,
			},
			defaults: {
				is_active: 1,
			},
		})
			.then(([bcsmap]) =>
				res({
					status: true,
					message: language.lang({
						key: 'Mapped Successfully',
						lang: req.lang,
					}),
					id: bcsmap.id,
				})
			)
			.catch(() => 
				res({
					status: false,
					error: true,
					error_description: language.lang({
						key: 'Internal Error',
						lang: req.lang
					}),
					url: true,
					code: 500,
				})
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
		* for	filltering
		*/
		var reqData = req.body;
		if (typeof req.body.data !== 'undefined') {
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			responseData.bcsmap = { masterId: reqData.masterId };
			async.forEach(
				Object.keys(req.query),
				function(item, callback) {
					if (req.query[item] !== '') {
						var modelKey = item.split('__');
						if (typeof responseData[modelKey[0]] == 'undefined') {
							var col = {};
							if (modelKey.length === 3) {
								col[modelKey[1]] = req.query[item];
							} else {
								col[modelKey[1]] = { $like: '%' + req.query[item] + '%' };
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
				},
				function() {
					isWhere = responseData;
				}
			);
		}
		//isWhere['delete'] = 1;
		orderBy = 'id DESC';

		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);

		isWhere.boarddetail = language.buildLanguageQuery(
			isWhere.boarddetail,
			reqData.langId,
			'`board`.`id`',
			models.boarddetail,
			'boardId'
		);
		isWhere.classesdetail = language.buildLanguageQuery(
			isWhere.classesdetail,
			reqData.langId,
			'`class`.`id`',
			models.classesdetail,
			'classId'
		);
		isWhere.sectiondetail = language.buildLanguageQuery(
			isWhere.sectiondetail,
			reqData.langId,
			'`section`.`id`',
			models.sectiondetail,
			'sectionId'
		);

		models.bcsmap
			.findAndCountAll({
				include: [
					{
						model: models.section,
						include: [
							{
								model: models.sectiondetail,
								where: isWhere.sectiondetail
							}
						]
					},
					{
						model: models.board,
						include: [
							{
								model: models.boarddetail,
								where: isWhere.boarddetail
							}
						]
					},
					{
						model: models.classes,
						include: [
							{
								model: models.classesdetail,
								where: isWhere.classesdetail
							}
						]
					}
				],
				where: isWhere.bcsmap,
				order: [['id', 'DESC']],
				distinct: true,
				limit: setPage,
				offset: pag,
				subQuery: false
			})
			.then(function(result) {
				var totalData = result.count;
				var pageCount = Math.ceil(totalData / setPage);
				board.getAllBoard(reqData, function(boards) {
					classes.getAllClasses(reqData, function(classes) {
						section.getAllSection(reqData, function(sections) {
							res({
								data: result.rows,
								totalData: totalData,
								pageCount: pageCount,
								pageLimit: setPage,
								currentPage: currentPage,
								boards: boards,
								classes: classes,
								sections: sections
							});
						});
					});
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
	 * get filtered sections
	*/

	this.getFilteredSections = function(req, res) {
		var isWhere = {};
		isWhere['is_active'] = 1;
		isWhere['masterId'] = req.masterId;
		models.section.hasMany(models.sectiondetail);

		var isWherelang = {};
		isWherelang.sectiondetail = language.buildLanguageQuery(
			isWhere.sectiondetail,
			req.langId,
			'`section`.`id`',
			models.sectiondetail,
			'sectionId'
		);

		models.sequelize
			.query(
				'select group_concat(sectionId) as sectionIds from bcs_maps where masterId = ? and boardId = ? and classId = ? ',
				{
					replacements: [req.masterId, req.boardId, req.classId],
					type: models.sequelize.QueryTypes.SELECT
				}
			)
			.then(function(sectionIdList) {
				if (sectionIdList[0].sectionIds !== null) {
					var ids = sectionIdList[0].sectionIds.split(',');
					isWhere['id'] = { $notIn: ids };
				}
				models.section
					.findAll({
						include: [
							{ model: models.sectiondetail, where: isWherelang.sectiondetail }
						],
						where: isWhere,
						order: [['display_order', 'ASC'], ['id', 'ASC']]
					})
					.then(function(data) {
						res({ data: data });
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
	};

	/*
	 * status update
	*/
	this.status = function(req, res) {
		models.bcsmap
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

	/*
	 * status update
	*/
	this.remove = function(req, res) {
		models.timetable
			.count({ where: { bcsMapId: req.id } })
			.then(count => {
				if (count) {
					res({
						status: false,
						message: language.lang({
							key:'Can not unmapped this class combination. It is being used by timetable',
							lang: req.lang
						})
					});
				} else {
					models.bcsmap
						.destroy({ where: { id: req.id } })
						.then(function(data) {
							res({
								status: true,
								message: language.lang({
									key: 'Unmapped Successfully',
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
	};

	this.boards = req =>
		models.board.findAll({
			include: [
				{
					model: models.boarddetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`board`.`id`',
						models.boarddetail,
						'boardId'
					),
					attributes: ['alias']
				}
			],
			where: {
				is_active: 1,
				masterId: req.masterId
			},
			attributes: ['id'],
			order: ['display_order']
		});

	this.all = req =>
		Promise.all([
			models.bcsmap.findAll({
				include: [
					{
						model: models.classes,
						attributes: []
					},
					{
						model: models.section,
						attributes: []
					}
				],
				where: {
					boardId: req.boardId,
					masterId: req.masterId
				},
				attributes: ['id', 'boardId', 'classId', 'sectionId', 'is_active'],
				order: [
					[models.classes, 'display_order'],
					['classId', 'DESC'],
					[models.section, 'display_order'],
					['sectionId', 'DESC']
				],
			}),
			models.classes.findAll({
				include: [
					{
						model: models.classesdetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`classes`.`id`',
							models.classesdetail,
							'classId'
						),
						attributes: ['id', 'name']
					}
				],
				where: {
					masterId: req.masterId
				},
				order: [['display_order'], ['id', 'DESC']],
			}),
			models.section.findAll({
				include: [
					{
						model: models.sectiondetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`section`.`id`',
							models.sectiondetail,
							'sectionId'
						),
						attributes: ['id', 'name']
					}
				],
				where: {
					masterId: req.masterId
				},
				order: [['display_order'], ['id', 'DESC']],
			})
		]).then(([bcsmaps, classes, sections]) => ({
			bcsmaps,
			classes,
			sections
		}));
}

module.exports = new Bcsmap();
