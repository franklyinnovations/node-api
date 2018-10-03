'use strict';

const models = require('../models'),
	language = require('./language'),
	moment = require('moment'),
	notification = require('./notification');

models.event.hasMany(models.eventdetail);
models.event.hasMany(models.eventrecord);
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
			event: {
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
			where.event.students = models.sequelize.literal(
				'`event`.`users` & ' + models.event.STUDENT_MASK,
			);
		if (req.query.teachers)
			where.event.teachers = models.sequelize.literal(
				'`event`.`users` & ' + models.event.TEACHER_MASK,
			);
		if (req.query.parents)
			where.event.parents = models.sequelize.literal(
				'`event`.`users` & ' + models.event.PARENT_MASK,
			);
	}

	if (where.event_time) {
		if (where.event_time.start) {
			if (moment(where.event_time.start).isValid()) {
				where.event.start = {
					$gte: where.event_time.start
				};
			}
		}

		if (where.event_time.end) {
			if (moment(where.event_time.end).isValid()) {
				where.event.end = {
					$lte: where.event_time.end
				};
			}
		}
	}

	return models.event.findAndCountAll({
		include: [
			{
				model: models.eventdetail,
				where: language.buildLanguageQuery(
					where.eventdetail,
					reqData.langId,
					'`event`.`id`',
					models.eventdetail,
					'eventId'
				),
				attributes: ['venue', 'title']
			},
			{
				model: models.eventrecord,
				where: where.eventrecord,
				attributes: [],
			},
		],
		where: where.event,
		attribute: ['id', 'start', 'end', 'file'],
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
		models.event.findOne({
			where: {
				id: req.id,
				masterId: req.masterId
			},
			include: [
				{
					model: models.eventdetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`event`.`id`',
						models.eventdetail,
						'eventId'
					),
				},
				models.eventrecord
			]
		}),
		req.meta && exports.getMetaInformations(req)
	])
		.then(([data, bcsmaps])=> ({status: true, data, bcsmaps}));
};

exports.save = function (req) {
	req.users = 0;

	if (req.teachers) req.users = req.users | models.event.TEACHER_MASK;
	if (req.students) req.users = req.users | models.event.STUDENT_MASK;
	if (req.parents) req.users = req.users | models.event.PARENT_MASK;

	return Promise.all([
		models.event.build(req).validate(),
		models.eventdetail.build(req.eventdetail).validate()
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
				return updateEvent(req);
			} else {
				return createNewEvent(req);
			}
		});
};

exports.remove = function (req) {
	return Promise.all([
		models.event.destroy({
			where: {
				id: req.id
			}
		}),
		models.eventdetail.destroy({
			where: {
				eventId: req.id
			}
		}),
		models.eventrecord.destroy({
			where: {
				eventId: req.id
			}
		})
	])
		.then(() => ({
			status: true,
			message: language.lang({key:'deletedSuccessfully', lang: req.lang})
		}));
};

