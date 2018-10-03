'use strict';

const
	models = require('../models'),
	language = require('./language');

models.feed.hasMany(models.feedlike);
models.feed.hasMany(models.feedrecord);
models.feed.belongsTo(models.user);

exports.list = async req => {
	let
		pageSize = req.app.locals.site.page,
		reqData = req.body,
		where = {
			feed: {
				$or: [
					{
						approved: 1,
						bcsmapId: reqData.bcsmapId,
					},
					{
						approved: 2,
					},
					{
						bcsmapId: null,
					},
					{
						controlUserId: req.user.id,
					},
					{
						userId: req.user.id,
					},
				],
				masterId: reqData.masterId,
				academicSessionId: reqData.academicSessionId,
			},
		};

	if (req.query.id) where.feed.id = {$lt: +req.query.id};
	if (reqData.userId) where.feed.userId = reqData.userId;
	if (reqData.approved) where.feed.approved = reqData.approved;
	if (reqData.approvable) where.feed.userId = {$ne: req.user.id}; 

	let {rows: data, count: more} = await models.feed.findAndCountAll({
		include: [
			models.feedrecord,
			{
				model: models.user,
				include: [
					{
						model: models.userdetail,
						where: language.buildLanguageQuery(
							null, reqData.langId, '`feed`.`userId`', models.userdetail, 'userId'
						),
						attributes: ['fullname']
					}
				],
				attributes: ['id', 'user_image'],
			}
		],
		attributes: [
			'id',
			'userId',
			'approved',
			'description',
			'controlUserId',
			[
				models.sequelize.literal('(SELECT COUNT(*) FROM `feed_likes` WHERE `feedId` = `feed`.`id`)'),
				'likes'
			],
			[
				models.sequelize.literal(
					'(SELECT COUNT(*) FROM `feed_likes` WHERE `feedId` = `feed`.`id` AND `userId` = '
					+ req.user.id + ')'
				),
				'liked'
			]
		],
		where: where.feed,
		distinct: true,
		limit: pageSize,
		order: [['id', 'DESC']],
	});

	return {
		status: true,
		data,
		more: more - data.length,
	};
};

exports.save = async req => {
	req.approved =  ['teacher', 'admin', 'institute'].indexOf(
		(await models.user.findById(req.userId, {attributes: ['user_type']})).user_type
	) !== -1 ? 1 : 0;
	if (req.approved) req.controlUserId = req.userId;
	await models.feed.create(req, {
		include: [models.feedrecord],
	});
	return {
		status: true,
		message: language.__('addedSuccessfully', req.lang),
	};
};

exports.like = async req => {
	await models.feedlike.upsert({userId: req.userId, feedId: req.id});
	return {
		status: true,
	};
};

exports.unlike = async req => {
	await models.feedlike.destroy({where: {userId: req.userId, feedId: req.id}});
	return {
		status: true,
	};
};

exports.approve = async req => {
	await models.feed.update({
		approved: req.approved,
	}, {
		where: {
			id: req.id,
			controlUserId: req.userId,
		},
	});
	return {
		status: true,
		message: language.lang({key: 'updatedSuccessfully', lang: req.lang}),
	};
};

exports.remove = async req => {
	await models.feed.destroy({
		individualHooks: true,
		where: {id: req.id, userId: req.userId},
	});
	return {
		status: true,
		message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
	};
};

exports.controlUsers = async req => ({
	status: true,
	data: await models.teacher.findAll({
		include: [
			{
				model: models.timetableallocation,
				include: [
					{
						model: models.timetable,
						where: {
							bcsMapId: req.bcsmapId,
							masterId: req.masterId,
							academicSessionId: req.academicSessionId,
						},
						attributes: [],
					},
				],
				attributes: []
			},
			{
				model: models.user,
				include: [
					{
						model: models.userdetail,
						where: language.buildLanguageQuery(
							null, req.langId, '`user`.`id`', models.userdetail, 'userId'
						),
						attributes: ['fullname']
					}
				],
				attributes: ['id'],
			}
		],
		attributes: ['id'],
	})
});