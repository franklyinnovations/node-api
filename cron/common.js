'use strict';

const
	models = require('../models'),
	language = require('../controllers/language');

models.institute.hasMany(models.institutedetail);
models.assignment.hasMany(models.assignmentdetail);
models.user.hasMany(models.userdetail);
models.empleave.belongsTo(models.user);
models.student.belongsTo(models.user);
models.feesubmission.belongsTo(models.student);
models.studentleave.belongsTo(models.user);

exports.assignments = (user, day, digest) => {
	digest.date = day.format('YYYY-MM-DD');
	digest.save();
	return models.assignment.findAndCountAll({
		include: [
			{
				model: models.assignmentdetail,
				where: language.buildLanguageQuery(
					null,
					user.language.id,
					'`assignment`.`id`',
					models.assignmentdetail,
					'assignmentId'
				),
				attributes: ['title'],
			}
		],
		where: {
			masterId: user.masterId,
			academicSessionId: user.defaultSessionId,
			assignment_status: {
				$in:[
					'Draft',
					'Published', 
					'Completed',
					'Reviewed'
				]
			},
			start_date: {
				$gt: digest.date
			}, 
		},
		attributes: [
			'end_date',
			'assignment_status',
			'createdAt'
		],
		limit: 10,
		order: [
			['createdAt', 'DESC'],
		],
	});
};

exports.empleaves = (user, day, digest) => {
	digest.date = day.format('YYYY-MM-DD');
	digest.save();
	return models.empleave.findAndCountAll({
		include: [
			{
				model: models.user,
				include: [
					{
						model: models.userdetail,
						where: language.buildLanguageQuery(
							null,
							user.language.id,
							'`user`.`id`',
							models.userdetail,
							'userId'
						),
						attributes: ['fullname'],
					}
				]
			}
		],
		where: {
			masterId: user.masterId,
			academicSessionId: user.defaultSessionId,
			start_date: {
				$gt: digest.date
			},
		},
		attributes: ['leavestatus', 'start_date', 'end_date', 'createdAt'],
		limit: 10,
		order: [
			['createdAt', 'DESC'],
		],
	});
};

exports.studentleaves = (user, day, digest) => {
	digest.date = day.format('YYYY-MM-DD');
	digest.save();
	return models.studentleave.findAndCountAll({
		include: [
			{
				model: models.user,
				include: [
					{
						model: models.userdetail,
						where: language.buildLanguageQuery(
							null,
							user.language.id,
							'`user`.`id`',
							models.userdetail,
							'userId'
						),
						attributes: ['fullname'],
					}
				],
				attributes: ['id'],
			},
		],
		where: {
			masterId: user.masterId,
			academicSessionId: user.defaultSessionId,
			start_date: {
				$gt: digest.date
			},
		},
		attributes: ['leavestatus', 'start_date', 'end_date', 'createdAt'],
		limit: 10,
		order: [
			['createdAt', 'DESC'],
		],
	});
};

exports.feesubmissions = async (user, day, digest) => {
	digest.date = day.format('YYYY-MM-DD');
	digest.save();
	let {count, rows} = await models.feesubmission.findAndCountAll({
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
									user.language.id,
									'`student.user`.`id`',
									models.userdetail,
									'userId'
								),
								attributes: ['fullname'],
							}
						]
					}
				],
				attributes: ['id'],
			}
		],
		where: {
			approved: 1,
			masterId: user.masterId,
			academicSessionId: user.defaultSessionId,
			$or: [
				{
					mode: {$ne: 3},
					date: {$gt: digest.date},
				},
				{
					mode: 3,
					approval_date: {$gt: digest.date},
				},
			]
		},
		attributes: [
			'mode',
			'date',
			'approval_date',
			[
				models.sequelize.literal(
					'(SELECT SUM(`amount`) FROM `fee_submission_records` WHERE `feesubmissionId` = `feesubmission`.`id`)'
				),
				'amount'
			],
		],
	});
	return {
		count,
		rows: rows.map(feesubmission => feesubmission.toJSON()),
	};
};
	

exports.institute = user =>
	models.institute.find({
		include: [
			{
				model: models.institutedetail,
				where: language.buildLanguageQuery(
					null,
					user.language.id,
					'`institute`.`id`',
					models.institutedetail,
					'instituteId'
				),
				attributes: ['name'],
			}
		],
		where: {
			userId: user.masterId,
		},
		attributes: ['timezone', 'date_format'],
	});

exports.userdetails = user =>
	models.userdetail.findAll({
		where: {
			userId: user.id,
			languageId: user.language.id === 1 ? 1 : [1, user.language.id],
		},
		order: [
			['languageId'],
		],
		limit: 1,
		attributes: ['fullname'],
	});