var async = require('async');
const models = require('../models');
var language = require('./language');

function Theme() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var ThemeHasOne = models.theme.hasOne(models.themedetail, {as: 'theme_detail'});
    req.theme_detail.languageId = req.langId;
    var themeDetails = models.themedetail.build(req.theme_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
            themeDetails.validate().then(function (err) {
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
            req.theme_detail.themeId = req.id;
            models.theme.update(req,{where: {id:req.id}}).then(function(data){
              models.themedetail.find({where:{themeId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.theme_detail.id = resultData.id;
                  models.themedetail.update(req.theme_detail, {where:{id:resultData.id, themeId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.theme_detail.id;
                  models.themedetail.create(req.theme_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.theme_detail.languageId);
            models.theme.create(req, {include: [ThemeHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.theme_detail.themeId = data.id;
                req.theme_detail.languageId = 1;
                models.themedetail.create(req.theme_detail).then(function(){
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
      responseData.themedetail = {};
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

    isWhere.themedetail = language.buildLanguageQuery(
      isWhere.themedetail, reqData.langId, '`theme`.`id`', models.themedetail, 'themeId'
    );

    models.theme.hasMany(models.themedetail);
    models.theme.findAndCountAll({
      include: [
        {model: models.themedetail, where:isWhere.themedetail},
      ],
      where: isWhere.theme,
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
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.theme.hasMany(models.themedetail);
    models.theme.find({include: [{model: models.themedetail, where: language.buildLanguageQuery({}, req.langId, '`theme`.`id`', models.themedetail, 'themeId')}], where:{id:req.id}}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All Theme
  */
 this.getAllTheme = function(req, res) {
    models.theme.hasMany(models.themedetail);
    models.theme.findAll({include: [{model: models.themedetail, where: language.buildLanguageQuery({}, req.langId, '`theme`.`id`', models.themedetail, 'themeId')}],  where:{is_active:1}}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.theme.update(req,{where:{id:req.id}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
}

module.exports = new Theme();
