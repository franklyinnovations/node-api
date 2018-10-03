'use strict';

const models = require('../models'),
 language = require('./language');

function Tag() {

this.list = function (req, res) {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;
	
	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body, where = {
		tagdetail: {}
	};

	if (reqData.masterId !== 1) {
		where.tag = {masterId: reqData.masterId};
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

	where.tagdetail = language.buildLanguageQuery(
		where.tagdetail, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
	);

	models.tag.hasMany(models.tagdetail);
	models.tag.findAndCountAll({
		include: [
			{ model: models.tagdetail, where: where.tagdetail}
		],
		distinct: true,
		where: where.tag,
		order: [
			['id', 'DESC']
		],
		limit: pageSize,
		offset: (page - 1) * pageSize
	})
	.then(result => {
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
		error_description: language.lang({key: "Internal Error",lang: req.lang}),
		url: true
	}));
};

this.getById = function(req, res) {
	models.tag.hasMany(models.tagdetail);
	models.tag.findOne(
		{
			where: {
				id: req.id,
				masterId: req.masterId
			}
			, include: [
				{
					model: models.tagdetail
					, where: language.buildLanguageQuery(
						{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
					)
				}
			]
		}
	)
	.then(res)
	.catch(() => res({
		status:false,
		error: true,
		error_description: language.lang({key: "Internal Error", lang: req.lang}),
		url: true
	}));
};

this.save = function (req, res) {
	const TagHasOne = models.tag.hasOne(models.tagdetail, {as: 'tagdetail'});
	req.tagdetail.languageId = req.langId;

	if (typeof req.is_active === 'undefined') {
		req.is_active = 1;
	}

	Promise.all([
		models.tag.build(req).validate().then(err => err)
		, models.tagdetail.build(req.tagdetail).validate().then(err => err)
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
					{errors: errors, lang: req.lang}
					, errors => resolve({errors: errors})
				);
			});
		} else if (! req.id) {
			return models.tag.create(req, {include: [TagHasOne]})
			.then(data => {
				if (req.langId === 1) {
					return {
						status: true
						, message: language.lang({key:"addedSuccessfully", lang: req.lang})
						, data: data
					};
				} else {
					// tagdetail for english is necessary
					req.tagdetail.tagId = data.id;
					req.tagdetail.languageId = 1;
					return models.tagdetail.create(req.tagdetail)
					.then(tagdetail => ({
						status: true
						, message: language.lang({key:"addedSuccessfully", lang: req.lang})
						, data: data 
					}));
				}
			});
		} else {
			return models.tag.update(req, {where: {id: req.id}})
			.then(data => {
				return models.tagdetail.findOne({where: {tagId: req.id, languageId: req.langId}})
				.then(tagdetail => {
					if (tagdetail === null) {
						req.tagdetail.tagId = req.id;
						req.tagdetail.languageId = req.langId;
						delete req.tagdetail.id;
						return models.tagdetail.create(req.tagdetail);
					} else {
						return tagdetail.update(req.tagdetail).then(() => data);
					}
				})
				.then(tagdetail => ({
					status: true
					, message: language.lang({key:"updatedSuccessfully", lang: req.lang})
					, data: data
				}));
			});
		}
	})
	.catch(() => ({
		status: false
		, error: true
		, error_description: language.lang({key:"Internal Error", lang: req.lang})
		, url: true
	}))
	.then(res);
};

this.status = function (req, res) {
	models.tag.update(req, {where: {id: req.id, masterId: req.masterId}})
	.then(data => res({
		status: true
		, message: language.lang({key:"updatedSuccessfully", lang:req.lang})
		, data: data
	}))
	.catch(() => res({
		status:false
		, error: true
		, error_description: language.lang({key: "Internal Error", lang: req.lang})
		, url: true
	}));
}

this.remove = function (req, res) {
	models.tag.hasMany(models.tagdetail, {foreignKey: 'tagId', onDelete: 'CASCADE', hooks: true});
	models.tag.destroy({include: [{model: models.tagdetail}], where: {id: req.id}})
	.then(() => models.tagdetail.destroy({where: {tagId: req.id}}))
	.then(data => res({
		status: true
		, message:language.lang({key:"deletedSuccessfully", lang:req.lang})
		, data: data
	}))
	.catch(() => res({
		status:false
		, error: true
		, error_description: language.lang({key: "Internal Error", lang: req.lang})
		, url: true
	}));
}

this.getAll = function (req) {
	var where = {
		masterId: req.masterId || -1
		, is_active: 1
	};

	if (req.type !== undefined) where.type = req.type;

	models.tag.hasMany(models.tagdetail);
	return models.tag.findAll({
		include: [{
			model: models.tagdetail
			, where: language.buildLanguageQuery(
				{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
			)
			, attributes: ['title', 'description']
		}]
		, where
		, attributes: ['id']
	})
	.then(result => ({
		status: true
		, data: result
	}));
};

this.copy = function (req) {
	models.tag.hasMany(models.tagdetail);
	return models.tag.findAll({
		include: [{
			model: models.tagdetail
		}]
		, where: {
			masterId: req.sourceMasterId
		}
	})
	.then(results => {
		var copies = [];
		for (var i = results.length - 1; i >= 0; i--) {
			let tag = results[i].toJSON();
			delete tag.id;
			tag.masterId = req.targetMasterId;
			tag.userId = 0; 
			copies.push(
				models.tag.create(tag, {
					validate: false
				})
				.then(newTag => {
					tag.tagdetails.forEach(tagdetail => {
						tagdetail.tagId = newTag.id;
						delete tagdetail.id;
					});
					return models.tagdetail.bulkCreate(tag.tagdetails, {
						validate: false
					});
				})
			);
		}
		return Promise.all(copies);
	})
	.then(() => ({
		status: true,
		message: 'Copied'
	}));
};

}

module.exports = new Tag();