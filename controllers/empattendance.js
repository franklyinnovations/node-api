'use strict';

const
	models = require('../models'),
	language = require('./language');

models.user.hasMany(models.userdetail);
models.user.hasMany(models.empattendance);
models.user.hasMany(models.empleave);

exports.empList = async req => {
	let reqData = req.body,
		where = {
			user: {
				masterId: reqData.masterId,
				is_active: 1
			},
			userdetail: language.buildLanguageQuery(
				null,
				reqData.langId,
				'`user`.`id`',
				models.userdetail,
				'userId'
			),
			empattendance: {
				academicSessionId: reqData.academicSessionId,
				date: reqData.date,
			},
			empleave: {
				academicSessionId: reqData.academicSessionId,
				leavestatus: 1,
				start_date: {$lte: reqData.date},
				end_date: {$gte: reqData.date},
			}
		};

	if(reqData.roleId && reqData.roleId !== 'all') where.user.roleId = reqData.roleId;

	if (reqData.name) where.userdetail.fullname = {$like: '%' + reqData.name + '%'};
	if (reqData.mobile) where.user.mobile = {$like: '%' + reqData.mobile + '%'};
	if (reqData.email) where.user.email = {$like: '%' + reqData.email + '%'};

	let data = await models.user.findAll({
		include: [
			{
				model: models.userdetail,
				where: where.userdetail,
				attributes: ['fullname'],
			},
			{
				model: models.empleave,
				where: where.empleave,
				attributes: ['id','duration', 'halfday'],
				required: false
			},
			{
				model: models.empattendance,
				where: where.empattendance,
				required: false
			}
		],
		where: where.user,
		attributes: ['id', 'roleId', 'masterId', 'email', 'mobile', 'user_type', 'user_image'],
		order: [
			['id', 'DESC']
		],
	});

	return {
		status: true,
		data
	};
};

exports.save = async req =>{
	await models.empattendance.bulkCreate(req.attData,{
		ignoreDuplicates: true,
		updateOnDuplicate: ['attendancestatus', 'empleaveId'],
	});

	return {
		status: true,
		message: language.lang({key: 'Saved Successfully', lang: req.lang}),
	};
};
