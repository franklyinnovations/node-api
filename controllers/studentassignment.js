var async = require('async');
const models = require('../models');
var language = require('./language');

function studentAssignment() {
	/*
	 * list of all
	*/
	this.list = function(req, res) {
		var setPage = req.app.locals.site.page;
		var currentPage = 1;
		var pag = 1;
		if (typeof req.query.page !== 'undefined') {
							
			currentPage = +req.query.page;        
			pag = (currentPage - 1)* setPage;
			if(pag < 0){
				pag = 0;    
			}
			delete req.query.page;
		} else {
			pag = 0;
		}
				
		/*
		* for  filltering
		*/
		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			responseData.assignment  = {};
			responseData.assignmentremark  = {};
			if(typeof req.query.tagId !='undefined' && req.query.tagId !== ''){
				var assignmentRemarkboolean = true;
				responseData.assignmentremark.tags = req.query.tagId;
			}else{
				var assignmentRemarkboolean = false;
			}

			responseData.assignment.masterId = reqData.masterId;
			responseData.assignment.bcsMapId = reqData.bcsMapId;
			responseData.assignment.assignment_status = {$in:['Published', 'Completed']};
			responseData.assignmentdetail = {};
			responseData.assignment.academicSessionId = reqData.academicSessionId;
			responseData.assignmentremark.studentId = reqData.userId;
			
			async.forEach(Object.keys(req.query), function (item, callback) {
				if (req.query[item] !== ''){
					var modelKey = item.split('__');
					if(typeof responseData[modelKey[0]] =='undefined'){
						var col = {};
						if (modelKey.length === 3) {
							if(modelKey[2] === 'gte'){
								col[modelKey[1]] = {$gte: req.query[item]};
							}else{
								col[modelKey[1]] = req.query[item];
							}
						} else {
							col[modelKey[1]] = {$like: '%' + req.query[item] + '%'};
						}
						responseData[modelKey[0]] = col;
					} else {
						if (modelKey.length === 3) {
							responseData[modelKey[0]][modelKey[1]] = req.query[item];
						} else {
							responseData[modelKey[0]][modelKey[1]] = {$like: '%' + req.query[item] + '%'};
						}
					}
				}
				callback();
			}, function () {
				isWhere = responseData;
			});
		}
		//isWhere['delete'] = 1;
		orderBy = 'id DESC';

		models.assignment.hasMany(models.assignmentdetail);
		models.assignment.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.assignment.belongsTo(models.bcsmap,{foreignKey: 'bcsMapId'});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		models.assignment.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		models.assignment.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
		models.assignment.hasMany(models.assignmentremark);
		models.assignmentremark.belongsTo(models.tag,{foreignKey: 'tags'});
		models.tag.hasMany(models.tagdetail);
		//models.institute.hasMany(models.institutedetail);

		isWhere.assignmentdetail = language.buildLanguageQuery(
			isWhere.assignmentdetail, reqData.langId, '`assignment`.`id`', models.assignmentdetail, 'assignmentId'
		);

		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
		);

		isWhere.subjectdetail = language.buildLanguageQuery(
			isWhere.subjectdetail, reqData.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
		);

		isWhere.tagdetail = language.buildLanguageQuery(
			isWhere.tagdetail, reqData.langId, '`assignmentremarks.tag`.`id`', models.tagdetail, 'tagId'
		);
		
		models.assignment.findAndCountAll({
			include: [
				{
					model: models.assignmentdetail, 
					where:isWhere.assignmentdetail
				},
				{
					model: models.bcsmap,
					 include: [{model: models.board, attributes:['id'],
						 include: [{model: models.boarddetail,
							 attributes:['id', 'name', 'alias'],
							 where: language.buildLanguageQuery({}, reqData.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId')
						 }]
					 },{model: models.classes, attributes:['id'],
						 include: [{model: models.classesdetail,
							 attributes:['id', 'name'],
							 where: language.buildLanguageQuery({}, reqData.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId')
						 }]
					 },{model: models.section, attributes:['id'],
						 include: [{model: models.sectiondetail,
							 attributes:['id', 'name'],
							 where: language.buildLanguageQuery({}, reqData.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId')
						 }]
					 }],
				},
				{
					model: models.subject, attributes:['id'], 
					include:[{model: models.subjectdetail, 
						attributes:['id', 'name'], 
						where:isWhere.subjectdetail
					}]
				},
				{
					model: models.user, attributes:['id'], 
					include:[{model: models.userdetail, 
						attributes:['id', 'fullname'], 
						where:isWhere.userdetail
					}]
				},
				{
					model: models.assignmentremark, 
					attributes:['id'], 
					required:assignmentRemarkboolean,
					include:[{model: models.tag, attributes:['id'], required:assignmentRemarkboolean,
						include: [{model: models.tagdetail, required:assignmentRemarkboolean,
							attributes:['id', 'title', 'description'],
							where: isWhere.tagdetail
						}]
					}],
					where:isWhere.assignmentremark,
				},
			],
			where: isWhere.assignment,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);
			res({status:true, message:language.lang({key:'assignmentList', lang:req.lang}),data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: reqData.lang}), url: true}));
	};

	/*
   * view data
  */
	this.viewData = function(req, res) {
		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};

		models.assignment.hasMany(models.assignmentdetail);
		models.assignment.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.assignment.belongsTo(models.bcsmap,{foreignKey: 'bcsMapId'});
		models.bcsmap.belongsTo(models.board);
		models.board.hasMany(models.boarddetail);
		models.bcsmap.belongsTo(models.classes);
		models.classes.hasMany(models.classesdetail);
		models.bcsmap.belongsTo(models.section);
		models.section.hasMany(models.sectiondetail);
		models.assignment.belongsTo(models.subject);
		models.subject.hasMany(models.subjectdetail);
		models.assignment.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
		models.assignment.hasMany(models.assignmentremark);
		models.assignmentremark.belongsTo(models.tag,{foreignKey: 'tags'});
		models.tag.hasMany(models.tagdetail);
		//models.institute.hasMany(models.institutedetail);

		isWhere.assignmentdetail = language.buildLanguageQuery(
			isWhere.assignmentdetail, reqData.langId, '`assignment`.`id`', models.assignmentdetail, 'assignmentId'
		);

		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
		);

		isWhere.subjectdetail = language.buildLanguageQuery(
			isWhere.subjectdetail, reqData.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
		);

		isWhere.tagdetail = language.buildLanguageQuery(
			isWhere.tagdetail, reqData.langId, '`assignmentremarks.tag`.`id`', models.tagdetail, 'tagId'
		);

		models.assignment.find({
			include: [
				{
					model: models.assignmentdetail, 
					where:isWhere.assignmentdetail
				},
				{
					model: models.subject, attributes:['id'], 
					include:[{model: models.subjectdetail, 
						attributes:['id', 'name'], 
						where:isWhere.subjectdetail
					}]
				},
				{
					model: models.user, attributes:['id'], 
					include:[{model: models.userdetail, 
						attributes:['id', 'fullname'], 
						where:isWhere.userdetail
					}]
				},
				{
					model: models.assignmentremark, 
					attributes:['id'], 
					required:false,
					include:[{model: models.tag, attributes:['id'], required:false,
						include: [{model: models.tagdetail, required:false,
							attributes:['id', 'title', 'description'],
							where: isWhere.tagdetail
						}]
					}],
					where:{studentId:reqData.userId},
				},
			],
			where: {id:reqData.id},
		}).then(function(data){
			res(data);
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: 'Internal Error', lang: req.lang}), url: true}));
	};

}

module.exports = new studentAssignment();
