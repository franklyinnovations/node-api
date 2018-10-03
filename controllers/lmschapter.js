'use strict';

const models = require('../models'),
	language = require('./language');

models.lmschapter.hasMany(models.lmschapterdetail);
models.lmschapter.belongsTo(models.bcsmap);
models.lmschapter.belongsTo(models.subject);
models.lmschapter.hasMany(models.lmstopic);

models.lmstopic.hasMany(models.lmstopicdetail);
models.lmstopic.hasMany(models.lmstopicdocument);

models.subject.hasMany(models.subjectdetail);
models.bcsmap.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.bcsmap.belongsTo(models.classes);
models.classes.hasMany(models.classesdetail);
models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);

exports.list = function (req) {
	var pageSize = req.app.locals.site.page, // number of items per page
		page = req.query.page || 1;

	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
		where = {
			lmschapter: {
				masterId: reqData.masterId,
			}
		};
	if (req.query) {
		Object.keys(req.query).forEach(key => {
			if (req.query[key] === '') return;
			var modalKey = key.split('__');
			if (modalKey.length === 3) {
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = req.query[key];
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = req.query[key];
				}
			} else {
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				}
			}
		});
	}

	where.lmschapterdetail = language.buildLanguageQuery(
		where.lmschapterdetail, reqData.langId, '`lmschapter`.`id`', models.lmschapterdetail, 'lmschapterId'
	);
	where.subjectdetail = language.buildLanguageQuery(
		where.subjectdetail, reqData.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
	);
	where.boarddetail = language.buildLanguageQuery(
		where.boarddetail, reqData.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
	);
	where.classesdetail = language.buildLanguageQuery(
		where.classesdetail, reqData.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
	);
	where.sectiondetail = language.buildLanguageQuery(
		where.sectiondetail, reqData.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
	);

	return Promise.all([
		models.lmschapter.findAndCountAll({
			include: [
				{
					model: models.lmschapterdetail,
					where: where.lmschapterdetail,
					attributes: ['name', 'chapter_number']
				},
				{
					model: models.subject,
					attributes: ['id'],
					include: [{
						model: models.subjectdetail,
						attributes: ['name'],
						where: where.subjectdetail
					}],
					where: where.subject
				},
				{
					model: models.bcsmap,
					attributes: ['id'],
					include: [{
						model: models.board,
						attributes: ['id'],
						include: [{
							model: models.boarddetail,
							attributes: ['alias'],
							where: where.boarddetail
						}],
						where: where.board
					},{
						model: models.classes,
						attributes: ['id'],
						include: [{
							model: models.classesdetail,
							attributes: ['name'],
							where: where.classesdetail
						}],
						where: where.classes
					},{
						model: models.section,
						attributes: ['id'],
						include: [{
							model: models.sectiondetail,
							attributes: ['name'],
							where: where.sectiondetail
						}],
						where: where.section
					}],
					where: where.bcsmap
				}
			],
			where: where.lmschapter,
			attributes: [
				'id',
				'is_active',
				'bcsmapId',
				[
					models.sequelize.literal(
						'(SELECT COUNT(`id`) FROM `lms_topics` WHERE `lmschapterId` = `lmschapter`.`id`)'
					),
					'topics'
				],
			],
			order: [
				['id', 'DESC']
			],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false,
		}),
		exports.getMetaInformations(reqData)
	])
		.then(([result, {bcsmaps, subjects}]) => ({
			status: true,
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage: page,
			bcsmaps: bcsmaps,
			subjects: subjects,
		}));
};

exports.getById = function (req) {
	return Promise.all([
		models.lmschapter.findOne({
			where: {
				id: req.id,
				masterId: req.masterId
			},
			include:
			[
				{
					model: models.lmschapterdetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`lmschapter`.`id`',
						models.lmschapterdetail,
						'lmschapterId'
					)
				}
			]
		}),
		exports.getMetaInformations(req)
	])
		.then(([data, {bcsmaps, subjects}])=> ({status: true, data, bcsmaps, subjects}));
};

exports.save = function (req) {
	return Promise.all([
		models.lmschapter.build(req).validate(),
		models.lmschapterdetail.build(req.lmschapterdetail).validate()
	])
		.then(err => {
			if (err[0]) {
				if (err[1])
					return err[0].errors.concat(err[1].errors);
				else
					return err[0].errors;
			} else {
				if (err[1])
					return err[1].errors;
				else
					return null;
			}
		})
		.then(errors => {
			if (errors) {
				return new Promise((resolve) => {
					language.errors(
						{errors, lang: req.lang}
						, errors => resolve({errors})
					);
				});
			}
			if (req.id) {
				return updateChapter(req);
			} else {
				return createNewChapter(req);
			}
		});
};

