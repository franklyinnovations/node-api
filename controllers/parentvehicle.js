'use strict';

const
	models = require('../models'),
	language = require('./language'),
	qrcode = require('./qrcode'),
	mail = require('./mail');

models.parentvehicle.hasMany(models.parentvehicledetail);
models.parentvehicledetail.belongsTo(models.parentvehicle);
models.parentvehicle.belongsTo(models.student);
models.student.belongsTo(models.user);
models.student.hasMany(models.studentdetail);
models.user.hasMany(models.userdetail);
models.student.hasOne(models.studentrecord);
models.studentrecord.belongsTo(models.bcsmap,{'foreignKey':'bcsMapId'});
models.bcsmap.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.bcsmap.belongsTo(models.classes);
models.classes.hasMany(models.classesdetail);
models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);

exports.list = async req => {
	let pageSize = req.app.locals.site.page,
		page = req.query.page || 1,
		reqData = req.body,
		where = {
			parentvehicle: {
				masterId: reqData.masterId,
			},
			parentvehicledetail: language.buildLanguageQuery(
				null,
				reqData.languageId,
				'`parentvehicle`.`id`',
				models.parentvehicledetail,
				'parentvehicleId'
			),
			userdetail: language.buildLanguageQuery(
				null,
				reqData.languageId,
				'`student`.`user`.`id`',
				models.userdetail,
				'userId'
			),
			student: {},
			studentdetail: language.buildLanguageQuery(
				null,
				reqData.languageId,
				'`student`.`id`',
				models.studentdetail,
				'studentId'
			),
			studentrecord: {
				academicSessionId: reqData.academicSessionId,
			},
			boarddetail: language.buildLanguageQuery(
				null,
				reqData.languageId,
				'`student`.`studentrecord`.`bcsmp`.`board`.`id`',
				models.boarddetail,
				'boardId'
			),
			classesdetail: language.buildLanguageQuery(
				null,
				reqData.languageId,
				'`student`.`studentrecord`.`bcsmp`.`class`.`id`',
				models.classesdetail,
				'classId'
			),
			sectiondetail: language.buildLanguageQuery(
				null,
				reqData.languageId,
				'`student`.`studentrecord`.`bcsmp`.`section`.`id`',
				models.sectiondetail,
				'sectionId'
			),
		};

	if (req.query.enrollment_no) where.student.enrollment_no = {$like: '%' + req.query.enrollment_no + '%'};
	if (req.query.fullname) where.userdetail.fullname = {$like: '%' + req.query.fullname + '%'};
	if (req.query.father_contact) where.student.father_contact = {$like: '%' + req.query.father_contact + '%'};	
	if (req.query.number) where.parentvehicle.number = {$like: '%' + req.query.number + '%'};
	if (req.query.vehicle_type) where.parentvehicle.vehicle_type = req.query.vehicle_type;
	if (req.query.is_active) where.parentvehicle.is_active = req.query.is_active;

	const {rows: data, count: totalData} = await models.parentvehicle.findAndCountAll({
		include:[
			{
				model: models.parentvehicledetail,
				where: where.parentvehicledetail,
				attributes: ['owner', 'model', 'colour', 'place']
			},
			{
				model: models.student,
				attributes: ['id', 'userId', 'enrollment_no', 'father_contact'],
				include:[
					{
						model: models.studentdetail,
						where: where.studentdetail,
						attributes: ['father_name'],
					},
					{
						model: models.user,
						attributes: ['id', 'mobile'],
						include: [
							{
								model: models.userdetail,
								where: where.userdetail,
								attributes: ['fullname'],
							}
						]
					},
					{
						model: models.studentrecord,
						where: where.studentrecord,
						attributes: ['bcsMapId'],
						include: [
							{
								model: models.bcsmap,
								include: [
									{
										model: models.board, 
										attributes:['id'],
										include: [
											{
												model: models.boarddetail,
												attributes:['id', 'name', 'alias'],
												where:where.boarddetail
											}
										]
									},
									{
										model: models.classes, 
										attributes:['id'],
										include: [
											{
												model: models.classesdetail,
												attributes:['id', 'name'],
												where:where.classesdetail
											}
										]
									},
									{
										model: models.section, 
										attributes:['id'],
										include: [
											{
												model: models.sectiondetail,
												attributes:['id', 'name'],
												where:where.sectiondetail
											}
										]
									}
								],
								attributes: ['id']
							},
						]
					}
				],
				where: where.student,
			}
		],
		where: where.parentvehicle,
		order: [['id', 'DESC']],
		distinct: true,
		limit: pageSize,
		offset: (page - 1) * pageSize,
	});

	return {
		status: true,
		data,
		totalData,
		pageCount: Math.ceil(totalData / pageSize),
		pageLimit: pageSize,
		currentPage: page,
	};
};

exports.save = async req => {
	req.parentvehicledetail.languageId = req.langId;
	if (req.id) req.parentvehicledetail.parentvehicleId = req.id;
	if (!req.studentId) req.studentId = '';
	let errors = language.makeErrors(
		await Promise.all([
			models.parentvehicle.build(req).validate(),
			models.parentvehicledetail.build(req.parentvehicledetail).validate(),
		])
	);
	return errors ? {status: false, errors} :
		(req.id ? updateParentVehicle(req) : createParentVehicle(req));
};

exports.get = req => models.parentvehicle.findById(req.id, {
	include: [
		{
			model: models.parentvehicledetail,
			where: language.buildLanguageQuery(
				null,
				req.languageId,
				'`parentvehicle`.`id`',
				models.parentvehicledetail,
				'parentvehicleId'
			)
		},
		{
			model: models.student,
			attributes: ['id'],
			include:[
				{
					model: models.studentrecord,
					where: {
						academicSessionId: req.academicSessionId,
					},
					attributes: ['bcsMapId'],
				}
			]
		},
	],
});

async function updateParentVehicle(req) {
	delete req.parentvehicledetail.id;
	await Promise.all([
		models.parentvehicle.update(req, {where: {id: req.id}}),
		models.parentvehicledetail.upsert(req.parentvehicledetail),
	]);
	return {
		status: true,
		message: language.lang({key: 'updatedSuccessfully', lang: req.lang}),
	};
}

async function createParentVehicle(req) {
	req.parentvehicledetails = [req.parentvehicledetail];
	if (req.langId != 1) {
		req.parentvehicledetails.push({...req.parentvehicledetail, languageId: 1});
	}
	await models.parentvehicle.create(req, {include: [models.parentvehicledetail]});
	return {
		status: true,
		message: language.lang({key: 'addedSuccessfully', lang: req.lang}),
	};
}


exports.remove = async req => {
	try {
		await models.parentvehicle.destroy({where: {id: req.id}});
	} catch (err) {
		return {
			status: false,
			message: language.lang({key: 'Can not delete this vehicle pass, It is being used.'}),
		}
	}

	return {
		status: true,
		message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
	};
};

exports.status = req => models.parentvehicle.update(
	{
		is_active: req.status
	},
	{
		where: {
			id: req.id,
			masterId: req.masterId,
		}
	}
);

exports.sendemail = async req => {
	const parentvehicle = await models.parentvehicle.findById(req.id, {
		include: [
			{
				model: models.student,
				attributes: ['father_email'],
			}
		]
	});

	const mailData = {
		email: parentvehicle.student.father_email,
		subject: language.lang({key:'Vehicle Pass', lang:req.lang}),
		list: {
			qrcode: qrcode.html(req.id),
		}
	};
	mail.sendVehiclePass(mailData, req.lang);
	return {
		status: true,
		message: language.lang({key:'Email Sent', lang:req.lang}),
	};
};