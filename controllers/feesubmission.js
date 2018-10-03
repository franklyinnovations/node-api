'use strict';

const
	moment = require('moment'),
	models = require('../models'),
	language = require('./language');

models.student.hasMany(models.studentdiscount);
models.studentdiscount.belongsTo(models.feediscount);
models.feeallocation.belongsTo(models.feehead);
models.feehead.hasMany(models.feediscount);
models.feediscount.hasMany(models.studentdiscount);
models.feeallocation.belongsTo(models.fee);
models.feeallocationpenalty.belongsTo(models.feepenalty);
models.feesubmission.hasMany(models.feesubmissionrecord);
models.feesubmissionrecord.belongsTo(models.feesubmission);
models.feesubmissionrecord.belongsTo(models.feehead);
models.feesubmissionrecord.hasMany(models.feesubmissionpenalty);
models.feesubmissionrecord.hasMany(models.feesubmissiondiscount);
models.feesubmission.belongsTo(models.student);
models.feesubmissiondiscount.belongsTo(models.feediscount);
models.feesubmissionpenalty.belongsTo(models.feepenalty);

exports.students = async req => ({
	status: true,
	data: await models.studentrecord.scope(
		{ method: ['transferred', moment().format('YYYY-MM-DD')]},
		{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
	)
		.findAll({
			include: [
				{
					model: models.student,
					include: [
						{
							model: models.user,
							include: [
								{
									model: models.userdetail,
									attributes: ['fullname'],
									where: language.buildLanguageQuery(
										null,
										req.langId,
										'`student.user`.`id`',
										models.userdetail,
										'userId'
									)
								}
							],
							where: {is_active: 1},
							attributes: ['id'],
						},
					],
					attributes: ['enrollment_no'],
				}
			],
			where: {
				bcsMapId: req.bcsmapId,
				academicSessionId: req.academicSessionId,
			},
			attributes: ['id'],
			order: [
				['id', 'DESC'],
			],
		})
});

exports.feeallocations = async req => {
	let studentrecord = await models.studentrecord.scope(
		{ method: ['transferred', moment().format('YYYY-MM-DD')]},
		{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
	).find({
		include: [
			{
				model: models.student,
				include: [
					{
						model: models.studentdiscount,
						attributes: ['feediscountId'],
					}
				],
				where: {
					masterId: req.masterId,
					$or: [
						{id: req.studentId},
						{enrollment_no: req.enrollment_no},
					],
				},
				attributes: ['id'],
			},
			{
				model: models.bcsmap,
				attributes: ['boardId', 'classId'],
			},
		],
		where: {
			academicSessionId: req.academicSessionId,
		},
		attributes: ['bcsMapId', 'studentId'],
		order: [
			['id', 'DESC'],
		],
	});
	if (studentrecord === null) {
		return {
			status: false,
			message: language.__('Student not found.', req.lang),
		};
	}
	let [feeallocations, feesubmissionrecords] = await Promise.all([
		models.feeallocation.findAll({
			include: [
				{
					model: models.feehead,
					include: [
						{
							model: models.feeheaddetail,
							where: language.buildLanguageQuery(
								null,
								req.langId,
								'`feehead`.`id`',
								models.feeheaddetail,
								'feeheadId'
							),
							attributes: ['name']
						},
						{
							model: models.feediscount,
							include: [
								{
									model: models.feediscountdetail,
									where: language.buildLanguageQuery(
										null,
										req.langId,
										'`feehead.feediscounts`.`id`',
										models.feediscountdetail,
										'feediscountId'
									),
									attributes: ['name'],
									required: false,
								},
							],
							where: {
								is_active: 1,
								id: studentrecord.student.studentdiscounts.map(item => item.feediscountId),
							},
							required: false,
							attributes: ['id', 'type', 'value'],
						},
					],
					attributes: ['no_of_installments'],
				},
				{
					model: models.fee,
					include: [
						{
							model: models.feeallocationpenalty,
							include: [
								{
									model: models.feepenalty,
									include: [
										{
											model: models.feepenaltydetail,
											where: language.buildLanguageQuery(
												null,
												req.langId,
												'`fee.feeallocationpenalties.feepenalty`.`id`',
												models.feepenaltydetail,
												'feepenaltyId'
											),
											attributes: ['name'],
											required: false,
										},
										{
											model: models.feepenaltyslab,
											attributes: ['days', 'amount'],
										},
									],
									attributes: ['id'],
								}
							],
							where: {
								is_active: models.sequelize.literal(
									'(SELECT `is_active` FROM `fee_penalties` WHERE `fee_penalties`.`id` = \
									`fee.feeallocationpenalties`.`feepenaltyId`)'
								),
							},
							attributes: ['feepenaltyId'],
							required: false,
						}
					],
					where: {
						boardId: studentrecord.bcsmap.boardId,
						classId: studentrecord.bcsmap.classId,
						academicSessionId: req.academicSessionId,
					},
					attributes: ['id'],
				},
			],
			attributes: [
				'id',
				'date',
				'amount',
				'feeheadId',
				'installment',
			],
			order: [
				['installment'],
				[models.fee, models.feeallocationpenalty, models.feepenalty, models.feepenaltyslab, 'days']
			],
		}),
		models.feesubmissionrecord.findAll({
			include: [
				{
					model: models.feehead,
					include: [
						{
							model: models.feeheaddetail,
							where: language.buildLanguageQuery(
								null,
								req.langId,
								'`feehead`.`id`',
								models.feeheaddetail,
								'feeheadId'
							),
							attributes: ['name']
						},
					],
					attributes: ['id'],
				},
				{
					model: models.feesubmission,
					where: {
						studentId: studentrecord.studentId,
						academicSessionId: req.academicSessionId,
					},
					attributes: ['date', 'approved'],
				}
			],
			attributes: [
				'amount',
				'feeheadId',
				'installment',
				'feesubmissionId',
			],
		}),
	]);
	return {
		status: true,
		feeallocations,
		feesubmissionrecords,
		studentId: studentrecord.studentId,
	};
};

exports.pay = async req => {
	let feesubmission = models.feesubmission.build(req);
	let errors = language.makeErrors(
		[await feesubmission.validate()],
		req.lang,
	);
	if (errors) return {errors};
	await models.feesubmission.create(req, {
		include: [
			{
				model: models.feesubmissionrecord,
				include: [
					models.feesubmissionpenalty,
					models.feesubmissiondiscount,
				]
			}
		],
	});
	return {status: true, message: language.__('addedSuccessfully',req.lang)};
};

exports.getById = async req => {
	let feesubmission = await models.feesubmission.findById(req.feesubmissionId, {
		include: [
			{
				model: models.feesubmissionrecord,
				include: [
					{
						model: models.feehead,
						include: [
							{
								model: models.feeheaddetail,
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`feesubmissionrecords.feehead`.`id`',
									models.feeheaddetail,
									'feeheadId'
								),
								attributes: ['name']
							},
						],
						attributes: ['id'],
					},
					{
						model: models.feesubmissiondiscount,
						include: [
							{
								model: models.feediscount,
								include: [
									{
										model: models.feediscountdetail,
										where: language.buildLanguageQuery(
											null,
											req.langId,
											'`feesubmissionrecords.feesubmissiondiscounts.feediscount`.`id`',
											models.feediscountdetail,
											'feediscountId'
										),
										attributes: ['name'],
										required: false,
									}
								],
								attributes: ['id'],
								required: false,
							}
						],
						attributes: ['amount'],
						required: false,
					},
					{
						model: models.feesubmissionpenalty,
						include: [
							{
								model: models.feepenalty,
								include: [
									{
										model: models.feepenaltydetail,
										where: language.buildLanguageQuery(
											null,
											req.langId,
											'`feesubmissionrecords.feesubmissionpenalties.feepenalty`.`id`',
											models.feepenaltydetail,
											'feepenaltyId'
										),
										attributes: ['name'],
										required: false,
									},
								],
								attributes: ['id'],
								required: false,
							}
						],
						attributes: ['amount'],
						required: false,
					}
				],
				attributes: ['amount', 'installment'],
			},
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
									req.langId,
									'`student.user`.`id`',
									models.userdetail,
									'userId'
								),
								attributes: ['fullname'],
							}
						],
						where: {is_active: 1},
						attributes: ['id'],
					},
					{
						model: models.studentdetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`student`.`id`',
							models.studentdetail,
							'studentId'
						),
						attributes: ['father_name', 'address'],
					},
				],
				attributes: ['id', 'enrollment_no', 'father_contact'],
			}
		],
		attributes: [
			'id',
			'date',
			'mode',
			'bank',
			'cheque',
			'remarks',
			'masterId',
			'academicSessionId',
		],
	});
	let [institute, academicsession] = await Promise.all([
		models.institute.find({
			include: [
				{
					model: models.institutedetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`institute`.`id`',
						models.institutedetail,
						'instituteId'
					),
					attributes: ['name', 'address'],
				},
			],
			where: {
				userId: feesubmission.masterId,
			},
			attributes: ['date_format', 'website_url', 'phone', 'bank_challan_charges'],
		}),
		models.academicsession.findById(feesubmission.academicSessionId, {
			include: [
				{
					model: models.academicsessiondetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`academicsession`.`id`',
						models.academicsessiondetail,
						'academicsessionId'
					),
					attributes: ['name'],
				}
			],
			attributes: ['id'],
		}),
	]);
	return {institute, academicsession, feesubmission};
};