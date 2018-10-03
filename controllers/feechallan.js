'use strict';

const
	models = require('../models'),
	language = require('./language');

exports.list = async req => {
	let pageSize = req.app.locals.site.page,
		page = req.query.page || 1,
		reqData = req.body,
		where = {
			feesubmission: {
				mode: 3,
				masterId: reqData.masterId,
			},
			student: {

			},
		};

	if (req.query.approved) where.feesubmission.approved = req.query.approved;
	if (req.query.challan_no) where.feesubmission.id = {$like: '%' + req.query.challan_no + '%'};
	if (req.query.enrollment_no) where.student.enrollment_no = {$like: '%' + req.query.enrollment_no + '%'};

	let {rows: data, count: totalData} = await models.feesubmission.findAndCountAll({
		include: [
			{
				model: models.student,
				include: [
					{
						model: models.user,
						include: [
							{
								model: models.userdetail,
								where: language.buildLanguageQuery(
									null,
									reqData.langId,
									'`student.user`.`id`',
									models.userdetail,
									'userId'
								),
								attributes: ['fullname'],
							},
						],
						where: {
							is_active: 1,
						},
						attributes: ['id'],
					},
				],
				where: where.student,
				attributes: ['userId', 'enrollment_no'],
			}
		],
		where: where.feesubmission,
		distinct: true,
		attributes: ['id', 'date', 'approved', 'approval_date'],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		order: [['id', 'DESC']],
		subQuery: false,
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

exports.approve = async req => {
	let feesubmission = models.feesubmission.build({
		id: req.id,
		approved: 1,
		masterId: req.masterId,
		remarks: req.remarks,
		approval_date: req.approval_date,
	});

	let errors = language.makeErrors([await feesubmission.validate()], req.lang);
	if (errors) {
		return {errors};
	} else {
		await models.feesubmission.update(
			{
				approved: 1,
				remarks: req.remarks,
				approval_date: req.approval_date,
			},
			{
				where: {
					id: req.id,
					masterId: req.masterId,
				},
			}
		);
		return {
			status: true,
			message: language.__('updatedSuccessfully', req.lang),
		};
	}
};

exports.remove = async req => {
	try {
		await models.feesubmission.destroy({
			where: {
				id: req.id,
				approved: 0,
			},
		});
	} catch (err) {
		return {
			status: false,
			message: language.lang({key: 'Can not delete challan, It is being used.'}),
		};
	}

	return {
		status: true,
		message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
	};
};

