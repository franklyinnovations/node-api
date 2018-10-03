'use strict';

const
	ejs = require('ejs'),
	moment = require('moment'),
	common = require('./common'),
	models = require('../models'),
	mail = require('../controllers/mail'),
	language = require('../controllers/language');

async function digests(masterId, day) {
	let admins = await models.user.findAll({
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
									model: ['assginment', 'empleave', 'feesubmission'],
								},
								attributes: ['model'],
								required: false,
							}
						],
					}
				],
				attributes: ['id'],
			}
		],
		where: {
			masterId,
			is_active: 1,
			user_type: 'admin',
		},
		attributes: [
			'id',
			'email',
			'masterId',
			'default_lang',
			'defaultSessionId',
		],
		group: [
			['id'],
			[models.digest, 'model'],
			[models.role, models.rolepermission, models.permission, 'model'],
		],
	});
	return Promise.all(admins.map(digest.bind(this, day)));
}

async function digest(day, user) {
	let modules = user.role.rolepermissions.filter(({permission}) => permission !== null).map(({permission: {model}}) => model);
	modules.push('studentleave');
	modules = modules.reduce((modules, module) => {
		let digest = user.digests.find(({model}) => module === model);
		if (digest) {
			modules[module] = digest;
		}
		return modules;
	}, {});

	let [
		institute,
		userdetails,
		empleaves,
		assignments,
		studentleaves,
		feesubmissions,
	] = await Promise.all([
		common.institute(user),
		common.userdetails(user),
		modules.empleave && common.empleaves(user, day, modules.empleave),
		modules.assignment && common.assignments(user, day, modules.assignment),
		modules.studentleave && common.studentleaves(user, day, modules.studentleave),
		modules.feesubmission && common.feesubmissions(user, day, modules.feesubmission),
	]);
	user.userdetails = userdetails;
	let data = language.bindLocale({
		day,
		user,
		moment,
		institute,
		empleaves,
		assignments,
		studentleaves,
		feesubmissions,
	}, user.language.code);
	mail.sendMail({
		email: user.email,
		subject: data.__('Pateast Digest'),
		msg: await ejs.renderFile('views/digests/institute.ejs', data),
	});
}

module.exports = digests;