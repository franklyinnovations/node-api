'use strict';

const models = require('../models'),
	language = require('./language');

models.activity.hasMany(models.activitydetail);
models.activity.belongsTo(models.activity, {as: 'super_activity', foreignKey: 'superActivityId'});
models.activityschedule.belongsTo(models.activity);

exports.list = function (req) {
	var pageSize = req.app.locals.site.page, // number of items per page
		page = req.query.page || 1;

	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
		where = {
			activity: {
				masterId: reqData.masterId
			}
		};
	if (req.query) {
		Object.keys(req.query).forEach(key => {
			if (req.query[key] === '') return;
			var modalKey = key.split('__');
			if (modalKey.length === 3) {
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = req.query[key];
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = req.query[key];
				}
			} else {
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				}
			}
		});
	}

	return Promise.all([
		models.activity.findAndCountAll({
			include: [{
				model: models.activitydetail,
				where: language.buildLanguageQuery(
					where.activitydetail,
					reqData.langId,
					'`activity`.`id`',
					models.activitydetail,
					'activityId'
				),
				attributes: ['name']
			}, {
				model: models.activity,
				as: 'super_activity',
				include: [{
					model: models.activitydetail,
					where: language.buildLanguageQuery(
						{},
						reqData.langId,
						'`super_activity`.`id`',
						models.activitydetail,
						'activityId'
					),
					attributes: ['name'],
					required: false
				}],
				required: false
			}],
			where: where.activity,
			attribute: ['id'],
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false
		}),
	])
		.then(([result]) => ({
			status: true,
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage: page,
		}));
};

exports.getById = function (req) {
	return Promise.all([
		models.activity.findOne({
			where: {
				id: req.id,
				masterId: req.masterId
			},
			include: [
				{
					model: models.activitydetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`activity`.`id`',
						models.activitydetail,
						'activityId'
					)
				}
			]
		}),
		exports.getMetaInformations(req)
	])
		.then(([data, activities]) => data === null
			? {
				status:false,
				error: true,
				error_description: language.lang({
					key: 'Internal Error',
					lang: req.lang
				}),
				url: true
			} : {
				status: true,
				data,
				activities
			}
		);
};

exports.save = function (req) {
	if (!req.superActivityId) req.superActivityId = null;
	return Promise.all([
		models.activity.build(req).validate(),
		models.activitydetail.build(req.activitydetail).validate()
	])
		.then(err => {
			if (err[0]) {
				if (err[1])
					return err[0].errors.concat(err[1].errors);
				else
					return err[0].errors;
			} else {
				if (err[1])
					return err[1].errors;
				else
					return null;
			}
		})
		.then(errors => {
			if (errors) {
				return new Promise((resolve) => {
					language.errors(
						{errors, lang: req.lang}
						, errors => resolve({errors})
					);
				});
			}
			if (req.id) {
				return updateActivity(req);
			} else {
				return createActivity(req);
			}
		});
};

exports.remove = async req => {
	try {
		await models.activity.destroy({where: {id: req.id}});
	} catch (err) {
		return {
			status: false,
			message: language.lang({key: 'Can not delete activity, It is being used.'}),
		};
	}

	return {
		status: true,
		message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
	};
};

exports.getMetaInformations = function (req) {
	var where = {
		masterId: req.masterId,
		superActivityId: null
	};

	if (req.id) {
		where.id = {
			$ne: req.id
		};
	}
	return models.activity.findAll({
		include: [{
			model: models.activitydetail,
			where: language.buildLanguageQuery(
				{},
				req.langId,
				'`activity`.`id`',
				models.activitydetail,
				'activityId'
			),
			attributes: ['name']
		}],
		where,
		attributes: ['id']
	});
};

exports.activityList = function (req) {
	var where = {
		masterId: req.masterId,
		superActivityId: null
	};

	return models.activity.findAll({
		include: [{
			model: models.activitydetail,
			where: language.buildLanguageQuery(
				{},
				req.langId,
				'`activity`.`id`',
				models.activitydetail,
				'activityId'
			),
			attributes: ['name']
		}],
		where,
		attributes: ['id']
	})
		.then(activities => ({
			status: true,
			activities
		}));
};

