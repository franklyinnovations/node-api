'use strict';

const models = require('../models'),
	language = require('./language'),
	moment = require('moment');

models.user.hasMany(models.userdetail);
models.user.belongsTo(models.role);
models.role.hasMany(models.rolepermission);
models.rolepermission.belongsTo(models.permission);

models.role.hasMany(models.roledetail);

models.studentrecord.belongsTo(models.student);
models.student.belongsTo(models.user);
models.student.hasMany(models.studentdetail);

models.user.hasOne(models.teacher, {as: 'teacher'});
models.teacher.hasMany(models.teachersubject);
models.teachersubject.belongsTo(models.subject);
models.subject.hasMany(models.subjectdetail);

models.studentrecord.belongsTo(models.bcsmap, {foreignKey: 'bcsMapId'});
models.bcsmap.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.bcsmap.belongsTo(models.classes);
models.classes.hasMany(models.classesdetail);
models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);

exports.time = function (req) {
	return models.sequelize.query('SELECT CURRENT_TIMESTAMP', {type: models.sequelize.QueryTypes.SELECT})
	.then(results => ({
		time: Date.parse(results[0].CURRENT_TIMESTAMP),
		status: true,
		message: language.lang({key: 'time', lang: req.lang})
	}));
};

exports.list = function (req) {
	return Promise.all([models.message.findAll({
		where: {
			$or: [{senderId: req.id}, {receiverId: req.id}],
			createdTime: models.user.sequelize.literal(
				'`message`.`createdTime` = (SELECT MAX(`createdTime`) FROM `messages` AS `m2` WHERE (\
				(`m2`.`senderId` = `message`.`senderId` AND `m2`.`receiverId` = `message`.`receiverId`) OR\
				(`m2`.`senderId` = `message`.`receiverId` AND `m2`.`receiverId` = `message`.`senderId`)))'
			)
		},
		include: [{
			model: models.user,
			attributes: ['id', 'user_type', 'user_image'],
			include: [{
				model: models.userdetail,
				where: language.buildLanguageQuery(
					{}, req.langId, 'sender.id', models.userdetail, 'userId'
				),
				attributes: ['fullname']
			}],
			as: 'sender'
		}, {
			model: models.user,
			attributes: ['id', 'user_type', 'user_image'],
			include: [{
				model: models.userdetail,
				where: language.buildLanguageQuery(
					{}, req.langId, 'receiver.id', models.userdetail, 'userId'
				),
				attributes: ['fullname']
			}],
			as: 'receiver'
		}],
		attributes: Object.keys(models.message.attributes).concat([[
			models.message.sequelize.literal(
				'(SELECT COUNT(*) FROM `online_users` WHERE (`userId` = `receiverId` AND `senderId` = '
				+ JSON.stringify(parseInt(req.id))
				+ ') OR (`userId` = `senderId` AND `receiverId` = '
				+ JSON.stringify(parseInt(req.id))
				+ ') AND `userId` NOT IN (SELECT `userId` FROM `chat_blocks` WHERE `blockedId` = '
				+ req.id
				+ '))'
			),
			'online'
		], [
			models.message.sequelize.literal(
				'(SELECT COUNT(`m`.`id`) FROM `messages` AS `m` WHERE `m`.`receiverId` = '
				+ JSON.stringify(parseInt(req.id))
				+ ' AND ((`m`.`senderId` = `message`.`receiverId` AND `message`.`senderId` = '
				+ JSON.stringify(parseInt(req.id))
				+ ' ) OR (`m`.`senderId` = `message`.`senderId` AND `message`.`receiverId` = '
				+ JSON.stringify(parseInt(req.id))
				+ ')) AND `m`.`msg_status` < 3)'),
			'unread'
		]]),
		group: ['receiverId', 'senderId'],
		distinct: true,
		order: [
			['createdTime', 'DESC'],
			['id', 'DESC']
		],
		subQuery: false
	}), models.user.findById(req.id, {
		include: [{
			model: models.role,
			attributes: ['id'],
			include: [{
				model: models.rolepermission,
				attributes: ['roleId'],
				include: [{
					model: models.permission,
					attributes: ['id', 'action'],
					where: {model: 'chat'}
				}]
			}],
			on: ["`user`.`roleId` = `role`.`id` OR \
			(`user`.`user_type` = 'parent' AND `role`.`masterId` = ? \
			AND `role`.`slug` = 'parent')", [req.masterId]]
		}],
		attributes: []
	})])
	.then(result => ({
		status: true,
		conversations: result[0],
		permissions: result[1] ?
			result[1].role.rolepermissions.map(rolepermission => rolepermission.permission.action) : []
	}));
};

