'use strict';

const models = require('../models'),
	language = require('./language'),
	moment = require('moment');

function ClassReport() {
	this.list = function (req, res) {
		let pageSize = req.app.locals.site.page, // number of items per page
			page = req.query.page || 1;

		let reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
			where = {classreport: {}};

		if (reqData.masterId !== 1) {
			where.classreport = {masterId: reqData.masterId};
		}
		delete req.query.page;
		if (req.query) {
			Object.keys(req.query).forEach(key => {
				if (req.query[key] === '') return;
				where.classreport[key] = req.query[key];
			});
		}
		where.classreport.academicSessionId = reqData.academicSessionId;

		if(reqData.user_type === 'teacher') {
			where.classreport.userId = reqData.userId;
		}

		models.classreport.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.classreport.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		models.classreport.belongsTo(models.bcsmap, {foreignKey:'bcsMapId'});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		models.classreport.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);


		const bcsInclude = [
			{
				model: models.board,
				attributes: ['id'],
				include:[{
					model: models.boarddetail,
					where: language.buildLanguageQuery(
						{}, reqData.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
					),
					attributes: ['alias']
				}]
			},
			{
				model: models.classes,
				attributes: ['id'],
				include:[{
					model: models.classesdetail,
					where: language.buildLanguageQuery(
						{}, reqData.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
					),
					attributes: ['name']
				}]
			},
			{
				model: models.section,
				attributes: ['id'],
				include:[{
					model: models.sectiondetail,
					where: language.buildLanguageQuery(
						{}, reqData.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
					),
					attributes: ['name']
				}]
			}
		];

		Promise.all([
			models.classreport.findAndCountAll({
				include: [
					{
						model: models.user,
						include: [
							{
								model: models.userdetail,
								where: language.buildLanguageQuery(
									{}, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
								),
								attributes: ['fullname']
							}
						],
						attributes: ['id']
					},
					{
						model: models.bcsmap,
						attributes: ['id'],
						include: bcsInclude
					},
					{
						model: models.subject,
						include: [
							{
								model: models.subjectdetail,
								where: language.buildLanguageQuery(
									{}, reqData.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
								),
								attributes: ['name']
							}
						],
						attributes: ['id']
					}
				],
				where: where.classreport,
				order: [
					['id', 'DESC']
				],
				distinct: true,
				limit: pageSize,
				offset: (page - 1) * pageSize,
			})
		]).then(result => ({
			status: true,
			data: result[0].rows,
			totalData: result[0].count,
			pageCount: Math.ceil(result[0].count / pageSize),
			pageLimit: pageSize,
			currentPage: page,
		})).then(res).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: reqData.lang}), url: true}));
	};

	this.status = function (req, res) {
		models.classreport.update({
			is_locked: req.is_locked
		}, {
			where: {
				id: req.id, masterId: req.masterId
			}
		}).then(() => res({
			status: true,
			message: language.lang({key: 'updatedSuccessfully', lang: req.lang})
		}), () => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.view = function (req, res) {
		models.classreport.findOne({
			where: {
				masterId: req.masterId,
				academicSessionId: req.academicSessionId,
				userId: req.userId,
				bcsMapId: req.bcsMapId,
				subjectId: req.subjectId,
				date: req.date,
				order: req.order
			},
			attributes: ['id', 'content', 'is_locked'],
			order: [['id', 'DESC']]
		}).then(result => {
			if (result !== null) {
				res({status: true, report: result});
			} else {
				res({status: true, report: {content: '', is_locked: 0}});
			}
		}, () => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.save = function (req, res) {
		let where = {
			academicSessionId: req.academicSessionId,
			userId: req.userId,
			bcsMapId: req.bcsMapId,
			subjectId: req.subjectId,
			date: req.date,
			order: req.order
		};
		if (req.id) {
			where.id = req.id;
		}
		models.classreport.findOne({where: where, attributes: ['is_locked']})
		.then(data => {
			if (data && data.is_locked) {
				return res({
					status: false,
					message: language.lang({key: 'You can not edit this report', lang: req.lang})
				});
			}
			delete req.id;
			return models.classreport.upsert(req)
			.then(() => res({
				status: true,
				message: language.lang({key: 'addedSuccessfully', lang: req.lang})
			}));
		})
		.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.getById = function (req, res) {
		models.classreport.findOne({
			where: {
				id: req.id,
				masterId: req.masterId
			}
		}).then(data => res(data === null ? {status: false}: {status: true, data: data}))
		.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.meta = function (req) {
		return Promise.all([
			models.bcsmap.findAll({
				where: {masterId: req.masterId},
				include:
				[
					{
						model: models.board,
						attributes: ['id'],
						include:
						[
							{
								model: models.boarddetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`board`.`id`',
									models.boarddetail,
									'boardId'
								),
								attributes: ['alias']
							}
						]
					},
					{
						model: models.classes,
						attributes: ['id'],
						include:[
							{
								model: models.classesdetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`class`.`id`',
									models.classesdetail,
									'classId'
								),
								attributes: ['name']
							}
						]
					},
					{
						model: models.section,
						attributes: ['id'],
						include:[
							{
								model: models.sectiondetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`section`.`id`',
									models.sectiondetail,
									'sectionId'
								),
								attributes: ['name']
							}
						]
					}
				],
				attributes: ['id'],
				distinct: true,
				order: [
					['id', 'DESC']
				]
			}),
			models.user.findAll({
				where: {
					masterId: req.masterId,
					user_type: 'teacher'
				},
				include: [
					{
						model: models.userdetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`user`.`id`',
							models.userdetail,
							'userId'
						),
						attributes: ['fullname']
					}
				],
				attributes:['id'],
				distinct: true,
				order: [
					['id', 'DESC']
				]
			}),
			models.subject.findAll({
				where: {masterId: req.masterId},
				include: [
					{
						model: models.subjectdetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`subject`.`id`',
							models.subjectdetail,
							'subjectId'
						),
						attributes: ['name']
					}
				],
				attributes: ['id'],
				order: [
					['id', 'DESC']
				]
			})
		])
		.then(([bcsmaps, users, subjects]) => ({
			bcsmaps,
			users,
			subjects,
			status: true
		}));
	};
}

module.exports = new ClassReport();
