var async = require('async');
const models = require('../models');
var language = require('./language');
var country = require('./country');

function Govtidentity() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var GovtidentityHasOne = models.govtidentity.hasOne(models.govtidentitydetail, {as: 'govtidentity_detail'});
    req.govtidentity_detail.languageId = req.langId;
    req.govtidentity_detail.countryId = req.countryId;
    var govtidentity = models.govtidentity.build(req);
    var govtidentityDetails = models.govtidentitydetail.build(req.govtidentity_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        govtidentity.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            govtidentityDetails.validate().then(function (err) {
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
          delete req.govtidentity_detail.countryId;
          if (typeof req.id !== 'undefined' && req.id !== '') {
            req.govtidentity_detail.govtIdentityId = req.id;
            models.govtidentity.update(req,{where: {id:req.id}}).then(function(data){
              models.govtidentitydetail.find({where:{govtIdentityId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.govtidentity_detail.id = resultData.id;
                  models.govtidentitydetail.update(req.govtidentity_detail, {where:{id:resultData.id, govtIdentityId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.govtidentity_detail.id;
                  models.govtidentitydetail.create(req.govtidentity_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.govtidentity_detail.languageId);
            models.govtidentity.create(req, {include: [GovtidentityHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.govtidentity_detail.govtIdentityId = data.id;
                req.govtidentity_detail.languageId = 1;
                models.govtidentitydetail.create(req.govtidentity_detail).then(function(){
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

    models.govtidentity.hasMany(models.govtidentitydetail);
    models.govtidentity.belongsTo(models.country);
    models.country.hasMany(models.countrydetail);
    
    isWhere.govtidentitydetail = language.buildLanguageQuery(
      isWhere.govtidentitydetail, reqData.langId, '`govtidentity`.`id`', models.govtidentitydetail, 'govtIdentityId'
    );
    isWhere.countrydetail = language.buildLanguageQuery(
      isWhere.countrydetail, reqData.langId, '`country`.`id`', models.countrydetail, 'countryId'
    );

    models.govtidentity.findAndCountAll({
      include: [
        {model: models.govtidentitydetail, where:isWhere.govtidentitydetail},
        {model:models.country, include: [{model: models.countrydetail, where:isWhere.countrydetail}]}
      ],
      where: isWhere.govtidentity,
      order: [
        ['id', 'DESC']
      ],
      distinct: true,
      limit: setPage,
      offset: pag
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
    models.govtidentity.hasMany(models.govtidentitydetail);
    var isWhere = {};
    isWhere.govtidentitydetail = language.buildLanguageQuery(
      isWhere.govtidentitydetail, req.langId, '`govtidentity`.`id`', models.govtidentitydetail, 'govtIdentityId'
    );
    models.govtidentity.find({
      include: [
        {model: models.govtidentitydetail, where:isWhere.govtidentitydetail}
      ],
      where:{
        id:req.id
      }
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  * Update for react-redux admin
  */
  this.getEditData = function(req, res) {
    models.govtidentity.hasMany(models.govtidentitydetail);
    var isWhere = {};
    isWhere.govtidentitydetail = language.buildLanguageQuery(
      isWhere.govtidentitydetail, req.langId, '`govtidentity`.`id`', models.govtidentitydetail, 'govtIdentityId'
    );
    models.govtidentity.find({
      include: [
        {model: models.govtidentitydetail, where:isWhere.govtidentitydetail}
      ],
      where:{
        id:req.id
      }
    }).then(function(data){
      module.exports.getMetaInformations(req, function(result){
        res({data:data, countries:result.countries});
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get Govtidentity By CountryId
  */
 this.getGovtidentityByCountryId = function(req, res) {
    models.govtidentity.hasMany(models.govtidentitydetail);
    var isWhere = {};
    isWhere.govtidentitydetail = language.buildLanguageQuery(
      isWhere.govtidentitydetail, req.langId, '`govtidentity`.`id`', models.govtidentitydetail, 'govtIdentityId'
    );
    models.govtidentity.findAll({
      include: [
        {model: models.govtidentitydetail, where:isWhere.govtidentitydetail}
      ],
      where:{is_active:1, countryId:req.countryId}
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.govtidentity.update(req,{where:{id:req.id}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getMetaInformations = function(req, res){
    country.getAllCountry(req, function(countries){
        res({countries:countries});
    });
  };
}

module.exports = new Govtidentity();