exports.notification = function (req) {
	models.event.findOne({
		where: {
			id: req.id
		},
		include: [
			{
				model: models.eventdetail,
				where: language.buildLanguageQuery(
					{},
					req.langId,
					'`event`.`id`',
					models.eventdetail,
					'eventId'
				),
				attributes: ['title']
			},
			{
				model: models.eventrecord,
				attributes: ['bcsMapId']
			}
		],
		attributes: ['users']
	})
		.then(event => {
			if (event === null) throw 'event not found';
			let bcsmapIds = null;
			if (event.users & models.event.STUDENT_MASK) {
				bcsmapIds = event.eventrecords.map(eventrecord => eventrecord.bcsMapId);
			}

			if (event.users & models.event.PARENT_MASK) {
				if (bcsmapIds === null)
					bcsmapIds = event.eventrecords.map(eventrecord => eventrecord.bcsMapId);
			}

			return Promise.all([
				Promise.resolve(event),
				(event.users & models.event.TEACHER_MASK)
					? notification.getAllTeachers(req.masterId)
					: Promise.resolve(null),
				((event.users & models.event.STUDENT_MASK) && (bcsmapIds != null))
					? notification.getStudentsByBcsmapId(bcsmapIds, req.academicSessionId)
					: Promise.resolve(null),
				((event.users & models.event.PARENT_MASK) && (bcsmapIds != null))
					? notification.getParentByBcsmapId(bcsmapIds, req.academicSessionId)
					: Promise.resolve(null)
			]);
		})
		.then(([event, teachers, students, parents]) => {
			let notifications = [],
				data = {
					lang: 'en',
					eventTitle: event.eventdetails[0].title
				};

			if (teachers != null)
				notifications.push(
					notification.send(
						teachers,
						'front/notification/event/teacher',
						data,
						{
							masterId: req.masterId,
							senderId: req.userId,
							data: {
								type: 'event'
							}
						}
					)
				);
			if (students != null)
				notifications.push(
					notification.send(
						students,
						'front/notification/event/student',
						data,
						{
							masterId: req.masterId,
							senderId: req.userId,
							data: {
								type: 'event'
							}
						}
					)
				);
			if (parents != null)
				notifications.push(
					notification.send(
						parents,
						'front/notification/event/parent',
						data,
						{
							masterId: req.masterId,
							senderId: req.userId,
							data: {
								type: 'event'
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

function createNewEvent(req) {
	req.eventdetail.languageId = req.langId;
	req.eventdetails = [req.eventdetail];
	if (req.langId != 1) {
		req.eventdetails.push({...req.eventdetail, languageId: 1});
	}
	req.eventrecords = [];
	if (!(req.bcsmaps instanceof Array)) {
		if (req.bcsmaps)
			req.bcsmaps = req.bcsmaps.split(',');
		else
			req.bcsmaps = [];
	}
	for (let i = req.bcsmaps.length - 1; i >= 0; i--) {
		req.eventrecords.push({
			bcsMapId: req.bcsmaps[i]
		});
	}

	return models.event.create(
		req,
		{
			include: [models.eventdetail, models.eventrecord]
		}
	)
		.then(() => ({
			status: true,
			message: language.lang({key:'addedSuccessfully', lang: req.lang})
		}));
}

function updateEvent(req) {
	return models.event.findById(req.id, {
		include: [
			{
				model: models.eventdetail,
				where: {
					languageId: req.langId
				},
				required: false
			},
			models.eventrecord
		]
	})
		.then(event => {
			if (event === null) throw 'event not found';
			let updates = [event.update(req)];
			if (event.eventdetails.length === 0) {
				delete req.eventdetail.id;
				req.eventdetail.eventId = event.id;
				req.eventdetail.languageId = req.langId;
				updates.push(models.eventdetail.create(req.eventdetail));
			} else {
				updates.push(event.eventdetails[0].update(req.eventdetail));
			}
			req.eventrecords = [];

			let bcsmapIds = [];
			if (!(req.bcsmaps instanceof Array)) {
				if (req.bcsmaps)
					req.bcsmaps = req.bcsmaps.split(',')
				else
					req.bcsmaps = [];
			}
			for (let i = req.bcsmaps.length - 1; i >= 0; i--) {
				req.eventrecords.push({
					bcsMapId: req.bcsmaps[i],
					eventId: req.id
				});
				bcsmapIds.push(req.bcsmaps[i]);
			}
			updates.push(
				models.eventrecord.bulkCreate(req.eventrecords, {
					ignoreDuplicates: true
				})
					.then(eventrecords => bcsmapIds.length
						? models.eventrecord.destroy({
							where: {
								bcsMapId: {
									$notIn: bcsmapIds
								},
								eventId: req.id
							}
						})
						: models.eventrecord.destroy({
							where: {
								eventId: req.id
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