exports.activityScheduleList = function (req) {
	var where = {
		examscheduleId: req.examscheduleId
	};

	return models.activityschedule.findAll({
		include: [
			{
				model: models.activity,
				where:{
					superActivityId: null
				},
				include: [
					{
						model: models.activitydetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`activity`.`id`',
							models.activitydetail,
							'activityId'
						)
					}
				]
			}
		],
		where,
		order: [
			['id', 'DESC']
		]
	})
		.then(activityschedules => ({
			status: true,
			activityschedules
		}));
};

exports.checkActivitySchedule = function (req) {
	var where = {
		examscheduleId: req.activityschedule[0].examscheduleId,
		activityId:req.activityschedule[0].activityId
	};

	return models.activityschedule.findOne({
		attributes:[
			'id'
		],
		where,

	})
		.then(activityschedules => ({
			status: true,
			activityschedules
		}));
};

exports.removeActivity = function (req) {
	return models.activity.findAll({
		where: {
			superActivityId: req.id
		},
		attributes: ['id']
	})
		.then(activities => models.activityschedule.destroy({
			where: {
				examscheduleId: req.examscheduleId,
				activityId: {
					$in: [req.id].concat(activities.map(activity => activity.id))
				}
			}
		}))
		.then(() => ({
			status: true,
			message: language.lang({key:'deletedSuccessfully', lang: req.lang})
		}))
		.catch(() => ({
			status: false,
			message: language.lang({key:'Can not delete this. It is being used', lang: req.lang})
		}));
};


exports.addActivitySchedule = function (req) {
	return models.activityschedule.bulkCreate(
		req.activityschedule
	)
		.then(() => models.activityschedule.findOne({
			include: [
				{
					model: models.activity,
					where: {
						superActivityId: null
					},
					include:
					[
						{
							model: models.activitydetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`activity`.`id`',
								models.activitydetail,
								'activityId'
							),
							attributes: ['name']
						}
					]
				}
			],
			where: {
				examscheduleId: req.activityschedule[0].examscheduleId,
			},
			order: [['id', 'DESC']]
		}))
		.then(activityschedule => ({
			status: true,
			message: language.lang({key:'addedSuccessfully', lang: req.lang}),
			activityschedule
		}));
};

exports.subActivityList = function (req) {
	return models.activity.findAll({
		include: [
			{
				model: models.activitydetail,
				where: language.buildLanguageQuery(
					{},
					req.langId,
					'`activity`.`id`',
					models.activitydetail,
					'activityId'
				),
				attributes: ['name', 'activityId']
			}
		],
		attributes: ['id'],
		where: {
			superActivityId: req.activityId
		}
	})
		.then(activities => ({
			status: true,
			activities
		}));
};

function updateActivity(req) {
	return models.activity.findById(req.id, {
		include: [
			{
				model: models.activitydetail,
				where: {
					languageId: req.langId
				},
				required: false
			}
		]
	})
		.then(activity => {
			if (activity === null) throw 'activity not found';
			var updates = [activity.update(req)];
			if (activity.activitydetails.length === 0) {
				delete req.activitydetail.id;
				req.activitydetail.activityId = activity.id;
				req.activitydetail.languageId = req.langId;
				updates.push(models.activitydetail.create(req.activitydetail));
			} else {
				updates.push(activity.activitydetails[0].update(req.activitydetail));
			}
			return Promise.all(updates);
		})
		.then(() => ({
			status: true,
			message: language.lang({key:'updatedSuccessfully', lang: req.lang})
		}));
}

function createActivity(req) {
	req.activitydetail.languageId = req.langId;
	req.activitydetails = [req.activitydetail];
	if (req.langId != 1) {
		var activitydetail = JSON.parse(JSON.stringify(req.activitydetail));
		activitydetail.languageId = 1;
		req.activitydetails.push(activitydetail);
	}
	return models.activity.create(
		req,
		{
			include: [models.activitydetail]
		}
	)
		.then(() => ({
			status: true,
			message: language.lang({key:'addedSuccessfully', lang: req.lang})
		}));
}