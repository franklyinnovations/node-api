'use strict';

const models = require('../models'),
	language = require('./language'),
	moment = require('moment'),
	notification = require('./notification');

models.complaint.hasMany(models.complaintrecord);
models.complaintrecord.belongsTo(models.student);
models.complaint.belongsTo(models.bcsmap);
models.complaint.belongsTo(models.user);

models.bcsmap.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.bcsmap.belongsTo(models.classes);
models.classes.hasMany(models.classesdetail);
models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);
models.tag.hasMany(models.tagdetail);

models.studentrecord.belongsTo(models.student);
models.student.hasMany(models.studentdetail);
models.student.belongsTo(models.user);
models.user.hasMany(models.userdetail);

exports.list = function (req) {
	let pageSize = req.app.locals.site.page, // number of items per page
		page = req.query.page || 1,
		reqData = req.body,
		where = {
			complaint: {
				masterId: reqData.masterId,
				academicsessionId: reqData.academicsessionId,
			},
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
	}

	return Promise.all([
		exports.getBcsmaps(req.body),
		models.complaint.findAndCountAll({
			include: [
				{
					model: models.user,
					attributes: ['id', 'user_type'],
				},
				{
					model: models.bcsmap,
					include: [
						{
							model: models.board,
							include: [
								{
									model: models.boarddetail,
									where: language.buildLanguageQuery(
										{},
										req.langId, 
										'`board`.`id`',
										models.boarddetail, 
										'boardId'
									),
									attributes:['alias'],
								}
							],
							attributes:['id'],
						},
						{
							model: models.classes,
							include: [
								{
									model: models.classesdetail,
									where: language.buildLanguageQuery(
										{}, 
										req.langId, 
										'`class`.`id`',
										models.classesdetail, 
										'classId'
									),
									attributes:['name'],
								}
							],
							attributes:['id'],
						},
						{
							model: models.section,
							include: [
								{
									model: models.sectiondetail,
									where: language.buildLanguageQuery(
										{}, 
										req.langId, 
										'`section`.`id`',
										models.sectiondetail, 
										'sectionId'
									),
									attributes:['name'],
								}
							],
							attributes:['id'],
						},
					],
					where: where.bcsmap,
					attributes: ['id'],
				}
			],
			where: where.complaint,
			attribute: ['id', 'is_active', 'is_penalty'],
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false
		})
	])
		.then(([bcsmaps, result]) => ({
			status: true,
			bcsmaps,
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage: page,
		}));
};
	
exports.tags = function (req) {
	return models.tag.findAll({
		include:[
			{
				model: models.tagdetail, 
				where: language.buildLanguageQuery(
					{}, 
					req.langId, 
					'`tag`.`id`', 
					models.tagdetail, 
					'tagId'
				),
			}
		],
		where:{
			masterId: req.masterId,
			type: 4,
			is_active: 1
		}
	});
};

exports.getBcsmaps = function (req) {
	return models.bcsmap.findAll({
		include: [
			{
				model: models.board,
				include: [
					{
						model: models.boarddetail,
						where: language.buildLanguageQuery(
							{},
							req.langId, 
							'`board`.`id`',
							models.boarddetail, 
							'boardId'
						),
						attributes:['alias'],
					}
				],
				attributes: ['id'],
			},
			{
				model: models.classes,
				include: [
					{
						model: models.classesdetail,
						attributes:['id', 'name'],
						where: language.buildLanguageQuery(
							{}, 
							req.langId, 
							'`class`.`id`',
							models.classesdetail, 
							'classId'
						)
					}
				],
				attributes :['id'],
			},
			{
				model: models.section,
				include: [
					{
						model: models.sectiondetail,
						where: language.buildLanguageQuery(
							{}, 
							req.langId, 
							'`section`.`id`',
							models.sectiondetail, 
							'sectionId'
						),
						attributes:['name'],
					}
				],
				attributes:['id'],
			},
		],
		where:{
			is_active: 1,
			masterId: req.masterId,
		},
		order: [
			[models.board, 'display_order'],
			[models.classes, 'display_order'],
			[models.section, 'display_order'],
			['id', 'DESC'],
		],
		attributes: ['id'],
	});
};

