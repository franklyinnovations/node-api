#!/usr/bin/env node

'use strict';

const
	path = require('path'),
	moment = require('moment'),
	models = require('../models'),
	sendAdminDigests = require('./admin'),
	sendTeacherDigests = require('./teacher'),
	sendInstituteDigests = require('./institute');

process.chdir(path.dirname(__dirname));

models.user.hasMany(models.digest);
models.institute.belongsTo(models.user);
models.user.belongsTo(models.role);
models.role.hasMany(models.rolepermission);
models.rolepermission.belongsTo(models.permission);
models.user.belongsTo(models.language, {
	foreignKey: 'default_lang'
});

const day = moment().startOf('day');

async function main() {
	global.email_provider = (
		await models.emailprovider.findOne({
			where: {
				is_active: 1
			}
		})
	).email_provider;
	let institutes = await models.institute.findAll({
		include: [
			{
				model: models.user,
				where: {is_active: 1},
				attributes: [],
			},
		],
		where: {
			digest: 1,
		},
		attributes: ['userId'],
	});
	await Promise.all(institutes.map(sendDigestOfInstitute));
}

function sendDigestOfInstitute({userId: masterId}) {
	return Promise.all([
		sendAdminDigests(masterId, day),
		sendTeacherDigests(masterId, day),
		sendInstituteDigests(masterId, day),
	]);
}

main();