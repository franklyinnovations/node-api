'use strict';

const models = require('../models'),
mail = require('./mail'),
language = require('./language'),
config = require('../config/config.json')[process.env.NODE_ENV || 'development'];

const CLOSED_TICKET_TYPE = 3;

function Ticket() {

this.list = function (req, res) {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,

	where = {ticket: {}};
	if (reqData.user_type === 'institute') {
		where.ticket.masterId = reqData.masterId;
	} else if (reqData.user_type === 'teacher' || reqData.user_type === 'student') {
		where.ticket.userId = reqData.userId;
	}

	if (req.query) {
		Object.keys(req.query).forEach(key => {
			if (req.query[key] === '') return;
			var modalKey = key.split('__');
			if (modalKey[0] in where) {
				where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
			} else {
				where[modalKey[0]] = {};
				where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
			}
		});
	}

	models.user.hasMany(models.userdetail);
	models.ticket.belongsTo(models.user);
	models.ticket.findAndCountAll({
		include: [{
			model: models.user,
			attributes: ['id'],
			include: [{
				model: models.userdetail,
				attributes: ['fullname'],
				where: language.buildLanguageQuery(
					{},
					reqData.langId,
					'`user`.`id`',
					models.userdetail,
					'userId'
				)
			}]
		}],
		where: where.ticket,
		order: [
			['id', 'DESC']
		],
		distinct: true,
		limit: pageSize,
		offset: (page - 1) * pageSize,
		attributes: Object.keys(models.ticket.attributes).concat([[
			models.ticket.sequelize.literal('(SELECT `createdAt` FROM `ticket_messages` WHERE \
			 `ticket`.`id` = `ticket_messages`.`ticketId` ORDER BY `ticket_messages`.`id` DESC LIMIT 1)'),
			'lastModified'
		]]),
		subQuery: false
	}).then(result => {
		res({
			status: true,
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage:page
		});
	})
	.catch(() => res({
		status:false,
		error: true,
		error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}
	));
};

this.getById = function(req, res) {
	const where = {id: req.id};
	if (req.masterId !== 1) where.masterId = req.masterId;

	models.ticket.belongsTo(models.user);
	models.user.hasMany(models.userdetail);
	models.ticketmessage.belongsTo(models.user);
	models.ticket.hasMany(models.ticketmessage);
	models.ticket.findOne({
		where,
		include: [
			{
				model: models.ticketmessage,
				include: [{
					model: models.user,
					include: {
						model: models.userdetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`ticketmessages.user`.`id`',
							models.userdetail,
							'userId'
						),
						attributes: ['fullname']
					},
					attributes: ['id', 'user_image']
				}]
			},
			{
				model: models.user,
				include: [{
					model: models.userdetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`user`.`id`',
						models.userdetail,
						'userId'
					),
					attributes: ['fullname']
				}],
				attributes: ['id']
			}
		],
		order: [
			[models.ticketmessage, 'id', 'ASC']
		],
	})
	.then(res)
	.catch(() => res({
		status:false,
		error: true,
		error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}
	));
};

this.save = function (req, res) {
	req.ticket.status = 0;
	req.ticket.masterId = req.masterId;
	req.ticket.userId = req.userId;
	// default value of req.ticket.assignedTo is 1 (superadmin)
	if (req.user_type === 'teacher' || req.user_type === 'student') {
		req.ticket.assignedTo = req.masterId;
	}
	req.ticket.ticketmessage.userId = req.userId;
	var ticket = models.ticket.build(req.ticket),
	ticketmessage = models.ticketmessage.build(req.ticket.ticketmessage);
	Promise.all([ticket.validate(), ticketmessage.validate()])
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
	}).then(errors => {
		if (errors) {
			language.errors(
				{errors: errors, lang: req.lang}
				, errors => res({errors: errors})
			);
			return;
		}
		const theHasOne = models.ticket.hasOne(models.ticketmessage, {as: 'ticketmessage'});
		return models.ticket.create(req.ticket, {include: [theHasOne]})
		.then(data => {
			mail.sendHtmlMailGeneric('ticketCreatedMailTemplate', req.lang, {
				email: config.ticketAdminEmail,
				subject: language.lang({key: 'Support Ticket', lang: req.lang}) + ' - ' + data.id,
				data: {
					ticketId: data.id,
					message: req.ticket.ticketmessage.message
				}
			});
			res({
				status: true,
				message: language.lang({key:"addedSuccessfully", lang: req.lang}),
				data: data 
			});
		});
	})
};

this.message = function(req, res) {
	models.ticket.belongsTo(models.user);
	var where = {id: req.ticketmessage.ticketId};
	if (req.masterId != 1 && req.userType === 'institute') {
		where.masterId = req.masterId;
	} else if (req.masterId != 1) {
		where.userId = req.userId;
	}
	where.status = {'$ne': CLOSED_TICKET_TYPE};
	models.ticket.findOne({
		where: where,
		include: [{
			model: models.user,
			attributes: ['email']
		}],
		attributes: ['id']
	})
	.then(ticket => {
		if (ticket === null) {
			return {
				status: false,
				url: true,
				error_description:
				language.lang({key: "Internal Error", lang: req.lang})
			};
		}
		req.ticketmessage.userId = req.userId;
		return models.ticketmessage.build(req.ticketmessage).validate()
		.then(err => {
			if (err) {
				return new Promise(resolve => {
					language.errors(
						{errors: err.errors, lang: req.lang}
						, errors => resolve({errors: errors})
					);
				});
			}
			return models.ticketmessage.create(req.ticketmessage)
			.then(() => req.masterId == 1 ? ticket.user.email : config.ticketAdminEmail)
			.then(email => {
				mail.sendHtmlMailGeneric('ticketMessageMailTemplate', req.lang, {
					email: email,
					subject: language.lang({key: 'Support Ticket Reply', lang: req.lang})
						+ ' - ' + req.ticketmessage.ticketId,
					data: {
						ticketId: req.ticketmessage.ticketId,
						message: req.ticketmessage.message
					}
				});
				return {
					status: true,
					message: language.lang({key: "Message sent", lang: req.lang})
				};
			});
		});
	})
	.then(res)
	.catch(() => res({
		status:false,
		error: true,
		error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}
	));
};

this.status = function (req, res) {
	const where = {id: req.id};
	if (req.masterId !== 1) where.masterId = req.masterId;

	models.ticket.update({status: req.status}, {where})
	.then(data => res({
		status: true
		, message: language.lang({key:"updatedSuccessfully", lang:req.lang})
		, data: data
	}))
	.catch(() => res({
		status:false,
		error: true,
		error_description: language.lang({key: "Internal Error",lang: req.lang}),
		url: true
	}));
};

}

module.exports = new Ticket();