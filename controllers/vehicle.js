var async = require('async');
const models = require('../models');
var language = require('./language');

function Vehicle() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    if (! req.vehicle_document) req.vehicle_document = '';
    if (! req.pollution_control_certificate) req.pollution_control_certificate = '';
    if (! req.insurance_certificate) req.insurance_certificate = '';
    if (! req.vehicle_detail.name) req.vehicle_detail.name = req.number;
    models.vehicledetail.belongsTo(models.vehicle);
    var vehicleHasOne = models.vehicle.hasOne(models.vehicledetail, {as: 'vehicle_detail'});
    req.vehicle_detail.languageId = req.langId;
    req.vehicle_detail.masterId = req.masterId;
    var vehicle = models.vehicle.build(req);
    var vehicleDetails = models.vehicledetail.build(req.vehicle_detail);
    var errors = [];



    // an example using an object instead of an array
    async.parallel([
        function (callback) {
            vehicle.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }
            })
        },
        function (callback) {
            vehicleDetails.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }
            })
        }
    ], function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          if (typeof req.id !== 'undefined' && req.id !== '') {
            req.vehicle_detail.vehicleId = req.id;
            models.vehicle.update(req,{where: {id:req.id}}).then(function(){
              let data = {id: req.id};
              models.vehicledetail.find({where:{vehicleId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.vehicle_detail.id = resultData.id;
                  models.vehicledetail.update(req.vehicle_detail, {where:{id:resultData.id, vehicleId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  })
                } else {
                  delete req.vehicle_detail.id;
                  models.vehicledetail.create(req.vehicle_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  })
                }
              })
            })
          } else {
            var langId = parseInt(req.vehicle_detail.languageId);
            models.vehicle.create(req, {include: [vehicleHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.vehicle_detail.vehicleId = data.id;
                req.vehicle_detail.languageId = 1;
                models.vehicledetail.create(req.vehicle_detail).then(function(){
                  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                })
              }
            })
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
      if (reqData.masterId !==1) {
        responseData.vehicle = {masterId:reqData.masterId};
      }
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

    models.vehicle.hasMany(models.vehicledetail);
    isWhere.vehicledetail = language.buildLanguageQuery(
      isWhere.vehicledetail, reqData.langId, 'vehicle.id', models.vehicledetail, 'vehicleId'
    );
    
    models.vehicle.findAndCountAll({
      include: [
        {model: models.vehicledetail, where:isWhere.vehicledetail},
      ],
      where: isWhere.vehicle,
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
    models.vehicle.hasMany(models.vehicledetail);
    var isWhere = {};
    isWhere.vehicledetail = language.buildLanguageQuery(
      isWhere.vehicledetail, req.langId, 'vehicle.id', models.vehicledetail, 'vehicleId'
    );
    
    models.vehicle.find({
      include: [{model: models.vehicledetail, where:isWhere.vehicledetail}],
      where:{
        id:req.id,
        masterId: req.masterId
      },
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.vehicle.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.remove = async req => {
    try {
      await models.vehicle.destroy({where: {id: req.id}});
    } catch (err) {
      return {
        status: false,
        message: language.lang({key: 'Can not delete vehicle, It is being used.'}),
      }
    }

    return {
      status: true,
      message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
    };
  };
}

module.exports = new Vehicle();