exports.saveMany = async function (req) {
	let chapters = [];
	for (let i = 0; i < req.chapters.length; i++) {
		let chapter = req.chapters[i];
		chapters.push({
			id: '',
			masterId: req.masterId,
			is_active: chapter.is_active,
			lmschapterdetail: {
				id: '',
				name: chapter.name,
				chapter_number: chapter.chapter_number,
			},
		});
	}
	
	let [err, errs] = await Promise.all([
		models.lmschapter.build({
			bcsmapId: req.bcsmapId,
			subjectId: req.subjectId,
		}).validate(),
		Promise.all(chapters.map(chapter => Promise.all([
			models.lmschapter.build(chapter).validate(),
			models.lmschapterdetail.build(chapter.lmschapterdetail).validate(),
		]))),
	]);

	if (!err && !errs.some(([a, b]) => a || b)) {
		await Promise.all(chapters.map(chapter => {
			chapter.id = '';
			chapter.lang = req.lang;
			chapter.langId = req.langId;
			chapter.masterId = req.masterId;
			chapter.bcsmapId = req.bcsmapId;
			chapter.subjectId = req.subjectId;
			chapter.lmschapterdetail.id = '';
			return createNewChapter(chapter);
		}));
		return {
			status: true,
			message: language.lang({
				lang: req.lang,
				key: 'addedSuccessfully',
			}),
		};
	} else {
		return {
			errors: language.makeErrors([err], req.lang),
			chapters: errs.map(err => language.makeErrors(err, req.lang)),
		};
	}
};

exports.getMetaInformations = function (req) {
	return Promise.all([
		models.bcsmap.findAll({
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
			where: {
				is_active: 1,
				masterId: req.masterId
			},
			order: [
				[models.board, 'display_order'],
				['boardId', 'DESC'],
				[models.classes, 'display_order'],
				['classId', 'DESC'],
				[models.section, 'display_order'],
				['sectionId', 'DESC']
			],
			attributes: ['id']
		}),
		models.subject.findAll({
			include:[{
				model: models.subjectdetail,
				attributes: ['name'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
				)
			}],
			where: {
				is_active: 1,
				masterId: req.masterId
			},
		})
	])
		.then(([bcsmaps, subjects]) => ({bcsmaps, subjects}));
};

exports.status = function (req) {
	return Promise.all([
		models.lmschapter.update({
			is_active: req.is_active
		},{
			where: {
				id: req.id
			}
		})
	])
		.then(() => ({
			status: true,
			message: language.lang({key: 'updatedSuccessfully', lang: req.lang})
		}));
};

exports.topicList = function (req) {
	return Promise.all([
		models.lmstopic.findAll({
			where: {
				lmschapterId: req.lmschapterId,
				masterId: req.masterId
			},
			include:
			[
				{
					model: models.lmstopicdetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`lmstopic`.`id`',
						models.lmstopicdetail,
						'lmstopicId'
					)
				}
			],
			order: [['id', 'DESC']]
		})
	])
		.then(([data])=> ({status: true, data}));
};

exports.saveTopic = function (req) {
	if(!req.is_active) {
		req.is_active = 0;
	}
	return Promise.all([
		models.lmstopic.build(req).validate(),
		models.lmstopicdetail.build(req.lmstopicdetail).validate()
	])
		.then(err => {
			if (err[0]) {
				if (err[1])
					return err[0].errors.concat(err[1].errors);
				else
					return err[0].errors;
			} else {
				if (err[1])
					return err[1].errors;
				else
					return null;
			}
		})
		.then(errors => {
			if (errors) {
				return new Promise((resolve) => {
					language.errors(
						{errors, lang: req.lang}
						, errors => resolve({errors})
					);
				});
			}
			if (req.id) {
				return updateTopic(req);
			} else {
				return createNewTopic(req);
			}
		});
};

exports.topicstatus = function (req) {
	return Promise.all([
		models.lmstopic.update({
			is_active: req.is_active
		},{
			where: {
				id: req.id
			}
		})
	])
		.then(() => ({
			status: true,
			message: language.lang({key: 'updatedSuccessfully', lang: req.lang})
		}));
};

exports.getEditTopic = function (req) {
	return Promise.all([
		models.lmstopic.findOne({
			where: {
				id: req.id
			},
			include: [
				{
					model: models.lmstopicdetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`lmstopic`.`id`',
						models.lmstopicdetail,
						'lmstopicId'
					)
				}, {
					model: models.lmstopicdocument,
				}
			]
		})
	])
		.then(([data])=> ({status: true, data}));
};