exports.getById = function (req) {
	return models.complaint.find({
		include:[
			{
				model: models.complaintrecord,
				include: [
					{
						model:models.student, 
						include:[
							{
								model:models.user, 
								include:[
									{
										model: models.userdetail,
										required: false,
										attributes:['id', 'fullname'],
									}
								],
								where:{
									'is_active':1
								},
								required: false,
								attributes:['id', 'mobile'],
							},
							{
								model:models.studentdetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`complaintrecords.student`.`id`',
									models.studentdetail,
									'studentId'
								),
								required: false,
								attributes:['id','father_name'],
							}
						],
						attributes: ['id','father_contact', 'enrollment_no'],
						required: false,
					},
				],
				attributes: ['studentId'],
			},
		],
		where: {
			id: req.id,
		},
	}).then(function (complaint) {
		if(complaint.tagIds){
			return models.tag.findAll({
				include: [
					{
						model: models.tagdetail, 
						where: language.buildLanguageQuery(
							{}, 
							req.langId, 
							'`tag`.`id`', 
							models.tagdetail, 
							'tagId'
						),
					}
				],
				where: {
					id: complaint.tagIds.split(','),
				},
			})
				.then(function(tags) {
					complaint = complaint.toJSON();
					complaint.tags = tags;
					return complaint;
				});
		} else {
			return complaint;
		}
	});
};

exports.getStudentsByBcsmap = function (req) {
	return models.studentrecord.scope(
		{ method: ['transferred', moment().format('YYYY-MM-DD')]},
		{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicsessionId]}
	).findAll({
		include: [
			{
				model: models.student, 
				attributes: ['id','father_contact', 'enrollment_no'],
				include: [
					{
						model:models.user, 
						include:[
							{
								model: models.userdetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`student.user`.`id`',
									models.userdetail,
									'userId'
								),
								attributes: ['id', 'fullname'],
							},
						],
						where: {is_active: 1},
						attributes:['id', 'user_image', 'mobile'],
					},
					{
						model: models.studentdetail, 
						where: language.buildLanguageQuery(
							{}, 
							req.langId,
							'`student`.`id`', 
							models.studentdetail,
							'studentId'
						),
						attributes: ['id','father_name', 'mother_name'],
					}
				],
			},
		],
		where: {
			masterId: req.masterId,
			academicsessionId: req.academicsessionId,
			bcsmapId: req.bcsmapId,
		},
		attributes: ['id'],
	})
		.then(data => ({data}));
};

exports.save = function (req) {
	if (req.tagIds instanceof Array) {
		req.tagIds = req.tagIds.join(',');
	}
	return models.complaint.build(req).validate()
		.then(err => err ? err.errors : null)
		.then(errors => {
			if (errors) {
				return new Promise((resolve) => {
					language.errors(
						{errors, lang: req.lang},
						errors => resolve({errors})
					);
				});
			} else {
				return createComplaintRecord(req);
			}
		});
};

function createComplaintRecord(req) {
	if(!(req.studentId instanceof Array)){
		req.studentId = [req.studentId];
	}
	req.complaintrecords = req.studentId.map(studentId => ({studentId}));
	return models.complaint.create(
		req,
		{
			include: [models.complaintrecord]
		}
	).then(() => {
		if (req.send_notification === '1') {
			exports.notification(req);	
		}
	})
		.then(() => ({
			status: true,
			message: language.lang({key:'addedSuccessfully', lang: req.lang})
		}));
}

exports.notification = function(req) {
	return models.sequelize.query(
		'SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` WHERE FIND_IN_SET\
		(`users`.`mobile`,(SELECT GROUP_CONCAT(`father_contact`,\',\'\
		,`father_contact_alternate`,\',\',`mother_contact`,\',\',\
		`mother_contact_alternate`,\',\',`guardian_contact`,\',\',\
		`guardian_contact_alternate`) FROM `students` WHERE `students`.`id` IN (?)))',
		{
			replacements: [req.studentId],
			type: models.sequelize.QueryTypes.SELECT,
		}
	)
		.then(users => notification.send(
			users,
			'front/notification/complaint/parent',
			{lang: req.lang},
			{
				masterId: req.masterId,
				senderId: req.userId,
				data: {
					type: 'complaint',
				},
			}
		));
};