exports.permissions = function (req) {
	return models.user.findById(req.id, {
		include: [{
			model: models.role,
			attributes: ['id'],
			include: [{
				model: models.rolepermission,
				attributes: ['roleId'],
				include: [{
					model: models.permission,
					attributes: ['id', 'action'],
					where: {model: 'chat'}
				}]
			}],
			on: ["`user`.`roleId` = `role`.`id` OR \
			(`user`.`user_type` = 'parent' AND `role`.`masterId` = ? \
			AND `role`.`slug` = 'parent')", [req.masterId]]
		}],
		attributes: ['id']
	})
	.then(user => ({
		status: true,
		permissions: user ?
			user.role.rolepermissions.map(rolepermission => rolepermission.permission.action) : []
	}));
};

exports.messages = function (req) {
	let options = {
		where : {
			$or: [{senderId: req.userId}, {receiverId: req.userId, msg_status: {$lt: 4}}]
		},
		order: [['createdTime', 'DESC'], ['id', 'DESC']]
	};

	if (req.otherUserId) {
		options.where.$or[0].receiverId = req.otherUserId;
		options.where.$or[1].senderId = req.otherUserId;
	}

	if (req.old) {
		options.where.createdTime = {$lt: new Date(parseInt(req.createdAt))};
		options.limit = req.limit;
	} else {
		options.where.createdTime = {$gt: new Date(parseInt(req.createdAt))};
	}
	return models.message.findAndCountAll(options)
	.then((result) => ({
		status: true,
		messages: result.rows,
		more: result.count - result.rows.length
	}));
};

exports.profile = function (req) {
	return models.user.findOne({
		include:[{
			model: models.userdetail,
			where: language.buildLanguageQuery(
				{}, req.langId, 'user.id', models.userdetail, 'userId'
			),
			attributes: ['id', 'fullname']
		}],
		attributes: ['id', 'user_type', 'user_image', 'mobile'],
		where: {
			id: req.id
		}
	})
	.then(result => {
		if (result === null || result.user_type !== 'student') return result;
		result = result.toJSON();
		return models.student.findOne({
			attributes: ['id'],
			where: {
				userId: req.id
			}
		})
		.then(student => {
			if (student === null) return '';
			return models.studentrecord.scope(
				{ method: ['transferred', moment().format('YYYY-MM-DD')]},
				{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', '`studentrecord`.`academicSessionId`']}
		    ).findOne({
				where: {
					studentId: student.id,
					/*record_status:1,
					$or: [
						{transferred: 0},
						{transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}},
						{transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
					],*/
				},
				include: [{
					model: models.bcsmap,
					include: [{
						model: models.board,
						attributes: ['id'],
						include:[{
							model: models.boarddetail,
							where: language.buildLanguageQuery(
								{}, req.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
							),
							attributes: ['alias']
						}]
					}, {
						model: models.classes,
						attributes: ['id'],
						include:[{
							model: models.classesdetail,
							where: language.buildLanguageQuery(
								{}, req.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
							),
							attributes: ['name']
						}]
					}, {
						model: models.section,
						attributes: ['id'],
						include:[{
							model: models.sectiondetail,
							where: language.buildLanguageQuery(
								{}, req.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
							),
							attributes: ['name']
						}]
					}],
					attributes: ['id']
				}],
				order: [['academicSessionId', 'DESC']]
			}).then(studentrecord => {
				if (studentrecord === null) return '';
				return studentrecord.bcsmap.board.boarddetails[0].alias + '--'
					+ studentrecord.bcsmap.class.classesdetails[0].name + '--'
					+ studentrecord.bcsmap.section.sectiondetails[0].name;
			});
		})
		.then(classname => {
			result.classname = classname;
			return result;
		});
	})
	.then(result => ({
		status: true,
		data: result
	}));
};

exports.profiles = function (req) {
	return models.user.findAll({
		include:[{
			model: models.userdetail,
			where: language.buildLanguageQuery(
				{}, req.langId, 'user.id', models.userdetail, 'userId'
			),
			attributes: ['fullname']
		}],
		attributes: ['id', 'user_type', 'user_image'],
		where: {
			id: {
				$in: (req.ids || '').split(',')
			}
		}
	})
	.then(result => ({
		status: true,
		data: result
	}));
};

exports.students = function (req) {
	return models.studentrecord.scope(
      { method: ['transferred', moment().format('YYYY-MM-DD')]},
      { method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
    ).findAll({
		include: [{
			model: models.student,
			attributes: ['id'],
			include: [{
				model: models.user,
				attributes: ['id', 'user_image', 'mobile'],
				where: {is_active: 1},
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: language.buildLanguageQuery(
						{}, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
					)
				}]
			}, {
				model: models.studentdetail,
				attributes: ['id', 'father_name']
			}]
		}],
		attributes: ['id'],
		order: [
			['id']
		],
		where: {
			academicSessionId: req.academicSessionId,
			bcsMapId: req.bcsMapId,
			/*$or: [
				{transferred: 0},
				{transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}},
				{transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
			]*/
		}
	})
	.then(studentrecords => ({
		status: true,
		data: studentrecords
	}));
};

