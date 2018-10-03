'use strict';

const
	moment = require('moment'),
	models = require('../models'),
	language = require('./language'),
	marksheets = require('./marksheets');

models.studentrecord.belongsTo(models.student);
models.student.belongsTo(models.user);

models.bcsmap.belongsTo(models.board);
models.bcsmap.belongsTo(models.classes);
models.bcsmap.belongsTo(models.section);
models.bcsmap.belongsTo(models.grade);
models.bcsmap.belongsToMany(models.marksheetbuilder, {through: models.marksheetbuilderbcsmap});

models.board.hasMany(models.boarddetail);

models.classes.hasMany(models.classesdetail);

models.section.hasMany(models.sectiondetail);

const bcsname = models.sequelize.literal(
	'CONCAT(`board.boarddetails`.`alias`,'
	+ ' " - " , `class.classesdetails`.`name`,'
	+ ' " - " ,`section.sectiondetails`.`name`)'
);

exports.data = req => Promise.all([
		models.marksheetbuilder
		.find({
			where: {
				id: req.marksheetbuilderId,
				masterId: req.masterId,
			},
			attributes: ['template', 'settings'],
		}),
		req.bcsmapId || (req.preview && models.marksheetbuilderbcsmap.find({
			where: {
				marksheetbuilderId: req.marksheetbuilderId,
			}
		}).then(marksheetbuilderbcsmap => marksheetbuilderbcsmap.bcsmapId))
	])
	.then(([marksheetbuilder, bcsmapId]) => {
		if (marksheetbuilder === null || bcsmapId === null)
			return {status: false, message: 'Invalid URL'};
		if (marksheetbuilder.settings === null)
			return {status: false, message: 'Please create settings'};
		req.template = marksheetbuilder.template;
		req.settings = marksheetbuilder.settings;
		req.bcsmapId = bcsmapId;
		if (!req.students) {
			return models.studentrecord.scope(
				{ method: ['transferred', moment().format('YYYY-MM-DD')]}
			).findAll({
				include: [
					{
						model: models.student,
						include: [
							{
								model: models.user,
								where: {
									is_active: 1,
								},
								attributes: [],
							},
						],
						attributes: [],
					},
				],
				where: {
					masterId: req.masterId,
					academicSessionId: req.academicSessionId,
					bcsMapId: bcsmapId,
				},
				attributes: ['studentId'],
				limit: req.preview ? 1 : undefined,
			})
			.then(studentrecords => {
				req.students = studentrecords.map(studentrecord => studentrecord.studentId);
				return req;
			});
		} else {
			return req;
		}
	})
	.then(req => {
		if (req.status === false) {
			return req;
		} else if (req.students.length === 0) {
			return {status: false, message: 'No students found'};
		} else {
			return marksheets[req.template].data(req);
		}
	});

exports.bcsmaps = req => models.bcsmap.findAll({
	include: [
		{
			model: models.marksheetbuilder,
			attributes: [],
			where: {
				is_active: 1,
			},
		},
		{
			model: models.board,
			include: [
				{
					model: models.boarddetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`board`.`id`',
						models.boarddetail,
						'boardId'
					),
					attributes: [],
				}
			],
			attributes: [],
		},
		{
			model: models.classes,
			include: [
				{
					model: models.classesdetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`class`.`id`',
						models.classesdetail,
						'classId'
					),
					attributes: [],
				}
			],
			attributes: [],
		},
		{
			model: models.section,
			include: [
				{
					model: models.sectiondetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`section`.`id`',
						models.sectiondetail,
						'sectionId'
					),
					attributes: [],
				}
			],
			attributes: [],
		},
	],
	where: {
		masterId: req.masterId,
		is_active: 1,
	},
	attributes: [
		'id',
		[bcsname, 'name'],
	],
});

exports.studentsAndMarksheetBuilders = req => Promise.all([
	models.marksheetbuilder.findAll({
		include: [
			{
				model: models.marksheetbuilderbcsmap,
				where: {
					bcsmapId: req.bcsmapId,
				},
				attributes: [],
			}
		],
		where: {
			masterId: req.masterId,
		},
		attributes: ['id', 'name'],
	}),
	models.studentrecord.scope(
		{ method: ['transferred', moment().format('YYYY-MM-DD')]}
    ).findAll({
		include: [
			{
				model: models.student,
				include: [
					{
						model: models.user,
						include: [
							{
								model: models.userdetail,
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`student.user`.`id`',
									models.userdetail,
									'userId'
								),
								attributes: [],
							},
						],
						where: {
							is_active: 1,
						},
						attributes: [],
					},
				],
				attributes: [],
			}
		],
		where: {
			bcsmapId: req.bcsmapId,
			academicSessionId: req.academicSessionId,
		},
		attributes: [
			[models.sequelize.literal('`student`.`id`'), 'id'],
			[models.sequelize.literal('`student.user.userdetails`.`fullname`'), 'fullname'],
		],
		order: [
			['roll_no'],
			[models.student, 'id', 'DESC'],
		]
	}),
]);

exports.creator = req => models.marksheetbuilder.find({
		where: {
			id: req.marksheetbuilderId,
		},
		attributes: ['template'],
	})
	.then(marksheetbuilder => {
		if (marksheetbuilder === null)
			throw 'Invalid marksheetbuilderId';
		return Promise.all([
			marksheetbuilder.template,
			marksheets[marksheetbuilder.template].creator(req),
		]);
	});

exports.save = req => {
	if (req.marksheet.id) {
		return updateMarksheet(req);
	} else {
		return createMarksheet(req);
	}
};

function createMarksheet(req) {
	return models.marksheet.create(req.marksheet)
	.then(marksheet => {
		req.marksheet.marksheetrecords.forEach(
			marksheetrecord => marksheetrecord.marksheetId = marksheet.id
		);
		return models.marksheetrecord.bulkCreate(req.marksheet.marksheetrecords);
	});
}

function updateMarksheet(req) {
	return Promise.all([
		models.marksheet.update(req.marksheet, {
			where: {
				id: req.marksheet.id
			}
		}),
		models.marksheetrecord.bulkCreate(req.marksheet.marksheetrecords, {
			validate: false,
			updateOnDuplicate: ['data'],
		}),
	])

}