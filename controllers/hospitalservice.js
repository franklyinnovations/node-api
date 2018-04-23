var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var utils = require('./utils');
var hospital = require('./hospital');
var doctor = require('./doctor');

function Hospitalservice() {

  this.list = function (req, res) {
    var pageSize = req.app.locals.site.page, // number of items per page
    page = req.query.page || 1;

    var reqData = req.body.data ? JSON.parse(req.body.data) : req.body, where = {
      hospitaldetail: {},
    };
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
    models.hospitalservice.findAndCountAll({
      include: [],
      distinct: true,
      where: where.hospitalservice,
      order: [
        ['id', 'DESC']
      ],
      limit: pageSize,
      offset: (page - 1) * pageSize
    })
    .then(result => {
      res({
        status: true,
        message: language.lang({key: 'item_list', lang: req.lang}),
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

  /*
  * save
  */
  this.save = function(req, res){

    savedata= JSON.parse(req.body);
    var hospitalId = savedata.hospitalId;
    var langId = savedata.langId;
    if(typeof savedata.data !== 'undefined'){
      data = savedata.data;
    }
    if(typeof savedata.awardData !== 'undefined'){
      dataAward = savedata.awardData;
    }
    //console.log(data);
    var hospitalservice = models.hospitalservice.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
        async.forEachOf(data, function (values, key, callback) {
          var hospitalserviceBuild = models.hospitalservice.build(values);
          hospitalserviceBuild.validate().then(function (err) {
            console.log(values);
            if (err != null) {
              async.forEach(err.errors, function (errObj, inner_callback) {
                errObj.path = errObj.path + '_' + key;
                errors = errors.concat(errObj);
              });
            }
            callback(null, errors);

          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }, function (err) {
          callback(null, errors);
        });
      },
      function (callback) {
        async.forEachOf(dataAward, function (values, key, callback) {
          var hospitalAwardBuild = models.hospitalaward.build(values);
          hospitalAwardBuild.validate().then(function (err) {
            if (err != null) {
              async.forEach(err.errors, function (errObj, inner_callback) {
                errObj.path = errObj.path + '_' + key;
                errors = errors.concat(errObj);
              });
            }
            callback(null, errors);

          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }, function (err) {
          callback(null, errors);
        });
      }
    ], function (err, errors) {
      var merged = [].concat.apply([], errors);
      var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
      if (uniqueError.length === 0) {
        async.parallel([
          function(callback) {
            models.hospitalservice.destroy({where: {hospitalId: hospitalId}}).then((data) => {
              callback(null, true);
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          },


          function(callback) {
              models.hospitalaward.hasMany(models.hospitalawarddetail);
              models.hospitalaward.findAll({
                  include: [
                      {model: models.hospitalawarddetail, where: language.buildLanguageQuery({}, langId, '`hospital_awards`.`id`', models.hospitalawarddetail, 'hospitalAwardId')},
                  ],
                  where: {hospitalId: hospitalId}
              }).then(function(data) {
                  if(data.length) {
                      async.forEach(data, function (values, icallback) {
                          models.hospitalawarddetail.destroy({where: {hospitalAwardId: values.id}}).then((idata) => {
                              models.hospitalaward.destroy({where: {id: values.id}}).then((data) => {
                                  icallback(null)
                              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                      }, function (innErrr) {
                          callback(null, true);
                      });
                  } else {
                      callback(null, true);
                  }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }

        ],function(err) {
          if(err) {
            res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})
          } else {
            async.parallel([
              function(callback) {
                models.hospitalservice.bulkCreate(data, {individualHooks: true}).then(function(hospitalfiles){
                  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:hospitalfiles});
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
              },
              function(callback) {
                  async.forEach(dataAward, function (values, award_callback) {
                      var hospitalAwardHasOne = models.hospitalaward.hasOne(models.hospitalawarddetail, {as: 'hospital_award_details'});
                      console.log(values);
                      values.hospital_award_details = {award_gratitude_title: values.award_gratitude_title, languageId: langId};

                      models.hospitalaward.create(values, {include: [hospitalAwardHasOne]}).then(function(data){
                          award_callback(null)
                      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                  }, function (innErrr) {
                      callback(null, true)
                  });
              }
            ], function(err) {
              if(err) {
                res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})
              } else {
                utils.updateProfileStatusWhileUpdate({id: hospitalId, langId: req.langId}, function(resp) {
                  if(resp.status) {
                    res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:[]});
                  } else {
                    res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})    
                  }
                })
              }
            }
          )
        }
      })
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
* status update
*/
this.status = function(req, res) {
  models.hospitalfile.update(req,{where:{id:req.id}}).then(function(data){
    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
};
/*
* get By ID
*/
this.getById = function(req, res) {
  models.hospital.hasMany(models.hospitaldetail);
  models.hospital.hasMany(models.hospitalfile);
  models.hospital.belongsTo(models.country);
  models.hospital.belongsTo(models.state);
  models.hospital.belongsTo(models.city);
  models.country.hasMany(models.countrydetail);
  models.state.hasMany(models.statedetail);
  models.city.hasMany(models.citydetail);

  var isWhere = {};
  isWhere.hospitaldetail = language.buildLanguageQuery(
    isWhere.hospitaldetail, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
  );
  isWhere.countrydetail = language.buildLanguageQuery(
    isWhere.countrydetail, req.langId, '`country`.`id`', models.countrydetail, 'countryId'
  );
  isWhere.statedetail = language.buildLanguageQuery(
    isWhere.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId'
  );
  isWhere.citydetail = language.buildLanguageQuery(
    isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
  );
  models.hospital.find({
    include: [
      {model: models.hospitaldetail, where:isWhere.hospitaldetail},
      {model: models.hospitalfile, where:isWhere.hospitalfile},
      { model: models.country,include: [{model: models.countrydetail, where:isWhere.countrydetail}]},
      { model: models.state,include: [{model: models.statedetail, where:isWhere.statedetail}]},
      { model: models.city,include: [{model: models.citydetail, where:isWhere.citydetail}]}
    ],
    where:{id:req.id}
  }).then(function(data){
    country.getAllCountry(req, function(countries){
      req.countryId=data.countryId;
      req.stateId=data.stateId;
      state.getAllState(req, function(states){
        city.getAllCity(req, function(cities){
          res({data:data,countries:countries,states:states,cities:cities});
        })
      })
    });

  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
};
/*delete hospital documents*/
this.delete = function (req, res) {
  models.hospitalfile.destroy({where: {id: req.id}})
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

    this.saveSpecializationServies = function(req, res) {
      let tagTypeIds = utils.getAllTagTypeId()
      let insertedTagIds = [tagTypeIds.SpecializationTagId, tagTypeIds.ServiceTagId]

      models.hospitalservice.destroy({where: {hospitalId: req.id, tagtypeId: {$in: insertedTagIds}}}).then(function(data){
        models.hospitalservice.bulkCreate(req.tags).then(function(data){
          utils.updateProfileStatusWhileUpdate({id: req.id, langId: req.langId}, function(resp) {
            if(resp.status) {
              res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:[]});
            } else {
              res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})    
            }
          })
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }

    this.saveAwardsMemberships = function(req, res) {
      let tagTypeIds = utils.getAllTagTypeId();

      var errors = []
      async.parallel([
        function (callback) {
          async.forEachOf(req.awards, function (values, key, callback) {
              var hospitalAwardBuild = models.hospitalaward.build(values);
              hospitalAwardBuild.validate().then(function (err) {
                  if (err != null) {
                      async.forEach(err.errors, function (errObj, inner_callback) {
                          errObj.path = errObj.path + '_' + key;
                          errors = errors.concat(errObj);
                      });
                  }
                  callback(null, errors);

              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }, function (err) {
              callback(null, errors);
          });
        },
      ], function (err, errors) {

        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});

        if (uniqueError.length === 0) {

          async.parallel([
            function(callback) {
              models.hospitalservice.destroy({where: {hospitalId: req.id, tagtypeId: tagTypeIds.MembershipsTagId}}).then((data) => {
                  callback(null, true);
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));     
            },
            function(callback) {
              models.hospitalaward.hasMany(models.hospitalawarddetail);
                models.hospitalaward.findAll({
                  include: [
                      {model: models.hospitalawarddetail, where: language.buildLanguageQuery({}, req.langId, '`hospital_awards`.`id`', models.hospitalawarddetail, 'hospitalAwardId')},
                  ],
                  where: {hospitalId: req.id}
                }).then(function(data) {
                  if(data.length) {
                      async.forEach(data, function (values, icallback) {
                          models.hospitalawarddetail.destroy({where: {hospitalId: values.id}}).then((idata) => {
                              models.hospitalaward.destroy({where: {id: values.id}}).then((data) => {
                                  icallback(null)
                              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                      }, function (innErrr) {
                          callback(null, true);
                      });
                  } else {
                      callback(null, true);
                  }
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }
          ], function(err) {
            async.parallel([
              function(callback) {
                  async.forEach(req.awards, function (values, awd_callback) {
                      var hospitalAwardHasOne = models.hospitalaward.hasOne(models.hospitalawarddetail, {as: 'hospital_award_details'});
                      values.hospital_award_details = {award_gratitude_title: values.award_gratitude_title, languageId: req.langId};
                      models.hospitalaward.create(values, {include: [hospitalAwardHasOne]}).then(function(data){
                          awd_callback(null)
                      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                  }, function (innErrr) {
                      callback(null, true)
                  });
              },
              function(callback) {
                  models.hospitalservice.bulkCreate(req.tags).then(function(data){
                      callback(null, true)
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
              },
            ], function(err) {
              if(err) {
                res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})
              } else {
                utils.updateProfileStatusWhileUpdate({id: req.id, langId: req.langId}, function(resp) {
                  if(resp.status) {
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:[]});
                  } else {
                    res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})    
                  }
                })
              }
            })
          })
        } else {
          language.errors({errors:uniqueError, lang:req.lang}, function(errors){
              var newArr = {};
              newArr.message = language.lang({key:"validationFailed", lang:req.lang});
              newArr.errors = errors;
              res(newArr);
          });
        }

      })
    }

    this.saveInsuranceCompanies = function(req, res) {
      let tagTypeIds = utils.getAllTagTypeId()
      
      models.hospitalservice.destroy({where: {hospitalId: req.id, tagtypeId: tagTypeIds.InsuranceCompaniesTagId}}).then((data) => {
        models.hospitalservice.bulkCreate(req.tags).then(function(data){
          res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:[]});
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }

}
module.exports = new Hospitalservice();