exports.teachers = function(req) {
	return models.user.findAll({
		include:[{
			model: models.userdetail,
			attributes: ['id', 'fullname'],
			where: language.buildLanguageQuery(
				{}, req.langId, '`user`.`id`', models.userdetail, 'userId'
			)
		}, {
			model: models.teacher,
			as: 'teacher',
			attributes: ['id'],
			include: [{
				model: models.teachersubject,
				attributes: ['id'],
				include: [{
					model: models.subject,
					attributes: ['id'],
					include: [{
						model: models.subjectdetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`teacher.teachersubjects.subject`.`id`',
							models.subjectdetail,
							'subjectId'
						),
						attributes: ['id', 'name', 'alias']
					}]
				}]
			}]
		}],
		attributes: ['id', 'mobile', 'user_image'],
		where: {
			user_type: 'teacher',
			masterId: req.masterId,
			is_active: 1
		},
		order: [
			['id']
		]
	})
	.then(teachers => ({
		status: true,
		data: teachers
	}));
};

exports.admins = function(req) {
	return models.user.findAll({
		include:[{
			model: models.userdetail,
			attributes: ['id', 'fullname'],
			where: language.buildLanguageQuery(
				{}, req.langId, 'user.id', models.userdetail, 'userId'
			)
		}, {
			model: models.role,
			attributes: ['id', 'slug'],
			include: [{
				model: models.roledetail,
				where: language.buildLanguageQuery(
					{}, req.langId, 'role.id', models.roledetail, 'roleId'
				),
				attributes: ['id', 'name']
			}]
		}],
		attributes: ['id', 'mobile', 'user_image'],
		where: {
			user_type: 'admin',
			is_active: 1,
			masterId: req.masterId
		},
		order: [
			['id']
		]
	})
	.then(admins => ({
		status: true,
		data: admins
	}));
};

exports.parents = function(req) {
	return models.student.findOne({
		include: [{
			model: models.user,
			where: {
				id: req.studentUserId
			},
			attributes: []
		}],
		attributes: [
			'father_contact',
			'father_contact_alternate',
			'mother_contact',
			'mother_contact_alternate',
			'guardian_contact',
			'guardian_contact_alternate'
		],
	})
	.then(student => {
		if (student === null) return [];
		let mobiles = [
			student.father_contact,
			student.father_contact_alternate,
			student.mother_contact,
			student.mother_contact_alternate,
			student.guardian_contact,
			student.guardian_contact_alternate
		].filter(mobile => mobile);
		return models.user.findAll({
			include: [{
				model: models.userdetail,
				where: language.buildLanguageQuery(
					{}, req.langId, '`user`.`id`', models.userdetail, 'userId'
				),
				attributes: ['fullname']
			}],
			where: {
				user_type: 'parent',
				mobile: {
					$in: mobiles
				}
			},
			attributes: ['id', 'mobile', 'user_image']
		});
	})
	.then(parents => ({
		status: true,
		data: parents
	}));
};

exports.institute = function (req) {
	return models.user.findAll({
		include:[{
			model: models.userdetail,
			attributes: ['id', 'fullname'],
			where: language.buildLanguageQuery(
				{}, req.langId, 'user.id', models.userdetail, 'userId'
			)
		}],
		attributes: ['id', 'mobile', 'user_image'],
		where: {
			id: req.masterId
		}
	})
	.then(data => ({
		status: true,
		data
	}));
};

exports.user = function (req) {
	return models.user.findOne({
		include:[{
			model: models.userdetail,
			where: language.buildLanguageQuery(
				{}, req.langId, 'user.id', models.userdetail, 'userId'
			),
			attributes: ['fullname']
		}],
		attributes: [
			'id',
			'user_type',
			'user_image',
			'mobile',
			[
				models.message.sequelize.literal(
					'(SELECT COUNT(`m`.`id`) FROM `messages` AS `m` WHERE `m`.`receiverId` = '
					+ JSON.stringify(parseInt(req.userId))
					+ ' AND `m`.`senderId` = '
					+ JSON.stringify(parseInt(req.id))
					+ ' AND `m`.`msg_status` < 3)'
				),
				'unread'
			]
		],
		where: {
			id: req.id,
		},
	})
	.then(user => ({
		status: true,
		user,
	}));
};