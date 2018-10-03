var async = require('async');
const models = require('../models');
var language = require('./language');

models.empleavetype.hasMany(models.empleavetypedetail, {foreignKey:'empLeaveTypeId'});

function Empleavetype() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var empleavetypeHasOne = models.empleavetype.hasOne(models.empleavetypedetail, {as: 'empleavetype_detail', foreignKey:'empLeaveTypeId'});
    req.empleavetype_detail.languageId = req.langId;
    req.empleavetype_detail.masterId = req.masterId;
    var empleavetype = models.empleavetype.build(req);
    var empleavetypeDetails = models.empleavetypedetail.build(req.empleavetype_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
          empleavetype.validate().then(function (err) {
              if (err !== null) {
                  errors = errors.concat(err.errors);
                  callback(null, errors);
              } else {
                  callback(null, errors);
              }
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      },
        function (callback) {
            empleavetypeDetails.validate().then(function (err) {
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
            req.empleavetype_detail.empLeaveTypeId = req.id;
            models.empleavetype.update(req,{where: {id:req.id}}).then(function(data){
              models.empleavetypedetail.find({where:{empLeaveTypeId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.empleavetype_detail.id = resultData.id;
                  models.empleavetypedetail.update(req.empleavetype_detail, {where:{id:resultData.id, empLeaveTypeId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.empleavetype_detail.id;
                  models.empleavetypedetail.create(req.empleavetype_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.empleavetype_detail.languageId);
            models.empleavetype.create(req, {include: [empleavetypeHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.empleavetype_detail.empLeaveTypeId = data.id;
                req.empleavetype_detail.languageId = 1;
                models.empleavetypedetail.create(req.empleavetype_detail).then(function(){
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
      responseData.empleavetype = {masterId:reqData.masterId};
      async.forEach(Object.keys(req.query), function (item, callback) {
        if (req.query[item] !== ''){
          var modelKey = item.split('__');
          if(typeof responseData[modelKey[0]] =='undefined'){
            var col = {};
            if (modelKey.length === 3) {
               col[modelKey[1]] = req.query[item];
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

    models.empleavetype.hasMany(models.empleavetypedetail, {foreignKey:'empLeaveTypeId'});
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, reqData.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
    );
    
    models.empleavetype.findAndCountAll({
      include: [
        {model: models.empleavetypedetail, where:isWhere.empleavetypedetail},
      ],
      where: isWhere.empleavetype,
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
    models.empleavetype.hasMany(models.empleavetypedetail);
    var isWhere = {};
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, req.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
    );
    models.empleavetype.find({
      include: [{
        model: models.empleavetypedetail, 
        where:isWhere.empleavetypedetail
      }], 
      where:{
        id:req.id,
        masterId: req.masterId
      }}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All Sections
  */
 this.getAllEmpLeaveType = function(req, res) {
    models.empleavetype.hasMany(models.empleavetypedetail);
    var isWhere = {};
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, req.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
    );
    models.empleavetype.findAll({
      include: [{model: models.empleavetypedetail, where:isWhere.empleavetypedetail}],
      where:{is_active:1, masterId:req.masterId},
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ]}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };



  /*
   * status update
  */
 this.status = function(req, res) {
    models.empleavetype.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.remove = async req => {
    try {
      await models.empleavetype.destroy({where: {id: req.id}});
    } catch (err) {
      return {
        status: false,
        message: language.lang({key: 'Can not delete leave type, It is being used.'}),
      }
    }

    return {
      status: true,
      message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
    };
  };
}

module.exports = new Empleavetype();
