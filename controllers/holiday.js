var async = require('async');
const models = require('../models');
var language = require('./language');

function Holiday() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var holidayHasOne = models.holiday.hasOne(models.holidaydetail, {as: 'holidaydetails'});
    req.holidaydetails = {};
    req.holidaydetails.name = req.name;
    req.holidaydetails.languageId = req.langId;
    req.holidaydetails.masterId = req.masterId;
    var holiday = models.holiday.build(req);
    var holidayDetails = models.holidaydetail.build(req.holidaydetails);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
            holiday.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            holidayDetails.validate().then(function (err) {
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
            req.holidaydetails.holidayId = req.id;
            //models.holiday.update(req,{where: {id:req.id}}).then(function(data){
              models.holidaydetail.find({where:{holidayId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.holidaydetails.id = resultData.id;
                  models.holidaydetail.update(req.holidaydetails, {where:{id:resultData.id, holidayId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang})});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.holidaydetails.id;
                  models.holidaydetail.create(req.holidaydetails).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang})});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            //});
          } else {
            var langId = parseInt(req.holidaydetails.languageId);
            models.holiday.create(req, {include: [holidayHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.holidaydetails.holidayId = data.id;
                req.holidaydetails.languageId = 1;
                models.holidaydetail.create(req.holidaydetails).then(function(){
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

  
  this.eventList = function(req, res){
    models.holiday.hasMany(models.holidaydetail);
    var isWhere = {};
    isWhere.holidaydetail = language.buildLanguageQuery(
      isWhere.holidaydetail, req.langId, '`holiday`.`id`', models.holidaydetail, 'holidayId'
    );
    models.holiday.findAll({
      include: [
        {model: models.holidaydetail, where:isWhere.holidaydetail}
      ],
      where:{masterId:req.masterId, start_date:{$between:[req.start, req.end]}},
      order: [['start_date']]
    }).then(function(data){
      res({events:data});
    })
    .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
  this.isHoliday = function(req, res){
    var langIdArr = req.langId.split(',');
    models.holiday.hasMany(models.holidaydetail);
    
    var srch={};
    srch['masterId']=req.masterId;
    srch['end_date']={$gte:req.date};
    srch['start_date']={$lte:req.date};
    
    models.holiday.findAll({
      include:
      [
        {
          model: models.holidaydetail,
          where: language.buildLanguageQuery(
            {}, req.langId, '`holiday`.`id`', models.holidaydetail, 'holidayId'
          )
        }
      ],
      where:srch,
      order: [['start_date']]
    })
    .then(function(data){
      res({events:data});  
    })
    .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
   /*
   * status update
  */
 this.removeEvent = function(req, res) {
    models.holiday.destroy({where:{id:req.id}}).then(function(data){
      models.holidaydetail.destroy({where:{holidayId:req.id}}).then(function(){
        res({status:true, message:language.lang({key:"deleteSuccessfully", lang:req.lang}), data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
}

module.exports = new Holiday();
