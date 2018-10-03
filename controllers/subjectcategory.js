var async = require('async');
const models = require('../models');
var language = require('./language');
var subject = require('./subject');

function SubjectCategory() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var SubjectCategoryHasOne = models.subjectcategory.hasOne(models.subjectcategorydetail, {as: 'subjectcategory_detail'});
    req.subjectcategory_detail.languageId = req.langId;
    req.subjectcategory_detail.subjectId = req.subjectId;
    var subjectcategory = models.subjectcategory.build(req);
    var subjectcategoryDetails = models.subjectcategorydetail.build(req.subjectcategory_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        subjectcategory.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            subjectcategoryDetails.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }
    ], function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          if (typeof req.id !== 'undefined' && req.id !== '') {
            req.subjectcategory_detail.subjectCategoryId = req.id;
            models.subjectcategory.update(req,{where: {id:req.id}}).then(function(data){
              models.subjectcategorydetail.find({where:{subjectCategoryId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.subjectcategory_detail.id = resultData.id;
                  models.subjectcategorydetail.update(req.subjectcategory_detail, {where:{id:resultData.id, subjectCategoryId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.subjectcategory_detail.id;
                  models.subjectcategorydetail.create(req.subjectcategory_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.subjectcategory_detail.languageId);
            models.subjectcategory.create(req, {include: [SubjectCategoryHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.subjectcategory_detail.subjectCategoryId = data.id;
                req.subjectcategory_detail.languageId = 1;
                models.subjectcategorydetail.create(req.subjectcategory_detail).then(function(){
                  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
              }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }
        } else {
          language.errors({errors:uniqueError, lang:req.lang}, function(errors){
            var newArr = {};
            newArr.errors = errors;
            res(newArr);
          });
        }
    });
  };


  /*
   * list of all
  */
 this.list = function(req, res) {
    //var data = JSON.parse(req.body.data);

    var setPage = req.app.locals.site.page;
    var currentPage = 1;
    var pag = 1;
    if (typeof req.query.page !== 'undefined') {
        currentPage = +req.query.page;
        pag = (currentPage - 1)* setPage;
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
      responseData.subjectcategorydetail = {};
      responseData.subjectdetail = {masterId:reqData.masterId};
      async.forEach(Object.keys(req.query), function (item, callback) {
        if (req.query[item] !== ''){
          var modelKey = item.split('__');
          if(typeof responseData[modelKey[0]] =='undefined'){
            var col = {};
            col[modelKey[1]] = {$like: '%' + req.query[item] + '%'};
            responseData[modelKey[0]] = col;
          } else {
            responseData[modelKey[0]][modelKey[1]] = {$like: '%' + req.query[item] + '%'};
          }
        }
        callback();
      }, function () {
        isWhere = responseData;
      });
    }
    //isWhere['delete'] = 1;
    orderBy = 'id DESC';

    models.subjectcategory.hasMany(models.subjectcategorydetail);
    models.subjectcategory.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);

    isWhere.subjectcategorydetail = language.buildLanguageQuery(
      isWhere.subjectcategorydetail, reqData.langId, '`subjectcategory`.`id`', models.subjectcategorydetail, 'subjectCategoryId'
    );

    isWhere.subjectdetail = language.buildLanguageQuery(
      isWhere.subjectdetail, reqData.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
    );

    models.subjectcategory.findAndCountAll({
      include: [
        {model: models.subjectcategorydetail, where:isWhere.subjectcategorydetail},
        {model:models.subject, include: [{model: models.subjectdetail, where:isWhere.subjectdetail}]}
      ],
      where: isWhere.subjectcategory,
      order: [
        ['id', 'DESC']
      ],
      distinct: true,
      limit: setPage,
      offset: pag, subQuery: false
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.subjectcategory.hasMany(models.subjectcategorydetail, {foreignKey:'subjectCategoryId'});
    models.subjectcategory.find({
      include: [{
        model: models.subjectcategorydetail, 
        where: language.buildLanguageQuery({}, req.langId, '`subjectcategory`.`id`', models.subjectcategorydetail, 'subjectCategoryId')}], 
        where:{
          id:req.id,
          masterId: req.masterId
        }}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  Update for React-Redux admin
  */
  this.getEditData = function(req, res) {
    models.subjectcategory.hasMany(models.subjectcategorydetail, {foreignKey:'subjectCategoryId'});
    models.subjectcategory.find({
      include: [{
        model: models.subjectcategorydetail, 
        where: language.buildLanguageQuery({}, req.langId, '`subjectcategory`.`id`', models.subjectcategorydetail, 'subjectCategoryId')
      }], 
      where:{
        id:req.id,
        masterId: req.masterId
      }
    }).then(function(data){
      module.exports.getMetaInformations(req, function(result){
        res({data:data, subjects: result.subjects});
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.subjectcategory.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All subjectcategory
  */
 this.getAllSubjectcategory = function(req, res) {
    models.subjectcategory.hasMany(models.subjectcategorydetail);
    models.subjectcategory.findAll({
      include: [
        {model: models.subjectcategorydetail, where: language.buildLanguageQuery({}, req.langId, '`subjectcategory`.`id`', models.subjectcategorydetail, 'subjectCategoryId')}
      ],
      where:{is_active:1, subjectId:req.subjectId},
      order: [
        [models.subjectcategorydetail, 'name', 'ASC']
      ]
    }).then(function(data){
      res({data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getMetaInformations = function(req, res){
    subject.getAllSubject(req, function(subjects){
        res({subjects:subjects});
    });
  };
}



module.exports = new SubjectCategory();
