'use strict';

const
	path = require('path'),
	models = require('../models'),
	language = require('./language');

models.user.hasMany(models.digest);
models.user.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
models.teacher.hasMany(models.teacherdetail);

exports.getById = async req => {
	let user = await models.user.findById(req.userId, {
		include: [
			models.digest,
			{
				model: models.userdetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`user`.`id`',
					models.userdetail,
					'userId'
				),
				attributes: ['fullname'],
			},
			{
				model: models.institute,
				attributes: ['digest'],
			},
		],
		attributes: [
			'id',
			'email',
			'mobile',
			'user_type',
			'signature',
			'user_image',
			'default_lang',
			'defaultSessionId',
		],
	});

	user = user.toJSON();

	switch (user.user_type) {
	case 'teacher':
		user.teacher = await getTeacherData(req, user);
		break;
	case 'institute':
		Object.assign(user.institute, (await getInstituteData(req, user.id)).toJSON());
	}

	return {status: true, data: user};
};

function getTeacherData(req, user) {
	return models.teacher.find({
		include: [
			{
				model: models.teacherdetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`teacher`.`id`',
					models.teacherdetail,
					'teacherId'
				),
				attributes: [
					'address',
					'experiences',
					'qualifications',
				],
			}
		],
		where: {
			userId: user.id,
		},
		attributes: [
			'dob',
			'gender',
			'cityId',
			'stateId',
			'join_date',
			'countryId',
			'marital_status',
		]
	});
}

function getInstituteData(req, userId) {
	return models.institute.find({
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
				attributes: ['tagline'],
			},
		],
		where: {
			userId,
		},
		attributes: [
			'pan_no',
			'bank_name',
			'ifsc_code',
			'account_no',
			'date_format',
			'bank_branch',
			'min_admission_years',
			'min_admission_months',
			'bank_challan_charges',
			'attendance_type',
			'attendance_access'
		],
	});
}

exports.saveUserProfile = async req => {
	let errors = language.makeErrors(
		await Promise.all([
			models.user.build(req).validate(),
			models.userdetail.build({fullname: req.fullname}).validate(),
		]),
		req.lang,
	);
	if (errors) return {status: false, errors};
	let userdetailUpdate;
	if (req.langId == 1) {
		userdetailUpdate = models.userdetail.update({
			fullname: req.fullname,
		}, {
			where: {
				userId: req.userId,
				languageId: req.langId,
			}
		});
	} else {
		let userdetail = await models.userdetail.find({
			where: {
				userId: req.userId,
				languageId: [1, req.languageId],
			},
			order: [
				['languageId', 'DESC']
			]
		});

		if (userdetail.languageId === 1) {
			userdetail = userdetail.toJSON();
			delete userdetail.id;
			userdetail.fullname = req.fullname;
			userdetail.languageId = req.langId;
			userdetailUpdate = models.userdetail.create(userdetail);
		} else {
			userdetail.fullname = req.fullname;
			userdetailUpdate = await models.save();
		}
	}

	await Promise.all([
		userdetailUpdate,
		models.user.update(req, {
			individualHooks: true,
			where: {id: req.userId},
		}),
	]);

	return {
		status: true,
		data: {
			email: req.email,
			mobile: req.mobile,
			fullname: req.fullname,
			signature: req.signature && path.join(
				'public/uploads',
				req.signature.substring(tmpDir.length)
			),
			user_image: req.user_image && path.join(
				'public/uploads',
				req.user_image.substring(tmpDir.length)
			),
		},
		message: language.__('updatedSuccessfully', req.lang),
	};
};

