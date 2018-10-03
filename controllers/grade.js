'use strict';

const models = require('../models'),
	language = require('./language');

models.grade.hasMany(models.bcsmap);

models.bcsmap.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.bcsmap.belongsTo(models.classes);
models.classes.hasMany(models.classesdetail);
models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);

exports.list = function (req) {
	var pageSize = req.app.locals.site.page, // number of items per page
		page = req.query.page || 1;
	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body;
	let where =  {
		masterId: reqData.masterId
	};

	if (req.query.bcsMapId) {
		where.bcsMapId = models.sequelize.literal(
			'(SELECT count(*) FROM `bcs_maps` WHERE `bcs_maps`.`id` = '
			+ parseInt(req.query.bcsMapId) + ' AND `gradeId` = `grade`.`id`)'
		);
	}


	return models.grade.findAndCountAll({
		include: [
			{
				model: models.bcsmap,
				include: [
					{
						model: models.board,
						include:[
							{
								model: models.boarddetail,
								where: language.buildLanguageQuery(
									{}, req.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
								),
								attributes: ['alias'],
							}
						],
						attributes: ['id'],
					},
					{
						model: models.classes,
						include:[
							{
								model: models.classesdetail,
								where: language.buildLanguageQuery(
									{}, req.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
								),
								attributes: ['name'],
							}
						],
						attributes: ['id'],
					},
					{
						model: models.section,
						include:[
							{
								model: models.sectiondetail,
								where: language.buildLanguageQuery(
									{}, req.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
								),
								attributes: ['name'],
							}
						],
						attributes: ['id'],
					}
				],
				attributes: ['id'],
			}
		],
		where,
		order: [
			['id', 'DESC']
		],
		limit: pageSize,
		distinct: true,
		offset: (page - 1) * pageSize
	})
		.then(result => ({
			status: true,
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage: page
		}));
};

exports.getById = function (req) {
	return Promise.all([
		models.grade.findOne({
			include:[{
				model: models.bcsmap,
				attributes: ['id']
			}],
			where: {
				id: req.id,
				masterId: req.masterId
			}
		}),
		exports.getMetaInformations(req)
	])
		.then(([data, bcsmaps]) => data === null
			? {
				status:false,
				error: true,
				error_description: language.lang({
					key: 'Internal Error',
					lang: req.lang
				}),
				url: true
			} : {
				status: true,
				data,
				bcsmaps
			}
		);
};

exports.save = function (req) {
	if (req.id) {
		return updateGrade(req);
	} else {
		return createNewGrade(req);
	}
};

exports.remove = function (req) {
	return Promise.all([
		models.grade.destroy({
			where: {
				id: req.id
			}
		}),
		models.bcsmap.update({
			gradeId: null
		}, {
			where: {gradeId: req.id}
		})
	])
		.then(() => ({
			status: true,
			message: language.lang({key:'deletedSuccessfully', lang: req.lang})
		}));
};

exports.getMetaInformations = function (req) {
	var where = {
		is_active: 1,
		masterId: req.masterId
	};

	if (req.id) {
		where.$or = [{gradeId: req.id}, {gradeId: null}];
	} else {
		where.gradeId = null;
	}

	return models.bcsmap.findAll({
		include: [{
			model: models.board,
			attributes: ['id'],
			include:[{
				model: models.boarddetail,
				where: language.buildLanguageQuery(
					{}, req.langId, '`board`.`id`', models.boarddetail, 'boardId'
				),
				attributes: ['alias']
			}]
		}, {
			model: models.classes,
			attributes: ['id'],
			include:[{
				model: models.classesdetail,
				where: language.buildLanguageQuery(
					{}, req.langId, '`class`.`id`', models.classesdetail, 'classId'
				),
				attributes: ['name']
			}]
		}, {
			model: models.section,
			attributes: ['id'],
			include:[{
				model: models.sectiondetail,
				where: language.buildLanguageQuery(
					{}, req.langId, '`section`.`id`', models.sectiondetail, 'sectionId'
				),
				attributes: ['name']
			}]
		}],
		where,
		order: [
			[models.board, 'display_order'],
			[models.classes, 'display_order'],
			['id', 'DESC']
		],
		attributes: ['id'],
	});
};

function createNewGrade(req) {
	if (!(req.bcsmaps instanceof Array)) {
		if (req.bcsmaps)
			req.bcsmaps = req.bcsmaps.split(',');
		else
			req.bcsmaps = [];
	}
	return models.grade.create(req)
		.then(grade => models.bcsmap.update(
			{gradeId: grade.id},
			{where: {id: {$in: req.bcsmaps}}}
		))
		.then(() => ({
			status: true,
			message: language.lang({key:'addedSuccessfully', lang: req.lang})
		}));
}

function updateGrade(req) {
	return models.grade.findById(req.id)
		.then(grade => {
			if (grade === null) throw 'grade not found';
			var updates = [grade.update(req)];
			if (!(req.bcsmaps instanceof Array)) {
				if (req.bcsmaps)
					req.bcsmaps = req.bcsmaps.split(',');
				else
					req.bcsmaps = [];
			}
			updates.push(
				models.bcsmap.update({gradeId: null}, {where: {gradeId: req.id}})
					.then(() => req.bcsmaps.length
						? models.bcsmap.update({gradeId: req.id}, {where: {id: {$in: req.bcsmaps}}})
						: Promise.resolve(true)
					)
			);
			return Promise.all(updates);
		})
		.then(() => ({
			status: true,
			message: language.lang({key:'updatedSuccessfully', lang: req.lang})
		}));
}