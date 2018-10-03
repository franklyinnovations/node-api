'use strict';

const
	models = require('../models'),
	language = require('./language'),
	notification = require('./notification');


models.vehiclebreakdown.belongsTo(models.rvdhsmap, {as: 'rvdhsmap'});
models.vehiclebreakdown.belongsTo(models.rvdhsmap, {as: 'replacementRvdhsmap'});

exports.list = async req => {
	let pageSize = req.app.locals.site.page,
		page = req.query.page || 1,
		reqData = req.body,
		where = {};

	if (req.query.rvdhsmapId) where.rvdhsmapId = req.query.rvdhsmapId;
	if (req.query.replacementRvdhsmapId) where.replacementRvdhsmapId = req.query.replacementRvdhsmapId;

	const [{rows: data, count: totalData}, rvdhsmaps] = await Promise.all([
		models.vehiclebreakdown.findAndCountAll({
			include: [
				{
					model: models.rvdhsmap,
					as: 'rvdhsmap',
					include: {
						model: models.vehicle,
						include: {
							model: models.vehicledetail,
							where: language.buildLanguageQuery(
								null,
								reqData.langId,
								'`rvdhsmap.vehicle`.`id`',
								models.vehicledetail,
								'vehicleId'
							),
							attributes: ['name'],
						},
						where: {
							is_active: true,
						},
						attributes: ['id'],
					},
					where: {
						masterId: reqData.masterId,
					},
					attributes: ['id'],
				},
				{
					model: models.rvdhsmap,
					as: 'replacementRvdhsmap',
					include: {
						model: models.vehicle,
						include: {
							model: models.vehicledetail,
							where: language.buildLanguageQuery(
								null,
								reqData.langId,
								'`replacementRvdhsmap.vehicle`.`id`',
								models.vehicledetail,
								'vehicleId'
							),
							attributes: ['name'],
						},
						where: {
							is_active: true,
						},
						attributes: ['id'],
					},
					attributes: ['id', 'vehicleId'],
				},
			],
			where,
			distinct: true,
			attributes: ['id', 'date'],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			order: [['id', 'DESC']],
			subQuery: false,
		}),
		models.rvdhsmap.findAll({
			include: {
				model: models.vehicle,
				include: {
					model: models.vehicledetail,
					where: language.buildLanguageQuery(
						null,
						reqData.langId,
						'`vehicle`.`id`',
						models.vehicledetail,
						'vehicleId'
					),
					attributes: ['name'],
				},
				where: {
					is_active: true,
				},
				attributes: ['id'],
			},
			where: {
				masterId: reqData.masterId,
				academicSessionId: reqData.academicSessionId,
			},
		}),
	]);

	return {
		status: true,
		data,
		totalData,
		rvdhsmaps,
		pageCount: Math.ceil(totalData / pageSize),
		pageLimit: pageSize,
		currentPage: page,
	};
};


exports.save = async req => {
	let vehiclebreakdown = models.vehiclebreakdown.build(req);
	let errors = language.makeErrors([await vehiclebreakdown.validate()], req.lang);
	if (errors) return {status: false, errors};

	if (req.id) {
		await models.vehiclebreakdown.update(req, {where: {id: req.id}});
		notificationAndEmail(req.id);
		return {
			status: true,
			message: language.lang({
				key: 'updatedSuccessfully',
				lang: req.lang
			}),
		};
	} else {
		await vehiclebreakdown.save();
		notificationAndEmail(vehiclebreakdown.id);
		return {
			status: true,
			message: language.lang({
				key: 'addedSuccessfully',
				lang: req.lang
			}),
		};		
	}
};

exports.edit = async req => ({
	status: true,
	vehiclebreakdown: await models.vehiclebreakdown.findById(req.id), 
});

exports.remove = async req => {
	try {
		await models.vehiclebreakdown.destroy({where: {id: req.id}});
	} catch (err) {
		return {
			status: false,
			message: language.lang({key: 'Can not delete vehicle breakdown, It is being used.'}),
		};
	}

	return {
		status: true,
		message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
	};
};

async function notificationAndEmail(id, req) {
	const breakdown = await models.vehiclebreakdown.findById(id);

	const [parents, students] = await Promise.all([
		models.sequelize.query(
			`SELECT
				users.id , users.device_id, users.is_notification
			FROM
				users
			WHERE
				FIND_IN_SET(
					mobile,
					(SELECT
						GROUP_CONCAT(
							father_contact, ',',
							father_contact_alternate, ',',
							mother_contact, ',',
							mother_contact_alternate, ',',
							guardian_contact, ',',
							guardian_contact_alternate)
					FROM
						students
					INNER JOIN
						rvdhs_map_records
					ON
						rvdhs_map_records.studentId = students.id
						AND rvdhsmapId = ?)
				)
				AND users.user_type = 'parent'`, {
				replacements: [breakdown.rvdhsmapId],
				type: models.sequelize.QueryTypes.SELECT
			},
		),
		models.sequelize.query(
			`SELECT
				users.id,
				users.device_id,
				users.is_notification,
				students.id as studentId
			FROM
				users
			INNER JOIN
				students
			ON
				students.userId = users.id
			INNER JOIN
				rvdhs_map_records
			ON
				rvdhs_map_records.studentId = students.id
				AND rvdhsmapId = ?
			WHERE
				users.is_active = 1`,
			{replacements:[breakdown.rvdhsmapId], type: models.sequelize.QueryTypes.SELECT}
		),
	]);

	notification.send(
		parents,
		'front/notification/vehiclebreakdown/parent',
		{lang: req.lang},
		{
			masterId: req.masterId,
			senderId: req.userId,
			data: {
				type: 'vehiclebreakdown'
			}
		}
	);
	notification.send(
		students,
		'front/notification/vehiclebreakdown/student',
		{lang: req.lang},
		{
			masterId: req.masterId,
			senderId: req.id,
			data: {
				type: 'vehiclebreakdown'
			}
		}
	);
}