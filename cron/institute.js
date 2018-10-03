'use strict';

const
	ejs = require('ejs'),
	moment = require('moment'),
	common = require('./common'),
	models = require('../models'),
	mail = require('../controllers/mail'),
	language = require('../controllers/language');

async function digest(masterId, day) {
	let institute = await models.institute.findAll({
		include: [
			{
				model: models.user,
				include: [
					{
						model: models.digest,
						where: {
							interval: {
								$lte: models.sequelize.fn(
									'DATEDIFF',
									models.sequelize.fn('NOW'),
									models.sequelize.col('date'),
								),
							},
						},
					},
					{
						model: models.language,
						attributes: ['id', 'code', 'direction'],
					},
					{
						model: models.role,
						include: [
							{
								model: models.rolepermission,
								include: [
									{
										model: models.permission,
										where: {
											model: ['assignment', 'empleave', 'feesubmission'],
										},
										attributes: ['model'],
										required: false,
									}
								],
							}
						],
						attributes: ['id'],
					},
				],
				where: {
					is_active: 1,
				},
				attributes: [
					'id',
					'email',
					'masterId',
					'default_lang',
					'defaultSessionId',
				],
			}
		],
		where: {
			userId: masterId,
		},
		attributes: ['id'],
		group: [
			['id'],
			[models.user, models.digest, 'model'],
			[models.user, models.role, models.rolepermission, models.permission, 'model'],
		],
	});
	if (institute.length === 0) return;
	institute = institute[0];
	let modules = institute.user.role.rolepermissions.filter(({permission}) => permission !== null).map(({permission: {model}}) => model);
	modules.push('studentleave');
	modules = modules.reduce((modules, module) => {
		let digest = institute.user.digests.find(({model}) => module === model);
		if (digest) {
			modules[module] = digest;
		}
		return modules;
	}, {});

	let [
		userInstitute,
		userdetails,
		empleaves,
		assignments,
		studentleaves,
		feesubmissions,
	] = await Promise.all([
		common.institute(institute.user),
		common.userdetails(institute.user),
		modules.empleave && common.empleaves(institute.user, day, modules.empleave),
		modules.assignment && common.assignments(institute.user, day, modules.assignment),
		modules.studentleave && common.studentleaves(institute.user, day, modules.studentleave),
		modules.feesubmission && common.feesubmissions(institute.user, day, modules.feesubmission),
	]);
	institute.user.userdetails = userdetails;
	let data = language.bindLocale({
		day,
		moment,
		empleaves,
		assignments,
		studentleaves,
		feesubmissions,
		user: institute.user,
		institute: userInstitute,
	}, institute.user.language.code);
	mail.sendMail({
		email: institute.user.email,
		subject: data.__('Pateast Digest'),
		msg: await ejs.renderFile('views/digests/institute.ejs', data),
	});
}

module.exports = digest;