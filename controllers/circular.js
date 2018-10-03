'use strict';

const models = require('../models'),
	language = require('./language'),
	notification = require('./notification');

models.circular.hasMany(models.circulardetail);
models.circular.hasMany(models.circularrecord);

models.bcsmap.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.bcsmap.belongsTo(models.classes);
models.classes.hasMany(models.classesdetail);
models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);

exports.list = function (req) {
	let pageSize = req.app.locals.site.page, // number of items per page
		page = req.query.page || 1;

	let reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
		where = {
			circular: {
				masterId: reqData.masterId,
				academicSessionId: reqData.academicSessionId
			}
		};
	if (req.query) {
		Object.keys(req.query).forEach(key => {
			if (req.query[key] === '') return;
			let modalKey = key.split('__');
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
		if (req.query.students)
			where.circular.students = models.sequelize.literal(
				'`circular`.`users` & ' + models.circular.STUDENT_MASK,
			);
		if (req.query.teachers)
			where.circular.teachers = models.sequelize.literal(
				'`circular`.`users` & ' + models.circular.TEACHER_MASK,
			);
		if (req.query.parents)
			where.circular.parents = models.sequelize.literal(
				'`circular`.`users` & ' + models.circular.PARENT_MASK,
			);
	}

	return models.circular.findAndCountAll({
		include: [
			{
				model: models.circulardetail,
				where: language.buildLanguageQuery(
					where.circulardetail,
					reqData.langId,
					'`circular`.`id`',
					models.circulardetail,
					'circularId'
				),
				attributes: ['details', 'title']
			},
			{
				model: models.circularrecord,
				where: where.circularrecord,
				attributes: [],
			},
		],
		where: where.circular,
		attributes: ['id', 'number', 'date', 'file'],
		order: [
			['id', 'DESC']
		],
		distinct: true,
		limit: pageSize,
		offset: (page - 1) * pageSize,
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
		models.circular.findOne({
			where: {
				id: req.id,
				masterId: req.masterId
			},
			include: [
				{
					model: models.circulardetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`circular`.`id`',
						models.circulardetail,
						'circularId'
					),
				},
				models.circularrecord
			]
		}),
		req.meta && exports.getMetaInformations(req)
	])
		.then(([data, bcsmaps])=> ({status: true, data, bcsmaps}));
};

exports.save = function (req) {
	req.users = 0;

	if (req.teachers) req.users = req.users | models.circular.TEACHER_MASK;
	if (req.students) req.users = req.users | models.circular.STUDENT_MASK;
	if (req.parents) req.users = req.users | models.circular.PARENT_MASK;

	return Promise.all([
		models.circular.build(req).validate(),
		models.circulardetail.build(req.circulardetail).validate()
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
				return updatecircular(req);
			} else {
				return createNewcircular(req);
			}
		});
};

exports.remove = function (req) {
	return Promise.all([
		models.circular.destroy({
			where: {
				id: req.id
			}
		}),
		models.circulardetail.destroy({
			where: {
				circularId: req.id
			}
		}),
		models.circularrecord.destroy({
			where: {
				circularId: req.id
			}
		})
	])
		.then(() => ({
			status: true,
			message: language.lang({key:'deletedSuccessfully', lang: req.lang})
		}));
};

