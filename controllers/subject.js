'use strict';

const
	models = require('../models'),
	language = require('./language');

models.subject.hasMany(models.subjectdetail);
models.subject.hasMany(models.subjectcategory);
models.subjectcategorydetail.hasMany(models.subjectcategorydetail, {
	foreignKey: 'subjectCategoryId'
});
models.subjectdetail.belongsTo(models.subject);

exports.list = req => {
	let pageSize = req.app.locals.site.page,
		page = req.query.page || 1,
		reqData = req.body,
		where = {
			subject: {
				masterId: reqData.masterId,
			},
			subjectdetail: language.buildLanguageQuery(
				null,
				reqData.langId,
				'`subject`.`id`',
				models.subjectdetail,
				'subjectId'
			),
			subjectcategorydetail: language.buildLanguageQuery(
				null,
				reqData.langId,
				'`subjectcategories`.`id`',
				models.subjectcategorydetail,
				'subjectCategoryId'
			),
		};

	if (req.query.name) where.subjectdetail.name = {$like: '%' + req.query.name + '%'};
	if (req.query.alias) where.subjectdetail.alias = {$like: '%' + req.query.alias + '%'};
	if (req.query.is_active) where.subject.is_active = req.query.is_active;

	return Promise.all([
		models.subject.findAndCountAll({
			include: [
				{
					model: models.subjectdetail,
					where: where.subjectdetail,
					attributes: ['name', 'alias'],
				},
				{
					model: models.subjectcategory,
					include:[
						{
							model: models.subjectcategorydetail,
							where: where.subjectcategorydetail,
							attributes: ['name'],
							required: false,
						}
					],
					attributes: ['id'],
					required: false,
				}
			],
			where: where.subject,
			distinct: true,
			attributes: ['id', 'is_active'],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			order: [['id', 'DESC']],
		}),
	])
		.then(([{rows: data, count: totalData}]) => ({
			status: true,
			data,
			totalData,
			pageCount: Math.ceil(totalData / pageSize),
			pageLimit: pageSize,
			currentPage: page,
		}));
};

exports.save = req => {
	req.subjectdetail.languageId = req.langId;
	req.subjectdetail.masterId = req.masterId;
	for (let i = req.subjectcategories.length - 1; i >= 0; i--) {
		let subjectcategory = req.subjectcategories[i];
		subjectcategory.masterId = req.masterId;
		subjectcategory.subjectcategorydetail.languageId = req.langId;
	}
	return Promise.all([
		models.subject.build(req).validate(),
		models.subjectdetail.build(req.subjectdetail).validate()
	])
		.then(([err1, err2]) => {
			let errors = language.makeErrors([err1, err2], req.lang);
			return errors ? {status: false, errors} : (req.id ? updateSubject(req) : createSubject(req));
		});
	
};

exports.status = req => models.subject.update(
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

exports.remove = async req => {
	try {
		await models.subject.destroy({where: {id: req.id}});
	} catch (err) {
		return {
			status: false,
			message: language.lang({key: 'Can not delete subject, It is being used.'}),
		};
	}

	return {
		status: true,
		message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
	};
};

exports.getById = req => models.subject.find({
	include: [
		{
			model: models.subjectdetail,
			where: language.buildLanguageQuery(
				null,
				req.langId,
				'`subject`.`id`',
				models.subjectdetail,
				'subjectId'
			),
		},
		{
			model: models.subjectcategory,
			include: [
				{
					model: models.subjectcategorydetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`subjectcategories`.`id`',
						models.subjectcategorydetail,
						'subjectCategoryId',
					),
					required: false,
				}
			],
			required: false,
		},
	],
	where: {
		id: req.id,
		masterId: req.masterId,
	}
});


async function createSubject(req) {
	req.subjectdetails = [req.subjectdetail];
	if (req.langId != 1) {
		req.subjectdetails.push({...req.subjectdetail, languageId: 1});
	}
	for (let i = req.subjectcategories.length - 1; i >= 0; i--) {
		let subjectcategory = req.subjectcategories[i];
		subjectcategory.subjectcategorydetails = [subjectcategory.subjectcategorydetail];
		if (req.langId != 1) {
			subjectcategory.subjectcategorydetails.push({
				...subjectcategory.subjectcategorydetail,
				languageId: 1,
			});
		}
	}
	await models.subject.create(req, {
		include: [
			models.subjectdetail,
			{
				model: models.subjectcategory,
				include: models.subjectcategorydetail,
			},
		],
	});

	return {
		status: true,
		message: language.lang({
			key: 'addedSuccessfully',
			lang: req.lang
		})
	};
}

async function updateSubject(req) {
	const oldSubjectCategories = [], newSubjectCategories = [];
	for (let i = req.subjectcategories.length - 1; i >= 0; i--) {
		let subjectcategory = req.subjectcategories[i];
		if (subjectcategory.id)
			oldSubjectCategories.push(subjectcategory);
		else
			newSubjectCategories.push(subjectcategory);
	}

	const removedSubjectCategories = {subjectId: req.id};
	if (oldSubjectCategories.length !== 0) {
		removedSubjectCategories.id = {$notIn: oldSubjectCategories.map(item => item.id)};
	}

	await Promise.all([
		models.subjectcategory.destroy({
			where: removedSubjectCategories,
		})
	]);

	delete req.subjectdetail.id;

	await Promise.all([
		models.subject.update(req, {where: {id: req.id}}),
		models.subjectdetail.upsert(req.subjectdetail),
		Promise.all(
			newSubjectCategories.map(
				subjectcategory => {
					subjectcategory.subjectcategorydetails = [subjectcategory.subjectcategorydetail];
					if (req.langId != 1) {
						subjectcategory.subjectcategorydetails.push({
							...subjectcategory.subjectcategorydetail,
							languageId: 1,
						});
					}
					return models.subjectcategory.create(
						subjectcategory, {
							include: models.subjectcategorydetail,
						}
					);
				}
			)
		),
		models.subjectcategory.bulkCreate(oldSubjectCategories, {
			updateOnDuplicate: ['is_active'],
		}),
		models.subjectcategorydetail.bulkCreate(
			oldSubjectCategories.map(subjectcategory => {
				delete subjectcategory.subjectcategorydetail.id;
				return subjectcategory.subjectcategorydetail;
			}),
			{
				updateOnDuplicate: ['name'],
			}
		),
	]);

	return {
		status: true,
		message: language.lang({
			key: 'updatedSuccessfully',
			lang: req.lang
		})
	};
}


/*
   * get All Subject
  */
exports.getAllSubject = function(req, res) {
	models.subject.hasMany(models.subjectdetail);
	models.subject.findAll({
		include: [{
			model: models.subjectdetail,
			where: language.buildLanguageQuery({}, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId')
		}],
		where:{
			masterId:req.masterId,
			is_active:1
		}
	}).then(function(data){
		res(data);
	}).catch(() => res({
		status:false,
		error: true,
		error_description: language.lang({key: 'Internal Error', lang: req.lang}),
		url: true
	}));
};