exports.deleteTopic = function (req) {
	return Promise.all([
		models.lmstopic.destroy({
			where: {
				id: req.id
			}
		}),
		models.lmstopicdetail.destroy({
			where: {
				lmstopicId: req.id
			}
		}),
		models.lmstopicdocument.destroy({
			where: {
				lmstopicId: req.id
			},
			individualHooks: true
		})
	])
		.then(() => ({
			status: true,
			message: language.lang({key: 'deletedSuccessfully', lang: req.lang})
		}));
};

function createNewChapter(req) {
	req.lmschapterdetail.languageId = req.langId;
	req.lmschapterdetails = [models.lmschapterdetail.build(req.lmschapterdetail)];
	if (req.langId != 1) {
		var lmschapterdetail = JSON.parse(JSON.stringify(req.lmschapterdetail));
		lmschapterdetail.languageId = 1;
		req.lmschapterdetails.push(models.lmschapterdetail.build(lmschapterdetail));
	}

	return models.lmschapter.create(
		req,
		{
			include: [models.lmschapterdetail]
		}
	)
		.then(() => ({
			status: true,
			message: language.lang({key: 'addedSuccessfully', lang: req.lang})
		}));
}

function updateChapter(req) {
	return models.lmschapter.findById(req.id, {
		include:
		[
			{
				model: models.lmschapterdetail,
				where: {
					languageId: req.langId
				},
				required: false
			}
		]
	})
		.then(lmschapter => {
			if (lmschapter === null) throw 'chapter not found';
			var updates = [lmschapter.update(req)];
			if (lmschapter.lmschapterdetails.length === 0) {
				delete req.lmschapterdetail.id;
				req.lmschapterdetail.lmschapterId = lmschapter.id;
				req.lmschapterdetail.languageId = req.langId;
				updates.push(models.lmschapterdetail.create(req.lmschapterdetail));
			} else {
				updates.push(lmschapter.lmschapterdetails[0].update(req.lmschapterdetail));
			}
			
			return Promise.all(updates);
		})
		.then(() => ({
			status: true,
			message: language.lang({key: 'updatedSuccessfully', lang: req.lang})
		}));
}

function createNewTopic(req) {
	req.lmstopicdetail.languageId = req.langId;
	req.lmstopicdetails = [req.lmstopicdetail];
	if (req.langId != 1) {
		let lmstopicdetail = JSON.parse(JSON.stringify(req.lmstopicdetail));
		lmstopicdetail.languageId = 1;
		req.lmstopicdetails.push(lmstopicdetail);
	}
	delete req.lmstopicdetail;
	return models.lmstopic.create(
		req,
		{
			include: [
				{
					model: models.lmstopicdetail
				},
				{
					model: models.lmstopicdocument
				}
			],
			individualHooks: true
		}
	)
		.then(() => ({
			status: true,
			message: language.lang({key: 'addedSuccessfully', lang: req.lang})
		}));
}

function updateTopic(req) {
	return models.lmstopic.findById(req.id, {
		include:
		[
			{
				model: models.lmstopicdetail,
				where: {
					languageId: req.langId
				},
				required: false
			}
		]
	})
		.then(lmstopic => {
			if (lmstopic === null) throw 'chapter not found';
			var updates = [lmstopic.update(req)];
			if (lmstopic.lmstopicdetails.length === 0) {
				delete req.lmstopicdetail.id;
				req.lmstopicdetail.lmstopicId = lmstopic.id;
				req.lmstopicdetail.languageId = req.langId;
				updates.push(models.lmstopicdetail.create(req.lmstopicdetail));
			} else {
				updates.push(lmstopic.lmstopicdetails[0].update(req.lmstopicdetail));
			}

			if(req.lmstopicdocuments.length){
				for (var i = req.lmstopicdocuments.length - 1; i >= 0; i--) {
					req.lmstopicdocuments[i].lmstopicId = lmstopic.id;
				}
				updates.push(models.lmstopicdocument.bulkCreate(req.lmstopicdocuments, {individualHooks: true}));
			}

			let deletedDocuments = JSON.parse(req.deletedDocuments);
			if(deletedDocuments.length){
				updates.push(models.lmstopicdocument.destroy({
					where:{
						id:{$in:deletedDocuments}
					},
					individualHooks: true
				}));
			}
			
			return Promise.all(
				updates
			);
		})
		.then(() => ({
			status: true,
			message: language.lang({key: 'updatedSuccessfully', lang: req.lang})
		}));
}