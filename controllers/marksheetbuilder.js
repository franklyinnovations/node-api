'use strict';

const
	models = require('../models'),
	marksheets = require('./marksheets'),
	language = require('./language');

models.marksheetbuilder.belongsToMany(models.bcsmap, {through: models.marksheetbuilderbcsmap});
models.marksheetbuilder.hasMany(models.marksheetbuilderbcsmap);

models.bcsmap.belongsTo(models.board);
models.bcsmap.belongsTo(models.classes);
models.bcsmap.belongsTo(models.section);

models.board.hasMany(models.boarddetail);

models.classes.hasMany(models.classesdetail);

models.section.hasMany(models.sectiondetail);

exports.list = req => {
	let pageSize = req.app.locals.site.page,
		page = req.query.page || 1,
		reqData = req.body,
		where = {
			masterId: reqData.masterId,
		};
	if (req.query.is_active) where.is_active = req.query.is_active;
	if (req.query.bcsmapId) where.bcsmapId = models.sequelize.literal(
		`(SELECT count(*) FROM marksheet_builder_bcsmaps WHERE
			marksheet_builder_bcsmaps.bcsmapId = ${parseInt(req.query.bcsmapId)}
			AND marksheet_builder_bcsmaps.marksheetbuilderId = marksheetbuilder.id)`
	);

	return models.marksheetbuilder.findAndCountAll({
		include: [
			{
				model: models.bcsmap,
				include: [
					{
						model: models.board,
						include: [
							{
								model: models.boarddetail,
								where: language.buildLanguageQuery(
									{},
									reqData.langId,
									'`bcsmaps.board`.`id`',
									models.boarddetail,
									'boardId'
								),
								attributes: ['alias'],
							}
						],
						attributes: ['id'],
					},
					{
						model: models.classes,
						include: [
							{
								model: models.classesdetail,
								where: language.buildLanguageQuery(
									{},
									reqData.langId,
									'`bcsmaps.class`.`id`',
									models.classesdetail,
									'classId'
								),
								attributes: ['name'],
							}
						],
						attributes: ['id'],
					},
					{
						model: models.section,
						include: [
							{
								model: models.sectiondetail,
								where: language.buildLanguageQuery(
									{},
									reqData.langId,
									'`bcsmaps.section`.`id`',
									models.sectiondetail,
									'sectionId'
								),
								attributes: ['name'],
							}
						],
						attributes: ['id'],
					},
				],
				attributes: ['id'],
			}
		],
		where,
		distinct: true,
		attributes: ['id', 'name', 'is_active'],
		limit: pageSize,
		offset: (page - 1) * pageSize,
	}).then(({rows: data, count: totalData}) => ({
		status: true,
		data,
		totalData,
		pageCount: Math.ceil(totalData / pageSize),
		pageLimit: pageSize,
		currentPage: page,
	}));
};

exports.save = req => {
	req.hasBCSMaps = !!req.bcsmaps && !!req.bcsmaps.length;
	return models.marksheetbuilder.build(req).validate().then(err => {
		if (err) {
			return {status: false, errors: language.makeErrors([err], req.lang)};
		} else if (req.id) {
			return updateMarksheetbuilder(req);
		} else {
			return createMarksheetbuilder(req);
		}
	});
};

exports.status = req => models.marksheetbuilder.update(
	{
		is_active: req.status
	},
	{
		where: {
			id: req.id,
			masterId: req.masterId,
		}
	}
);

exports.remove = req => Promise.all([
	models.marksheetbuilder.destroy({
		where: {
			id: req.id,
			masterId: req.masterId,
		},
	}),
	models.marksheetbuilderbcsmap.destroy({
		where: {
			marksheetbuilderId: req.id,
		}
	}),
]);

exports.getById = req => models.marksheetbuilder.find({
	include: [{model: models.bcsmap, attributes: ['id']}],
	where: {
		id: req.id,
		masterId: req.masterId,
	},
	attributes: [
		'id',
		'name',
		'template',
		'is_active',
	],
});

exports.settings = req => models.marksheetbuilder.find({
	where: {
		id: req.id,
		masterId: req.masterId,
	},
	attributes: ['id', 'template', 'settings'],
})
	.then(marksheetbuilder => marksheets[marksheetbuilder.template].settings(req, marksheetbuilder));

exports.saveSettings = req => models.marksheetbuilder.update(req, {
	where: {
		id: req.id,
		masterId: req.masterId,
	}
});

function updateMarksheetbuilder(req) {
	return models.marksheetbuilder.findById(req.id)
		.then(marksheetbuilder => {
			if (marksheetbuilder === null) throw 'marksheetbuilder not found';

			let marksheetbuilderbcsmaps = [],
				bcsmapIds = [],
				bcsmaps = req.bcsmaps || [];

			for (let i = bcsmaps.length - 1; i >= 0; i--) {
				marksheetbuilderbcsmaps.push({
					bcsmapId: bcsmaps[i],
					marksheetbuilderId: req.id
				});
				bcsmapIds.push(bcsmaps[i]);
			}
			return Promise.all([
				models.marksheetbuilderbcsmap.bulkCreate(
					marksheetbuilderbcsmaps,
					{ignoreDuplicates: true}
				)
					.then(() => models.marksheetbuilderbcsmap.destroy({
						where: {
							bcsmapId: {
								$notIn: bcsmapIds
							},
							marksheetbuilderId: req.id,
						}
					})),
				marksheetbuilder.update(req),
			]);
		})
		.then(() => ({
			status: true,
			message: language.lang({key:'updatedSuccessfully', lang: req.lang})
		}));
}

function createMarksheetbuilder(req) {
	req.marksheetbuilderbcsmaps = req.bcsmaps.map(bcsmapId => ({bcsmapId}));
	return models.marksheetbuilder.create(req, {
		include: models.marksheetbuilderbcsmap,
	}).then(() => ({
		status: true,
		message: language.lang({key: 'addedSuccessfully', lang: req.lang}),
	}));
}