exports.notification = function (req) {
	models.circular.findOne({
		where: {
			id: req.id
		},
		include: [
			{
				model: models.circulardetail,
				where: language.buildLanguageQuery(
					{},
					req.langId,
					'`circular`.`id`',
					models.circulardetail,
					'circularId'
				),
				attributes: ['title']
			},
			{
				model: models.circularrecord,
				attributes: ['bcsMapId']
			}
		],
		attributes: ['users']
	})
		.then(circular => {
			if (circular === null) throw 'circular not found';
			let bcsmapIds = null;
			if (circular.users & models.circular.STUDENT_MASK) {
				bcsmapIds = circular.circularrecords.map(circularrecord => circularrecord.bcsMapId);
			}

			if (circular.users & models.circular.PARENT_MASK) {
				if (bcsmapIds === null)
					bcsmapIds = circular.circularrecords.map(circularrecord => circularrecord.bcsMapId);
			}

			return Promise.all([
				Promise.resolve(circular),
				(circular.users & models.circular.TEACHER_MASK)
					? notification.getAllTeachers(req.masterId)
					: Promise.resolve(null),
				((circular.users & models.circular.STUDENT_MASK) && (bcsmapIds != null))
					? notification.getStudentsByBcsmapId(bcsmapIds, req.academicSessionId)
					: Promise.resolve(null),
				((circular.users & models.circular.PARENT_MASK) && (bcsmapIds != null))
					? notification.getParentByBcsmapId(bcsmapIds, req.academicSessionId)
					: Promise.resolve(null)
			]);
		})
		.then(([circular, teachers, students, parents]) => {
			let notifications = [],
				data = {
					lang: 'en',
					circularTitle: circular.circulardetails[0].title
				};

			if (teachers != null)
				notifications.push(
					notification.send(
						teachers,
						'front/notification/circular/teacher',
						data,
						{
							masterId: req.masterId,
							senderId: req.userId,
							data: {
								type: 'circular'
							}
						}
					)
				);
			if (students != null)
				notifications.push(
					notification.send(
						students,
						'front/notification/circular/student',
						data,
						{
							masterId: req.masterId,
							senderId: req.userId,
							data: {
								type: 'circular'
							}
						}
					)
				);
			if (parents != null)
				notifications.push(
					notification.send(
						parents,
						'front/notification/circular/parent',
						data,
						{
							masterId: req.masterId,
							senderId: req.userId,
							data: {
								type: 'circular'
							}
						}
					)
				);
			return Promise.all(notifications);
		});
	return {
		status: true,
		message: language.lang({key:'Notification Sent', lang: req.lang})
	};
};

exports.getMetaInformations = function (req) {
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
		where: {
			is_active: 1,
			masterId: req.masterId
		},
		order: [
			[models.board, 'display_order'],
			[models.classes, 'display_order'],
			[models.section, 'display_order'],
			['id', 'DESC'],
		],
		attributes: ['id']
	});
};

function createNewcircular(req) {
	req.circulardetail.languageId = req.langId;
	req.circulardetails = [req.circulardetail];
	if (req.langId != 1) {
		req.circulardetails.push({...req.circulardetail, languageId: 1});
	}
	req.circularrecords = [];
	if (!(req.bcsmaps instanceof Array)) {
		if (req.bcsmaps)
			req.bcsmaps = req.bcsmaps.split(',');
		else
			req.bcsmaps = [];
	}
	for (let i = req.bcsmaps.length - 1; i >= 0; i--) {
		req.circularrecords.push({
			bcsMapId: req.bcsmaps[i]
		});
	}

	return models.circular.create(
		req,
		{
			include: [models.circulardetail, models.circularrecord]
		}
	)
		.then(() => ({
			status: true,
			message: language.lang({key:'addedSuccessfully', lang: req.lang})
		}));
}

function updatecircular(req) {
	return models.circular.findById(req.id, {
		include: [
			{
				model: models.circulardetail,
				where: {
					languageId: req.langId
				},
				required: false
			},
			models.circularrecord
		]
	})
		.then(circular => {
			if (circular === null) throw 'circular not found';
			let updates = [circular.update(req)];
			if (circular.circulardetails.length === 0) {
				delete req.circulardetail.id;
				req.circulardetail.circularId = circular.id;
				req.circulardetail.languageId = req.langId;
				updates.push(models.circulardetail.create(req.circulardetail));
			} else {
				updates.push(circular.circulardetails[0].update(req.circulardetail));
			}
			req.circularrecords = [];

			let bcsmapIds = [];
			if (!(req.bcsmaps instanceof Array)) {
				if (req.bcsmaps)
					req.bcsmaps = req.bcsmaps.split(',')
				else
					req.bcsmaps = [];
			}
			for (let i = req.bcsmaps.length - 1; i >= 0; i--) {
				req.circularrecords.push({
					bcsMapId: req.bcsmaps[i],
					circularId: req.id
				});
				bcsmapIds.push(req.bcsmaps[i]);
			}
			updates.push(
				models.circularrecord.bulkCreate(req.circularrecords, {
					ignoreDuplicates: true
				})
					.then(circularrecords => bcsmapIds.length
						? models.circularrecord.destroy({
							where: {
								bcsMapId: {
									$notIn: bcsmapIds
								},
								circularId: req.id
							}
						})
						: models.circularrecord.destroy({
							where: {
								circularId: req.id
							}
						})
					)
			);
			return Promise.all(updates);
		})
		.then(() => ({
			status: true,
			message: language.lang({key:'updatedSuccessfully', lang: req.lang})
		}));
}