exports.saveTeacherProfile = async req => {
	if (!req.dob) req.dob = null;
	if (!req.join_date) req.join_date = null;
	if (!req.countryId) req.countryId = null;
	if (!req.stateId) req.stateId = null;
	if (!req.cityId) req.cityId = null;
	let errors = language.makeErrors(
		await Promise.all([
			models.teacher.build(req).validate(),
			models.teacherdetail.build({
				qualifications: req.qualifications,
				address: req.teacherdetail.address,
				experiences: req.teacherdetail.experiences,
			}).validate(),
		]),
		req.lang,
	);
	if (errors) return {status: false, errors};
	req.teacherId = (await models.teacher.find({where: {userId: req.userId}})).id;
	let teacherdetailUpdate;
	if (req.langId == 1) {
		teacherdetailUpdate = models.teacherdetail.update({
			qualifications: req.qualifications,
			address: req.teacherdetail.address,
			experiences: req.teacherdetail.experiences,
		}, {
			where: {
				teacherId: req.teacherId,
				languageId: req.langId,
			},
		});
	} else {
		let teacherdetail = await models.teacherdetail.find({
			where: {
				teacherId: req.teacherId,
				languageId: [1, req.languageId],
			},
			order: [
				['languageId', 'DESC']
			]
		});

		if (teacherdetail.languageId === 1) {
			teacherdetail = teacherdetail.toJSON();
			delete teacherdetail.id;
			teacherdetail.languageId = req.langId;
			teacherdetail.qualifications = req.qualifications;
			teacherdetail.address = req.teacherdetail.address;
			teacherdetail.experiences = req.teacherdetail.experiences;
			teacherdetailUpdate = models.teacherdetail.create(teacherdetail);
		} else {
			teacherdetail.qualifications = req.qualifications;
			teacherdetail.address = req.teacherdetail.address;
			teacherdetail.experiences = req.teacherdetail.experiences;
			teacherdetailUpdate = await models.save();
		}
	}
	
	await Promise.all([
		teacherdetailUpdate,
		models.teacher.update(req, {
			individualHooks: true,
			where: {id: req.teacherId},
		}),
	]);

	return {
		status: true,
		data: {
			qualifications: req.qualifications,
			experiences: req.teacherdetail.experiences,
		},
		message: language.__('updatedSuccessfully', req.lang),
	};
};

exports.saveInstituteProfile = async req => {
	let errors = language.makeErrors(
		await Promise.all([
			models.institute.build(req).validate(),
			models.institutedetail.build({tagline: req.tagline}).validate(),
		]),
		req.lang,
	);
	if (errors) return {status: false, errors};
	let institutedetailUpdate,
		instituteId = await models.institute.find({
			attributes: ['id'],
			where: {userId: req.masterId},
		});
	instituteId = instituteId.id;
	if (req.langId == 1) {
		institutedetailUpdate = models.institutedetail.update({
			tagline: req.tagline,
		}, {
			where: {
				instituteId,
				languageId: req.langId,
			}
		});
	} else {
		let institutedetail = await models.institutedetail.find({
			where: {
				instituteId: instituteId,
				languageId: [1, req.languageId],
			},
			order: [
				['languageId', 'DESC']
			]
		});

		if (institutedetail.languageId === 1) {
			institutedetail = institutedetail.toJSON();
			delete institutedetail.id;
			institutedetail.tagline = req.tagline;
			institutedetail.languageId = req.langId;
			institutedetailUpdate = models.institutedetail.create(institutedetail);
		} else {
			institutedetail.tagline = req.tagline;
			institutedetailUpdate = await models.save();
		}
	}
	
	await Promise.all([
		institutedetailUpdate,
		models.institute.update(req, {
			where: {userId: req.masterId},
		}),
	]);

	return {
		status: true,
		data: {
			date_format: req.date_format,
		},
		message: language.__('updatedSuccessfully', req.lang),
	};
};

exports.saveDigests = async req => {
	let digests = [];
	for (let i = req.digests.length - 1; i >= 0; i--) {
		if (req.digests[i].interval === 0) continue;
		req.digests[i].userId = req.userId;
		digests.push(req.digests[i]);
	}
	let deleted = {userId: req.userId};
	if (digests.length === 0) {
		models.digest.destroy({where: deleted});
	} else {
		deleted.model = {$notIn: digests.map(({model}) => model)};
		await models.digest.destroy({where: deleted});
		await models.digest.bulkCreate(digests, {
			ignoreDuplicates: true,
			updateOnDuplicate: ['interval'],
		});
	}
	return {
		status: true,
		message: language.__('updatedSuccessfully', req.lang),
	};
};