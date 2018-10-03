var async = require('async');
const models = require('../models');
var bcrypt = require('bcrypt-nodejs');
var mail = require('./mail');
var userController = require('./users');
var randomstring = require('randomstring');
var oauth = require('./oauth');
var sms = require('./sms');
var moment = require('moment-timezone');
var language = require('./language');
var roleController = require('./role');
var country = require('./country');
var theme = require('./theme');
var state = require('./state');
var city = require('./city');
var govtidentity = require('./govtidentity');
var env       = process.env.NODE_ENV || 'tpsl';
var config    = require(__dirname + '/../config/config.json')[env];
var utils = require('../utils');

function filterMobileNumber(mobile) {
  if (! mobile.startsWith('+')) {
    mobile = '+' + mobile;
  }
  var res = '';
  for (var i = 0; i < mobile.length; i++) {
    if (mobile[i] >= '0' && mobile[i] <= '9') {
      res += mobile[i];
    }
  }
  return res;
}


function Institute() {
  /*
   * save
  */
  this.save = function(req, res){
    //Variables for Auto Role creation of student and teacher, when Instute add//
    var parentRole = { id: '',permissionIds: utils.parentDefaultRole,role_detail: { id: '', name: 'Parent' },is_active: '1',slug: 'parent',model: 'role',action: 'add',langId: req.langId,lang: req.lang };
    var teacherRole = { id: '',permissionIds: utils.teacherDefaultRole,role_detail: { id: '', name: 'Teacher' },is_active: '1',slug: 'teacher',model: 'role',action: 'add',langId: req.langId,lang: req.lang };
    var studentRole = { id: '',permissionIds: utils.studentDefaultRole,role_detail: { id: '', name: 'Student' },is_active: '1',slug: 'student', model: 'role',action: 'add',langId: req.langId,lang: req.lang };
    var transportRole = { id: '',permissionIds: utils.transportDefaultRole,role_detail: { id: '', name: 'Transport Manager' },is_active: '1',slug: 'transport', model: 'role',action: 'add',langId: req.langId,lang: req.lang };
    var driverRole = { id: '',role_detail: { id: '', name: 'Driver' },is_active: '1',slug: 'driver', model: 'role',action: 'add',langId: req.langId,lang: req.lang };
    var helperRole = { id: '',role_detail: { id: '', name: 'Helper' },is_active: '1',slug: 'helper', model: 'role',action: 'add',langId: req.langId,lang: req.lang };
    //End of Variables for Auto Role creation for student and teacher, when Instute add//

    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    if (! req.institute.themeId) req.institute.themeId = null;

    if(!req.institute.parentInstituteId || req.institute.parentInstituteId === ''){
      req.institute.parentInstituteId = 0;
    }

    if(typeof req.institute.fee_active === 'undefined' || req.institute.fee_active === '' || req.institute.fee_active===false){
      req.institute.fee_active = 0;
    }else{
      req.institute.fee_active = 1;
    }

    if(!req.secondary_lang) req.secondary_lang = 0;
    var instituteHasOne = models.institute.hasOne(models.institutedetail, {as: 'institute_detail'});
    var userHasOne = models.user.hasOne(models.userdetail, {as: 'user_detail'});
    if(req.institute_image){
      req.institute.institute_image = req.institute_image;
    }
    if(req.institute_logo) {
      req.institute.institute_logo = req.institute_logo;
    }
    if(req.cheque_image){ 
      req.institute.cheque_image = req.cheque_image;
    }

    req.institute_detail.languageId = req.langId;
    req.user_detail.languageId = req.langId;
    req.user_type = 'institute';
    var user = models.user.build(req);
    var userDetails = models.userdetail.build(req.user_detail);
    var institute = models.institute.build(req.institute);
    var instituteDetails = models.institutedetail.build(req.institute_detail);
    var passwordForMail = req.password;
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
        user.validate().then(function (err) {
            if (err !== null) {
                errors = errors.concat(err.errors);
                callback(null, errors);
            } else {
                callback(null, errors);
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      },
      function (callback) {
        userDetails.validate().then(function (err) {
            if (err !== null) {
                errors = errors.concat(err.errors);
                callback(null, errors);
            } else {
                callback(null, errors);
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      },
      function (callback) {
        institute.validate().then(function (err) {
            if (err !== null) {
                errors = errors.concat(err.errors);
                callback(null, errors);
            } else {
                callback(null, errors);
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      },
      function (callback) {
          instituteDetails.validate().then(function (err) {
              if (err !== null) {
                  errors = errors.concat(err.errors);
                  callback(null, errors);
              } else {
                  callback(null, errors);
              }
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }
    ], async function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          if (typeof req.password !== 'undefined') {
            req.password = bcrypt.hashSync(req.password, null, null);
          }
          delete req.confirm_password;
          delete req.masterId;
          if (typeof req.id !== 'undefined' && req.id !== '') {
             if (req.is_active === 0) {
              oauth.removeToken({id:req.id}, function(){});
            }

            req.user_detail.userId = req.id;
            req.institute_detail.instituteId = req.institute.id;

            let roleId = (await models.user.findById(req.id, {attributes: ['roleId']})).roleId;
            models.user.update(req,{where: {id:req.id}, individualHooks: true}).then(function(data){
              async.parallel({
                one: function (callback) {
                  models.userdetail.find({where:{userId:req.id,languageId:req.langId}}).then(function(resultData){
                    if (resultData !==null) {
                      req.user_detail.id = resultData.id;
                      models.userdetail.update(req.user_detail, {where:{id:resultData.id, userId:req.id,languageId:req.langId}}).then(function(){
                        callback(null, '1');
                      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                    } else {
                      delete req.user_detail.id;
                      models.userdetail.create(req.user_detail).then(function(){
                        callback(null, '1');
                      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                    }
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                },
                two: function (callback) {
                  models.institute.update(req.institute,{where: {id:req.institute.id}, individualHooks: true}).then(function(){
                    models.institutedetail.find({where:{instituteId:req.institute.id,languageId:req.langId}}).then(function(resultData){
                      if (resultData !==null) {
                        req.institute_detail.id = resultData.id;
                        models.institutedetail.update(req.institute_detail, {where:{id:resultData.id, instituteId:req.institute.id,languageId:req.langId}}).then(function(){
                          callback(null, '2');
                        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                      } else {
                        delete req.institute_detail.id;
                        models.institutedetail.create(req.institute_detail).then(function(){
                          callback(null, '2');
                        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                      }
                    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }, function (err, result) {
                if (result.one === '1' && result.two === '2') {
                  res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  if (roleId === null) {
                    parentRole.userId = req.id;
                    parentRole.masterId = req.id;
                    teacherRole.userId = req.id;
                    teacherRole.masterId = req.id;
                    studentRole.userId = req.id;
                    studentRole.masterId = req.id;
                    transportRole.userId = req.id;
                    transportRole.masterId = req.id;
                    driverRole.userId = req.id;
                    driverRole.masterId = req.id;
                    helperRole.userId = req.id;
                    helperRole.masterId = req.id;
                    roleController.save(parentRole);
                    roleController.save(teacherRole);
                    roleController.save(studentRole);
                    roleController.save(transportRole);
                    roleController.save(driverRole);
                    roleController.save(helperRole);
                    //End of Auto Role Assignment
                    
                    models.classes.hasMany(models.classesdetail);
                    utils.basicClasses.forEach(item =>{
                      item.masterId = req.id;
                      item.userId = req.id;
                      item.classesdetails[0].masterId = req.id;
                      models.classes.create(item, {include:[models.classesdetail]});
                    });

                    models.section.hasMany(models.sectiondetail);
                    utils.basicSections.forEach(item =>{
                      item.masterId = req.id;
                      item.userId = req.id;
                      item.sectiondetails[0].masterId = req.id;
                      models.section.create(item, {include:[models.sectiondetail]});
                    });

                    models.tag.hasMany(models.tagdetail);
                    utils.basicTags.forEach(item =>{
                      item.masterId = req.id;
                      item.userId = req.id;
                      models.tag.create(item, {include:[models.tagdetail]});
                    });

                    models.subject.hasMany(models.subjectdetail);
                    utils.basicSubjects.forEach(item =>{
                      item.masterId = req.id;
                      item.userId = req.id;
                      item.subjectdetails[0].masterId = req.id;
                      models.subject.create(item, {include:[models.subjectdetail]});
                    });

                    utils.basicLeaveType(req.id, req.langId).reduce((promise, empleavetype) =>
                      promise.then(() => models.empleavetype.create(empleavetype, {
                        include: [
                          models.empleavetypedetail,
                        ],
                      })),
                      Promise.resolve(true)
                    );

                    utils.basicInfra(req.id, req.langId).reduce((promise, infratype) =>
                      promise.then(() => models.infratype.create(infratype, {
                        include: [
                          models.infratypedetail,
                          {
                            model: models.infrastructure,
                            include: [
                              models.infrastructuredetail,
                            ]
                          }
                        ],
                      })),
                      Promise.resolve(true)
                    );

                    utils.basicActivity(req.id, req.langId).reduce((promise, activity) =>
                      promise.then(() => models.activity.create(activity, {
                        include: [
                          models.activitydetail,
                        ],
                      })),
                      Promise.resolve(true)
                    );
                  }
                }
              });
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.user_detail.languageId);
            userController.createUserName({fullname:req.user_detail.fullname}, function(username){
              req.user_name = username;
              models.user.create(req, {include: [userHasOne], individualHooks: true}).then(function(data){
                username = data.user_name;
                models.user.update({masterId:data.id}, {where:{id:data.id}}).then(function(){
                  req.institute.userId = data.id;
                  req.institute.institute_detail = req.institute_detail;
                  models.institute.create(req.institute, {include: [instituteHasOne], individualHooks: true}).then(function(instituteData){
                    //Auto Role Assignment
                    parentRole.userId = data.id;
                    parentRole.masterId = data.id;
                    teacherRole.userId = data.id;
                    teacherRole.masterId = data.id;
                    studentRole.userId = data.id;
                    studentRole.masterId = data.id;
                    transportRole.userId = data.id;
                    transportRole.masterId = data.id;
                    driverRole.userId = data.id;
                    driverRole.masterId = data.id;
                    helperRole.userId = data.id;
                    helperRole.masterId = data.id;
                    roleController.save(parentRole);
                    roleController.save(teacherRole);
                    roleController.save(studentRole);
                    roleController.save(transportRole);
                    roleController.save(driverRole);
                    roleController.save(helperRole);
                    //End of Auto Role Assignment
                   
                    models.classes.hasMany(models.classesdetail);
                    utils.basicClasses.forEach(item =>{
                      item.masterId = data.id;
                      item.userId = data.id;
                      item.classesdetails[0].masterId = data.id;
                      models.classes.create(item, {include:[models.classesdetail]});
                    });

                    models.section.hasMany(models.sectiondetail);
                    utils.basicSections.forEach(item =>{
                      item.masterId = data.id;
                      item.userId = data.id;
                      item.sectiondetails[0].masterId = data.id;
                      models.section.create(item, {include:[models.sectiondetail]});
                    });

                    models.tag.hasMany(models.tagdetail);
                    utils.basicTags.forEach(item =>{
                      item.masterId = data.id;
                      item.userId = data.id;
                      models.tag.create(item, {include:[models.tagdetail]});
                    });

                    models.subject.hasMany(models.subjectdetail);
                    utils.basicSubjects.forEach(item =>{
                      item.masterId = data.id;
                      item.userId = data.id;
                      item.subjectdetails[0].masterId = data.id;
                      models.subject.create(item, {include:[models.subjectdetail]});
                    });

                    utils.basicLeaveType(data.id, req.langId).reduce((promise, empleavetype) =>
                      promise.then(() => models.empleavetype.create(empleavetype, {
                        include: [
                          models.empleavetypedetail,
                        ],
                      })),
                      Promise.resolve(true)
                    );

                    utils.basicInfra(data.id, req.langId).reduce((promise, infratype) =>
                      promise.then(() => models.infratype.create(infratype, {
                        include: [
                          models.infratypedetail,
                          {
                            model: models.infrastructure,
                            include: [
                              models.infrastructuredetail,
                            ]
                          }
                        ],
                      })),
                      Promise.resolve(true)
                    );

                    utils.basicActivity(data.id, req.langId).reduce((promise, activity) =>
                      promise.then(() => models.activity.create(activity, {
                        include: [
                          models.activitydetail,
                        ],
                      })),
                      Promise.resolve(true)
                    );

                    if (langId === 1) {
                      var mailData = {email: req.email, subject: language.lang({key:"instituteRegistrationDetails", lang:req.lang}), list: {institutename:req.institute_detail.name,fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl}};
                      mail.sendHtmlMailToInstitute(mailData, req.lang);
                      // sms 
                      models.country.findById(req.institute.countryId).then(country => {
                        sms.sendRegistrationSMS(filterMobileNumber(country.code + req.mobile), {link: req.loginUrl, username: username, password: passwordForMail, lang: req.lang}, '', 1)
                        // .then(console.log, console.log);
                      });
                      res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                    } else {
                      req.user_detail.userId = data.id;
                      req.user_detail.languageId = 1;
                      req.institute.institute_detail.instituteId =instituteData.id;
                      req.institute.institute_detail.languageId =1;
                      models.userdetail.create(req.user_detail).then(function(){
                        models.institutedetail.create(req.institute.institute_detail).then(function(){
                          var mailData = {email: req.email, subject: language.lang({key:"instituteRegistrationDetails", lang:req.lang}), list: {institutename:req.institute_detail.name,fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl}};
                          mail.sendHtmlMailToInstitute(mailData, req.lang);
                          // sms
                          models.country.findById(req.institute.countryId).then(country => {
                            sms.sendRegistrationSMS(filterMobileNumber(country.code + req.mobile), {link: req.loginUrl, username: username, password: passwordForMail, lang: req.lang},'', 1)
                            // .then(console.log, console.log);
                          });
                          res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                    }
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            });
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

  this.stepValidate = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }

    if(req.institute.parentInstituteId === ''){
      req.institute.parentInstituteId = 0;
    }

    if(typeof req.institute.fee_active === 'undefined' || req.institute.fee_active === '' || req.institute.fee_active===false){
      req.institute.fee_active = 0;
    }else{
      req.institute.fee_active = 1;
    }

    if(!req.secondary_lang) req.secondary_lang = 0;
    var instituteHasOne = models.institute.hasOne(models.institutedetail, {as: 'institute_detail'});
    var userHasOne = models.user.hasOne(models.userdetail, {as: 'user_detail'});
    if(req.institute_image){
      req.institute.institute_image = req.institute_image;
    }
    if(req.institute_logo) {
      req.institute.institute_logo = req.institute_logo;
    }
    if(req.cheque_image){ 
      req.institute.cheque_image = req.cheque_image;
    }
    req.institute_detail.languageId = req.langId;
    req.user_detail.languageId = req.langId;
    req.user_type = 'institute';
    var user = models.user.build(req);
    var userDetails = models.userdetail.build(req.user_detail);
    var institute = models.institute.build(req.institute);
    var instituteDetails = models.institutedetail.build(req.institute_detail);
    var passwordForMail = req.password;
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
        user.validate().then(function (err) {
            if (err !== null) {
                errors = errors.concat(err.errors);
                callback(null, errors);
            } else {
                callback(null, errors);
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      },
      function (callback) {
        userDetails.validate().then(function (err) {
            if (err !== null) {
                errors = errors.concat(err.errors);
                callback(null, errors);
            } else {
                callback(null, errors);
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      },
      function (callback) {
        institute.validate().then(function (err) {
            if (err !== null) {
                errors = errors.concat(err.errors);
                callback(null, errors);
            } else {
                callback(null, errors);
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      },
      function (callback) {
          instituteDetails.validate().then(function (err) {
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
          res({status: true});
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
      responseData.institute = {id:{$ne:1}};
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

    models.institute.hasMany(models.institutedetail);
    models.institute.belongsTo(models.user);
    
    isWhere.institutedetail = language.buildLanguageQuery(
      isWhere.institutedetail, reqData.langId, '`institute`.`id`', models.institutedetail, 'instituteId'
    );

    models.institute.findAndCountAll({
      include: [
        {model: models.institutedetail, where:isWhere.institutedetail},
        {model: models.user, where:isWhere.user}
      ],
      where: isWhere.institute,
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
    })//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.institute.hasMany(models.institutedetail);
    models.institute.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    
    var isWhere = {};
    isWhere.institutedetail = language.buildLanguageQuery(
      isWhere.institutedetail, req.langId, '`institute`.`id`', models.institutedetail, 'instituteId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
    );

    models.institute.find({
      include: [
        {model: models.institutedetail, where:isWhere.institutedetail},
        {model:models.user, include: [{model: models.userdetail, where:isWhere.userdetail}]}
      ],
      where:{
        id:req.id
      }
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  Update for react-redux admin
  */
  this.getEditData = function(req, res) {
    models.institute.hasMany(models.institutedetail);
    models.institute.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    
    var isWhere = {};
    isWhere.institutedetail = language.buildLanguageQuery(
      isWhere.institutedetail, req.langId, '`institute`.`id`', models.institutedetail, 'instituteId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
    );

    models.institute.find({
      include: [
        {model: models.institutedetail, where:isWhere.institutedetail},
        {model:models.user, include: [{model: models.userdetail, where:isWhere.userdetail}]}
      ],
      where:{
        id:req.id
      }
    }).then(function(data){
      req.countryId = data.countryId;
      req.stateId = data.stateId;
      req.id = data.id;
      module.exports.getMetaInformations(req, function(result){
        city.getAllCity(req, function(cities){
          state.getAllState(req, function(states){
            govtidentity.getGovtidentityByCountryId(req, function(identities){
              res({
                data: data,
                states:states,
                countries: result.countries,
                cities:cities,
                roles: result.roles,
                themes: result.themes,
                languages: result.languages,
                timezones:moment.tz.names(),
                identities:identities,
                institutes: result.institutes,
                date_formats: result.date_formats,
              });
            });
          });
        });
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get not eq. id
  */
  this.getAllInstitute = function(req, res) {
    models.institute.hasMany(models.institutedetail);
    var isWhere = {};
    isWhere.institutedetail = language.buildLanguageQuery(
      isWhere.institutedetail, req.langId, '`institute`.`id`', models.institutedetail, 'instituteId'
    );

    models.institute.findAll({
      include: [{
        model: models.institutedetail,
        where:isWhere.institutedetail,
        attributes: ['name']
      }],
      attributes:['id'],
      where:{id:{$notIn:[1,req.id]}}
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

    /*
   * get all
  */
  this.listAllInstitute = function(req, res) {
    models.institute.hasMany(models.institutedetail);
    var isWhere = {};
    isWhere.institutedetail = language.buildLanguageQuery(
      isWhere.institutedetail, req.langId, '`institute`.`id`', models.institutedetail, 'instituteId'
    );

    models.institute.findAll({
      include: [
        {model: models.institutedetail, where:isWhere.institutedetail}
      ],
      where:{id:{$ne:1}}
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };


  /*
   * status update
  */

 this.status = function(req, res) {
    models.user.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      oauth.removeToken(req, function(result){
        res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.resend_registration_email = function (req, cb) {
    models.institute.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.institute.hasMany(models.institutedetail);
    var isWhere = {};
    isWhere.institutedetail = language.buildLanguageQuery(
      isWhere.institutedetail, req.langId, '`institute`.`id`', models.institutedetail, 'instituteId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
    );
    
    models.institute.find({
      include: [
        {model: models.institutedetail, where:isWhere.institutedetail},
        {model:models.user, include: [{model: models.userdetail, where:isWhere.userdetail}]}
      ],
      where:{id:req.id}
    }).then(function (data) {
      if (data === null) {
        cb({status: true, message: language.lang({key: "instituteNotExist", lang: req.lang}), data: {}});
      } else {
        // var mailData = {email: data.user.email, subject: language.lang({key:"instituteRegistrationDetails", lang:req.lang}), list: {institutename:data.institutedetails[0].name,fullname: data.user.userdetails[0].fullname, username:data.user.user_name, link: req.loginUrl}};
        // mail.sendHtmlMailToInstitute(mailData);
        // cb({status: true, message: language.lang({key: "emailSent", lang: req.lang}), data: {}});
        var rstPswrdToken = randomstring.generate();
        var rstPswrdVrfUrl = req.resetPassUrl+ rstPswrdToken;
        models.user.update({reset_password_token: rstPswrdToken}, {where: {id: data.user.id}}).then(function () {
          var mailData = {email: data.user.email, subject: language.lang({key:"passwordResetRequest", lang:req.lang}), list: {username: data.user.user_name, link: rstPswrdVrfUrl, fullname: data.user.userdetails[0].fullname}};
          mail.sendResetPasswordMail(mailData, req.lang);
          cb({status: true, message: language.lang({key: "emailSent", lang: req.lang}), data: {}});
        });
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.sendsms = function(req, res) {
    models.institute.belongsTo(models.user);
    models.institute.belongsTo(models.country);
    models.institute.findAll({
      include: [{
        model: models.user,
        attributes: ['id', 'mobile']
      },{
        model: models.country,
        attributes: ['code']
      }],
      attributes: ['id', 'sms_provider'],
      where: {
        id: {
          $in: req.ids
        }
      }
    })
    .then(institutes => {
      if (institutes.length === 0) {
        return res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
      }
      var logs = [];      
      institutes.forEach((institute, index) => {
        logs[index] = {
          senderId: req.userId, // id of sender in users tables
          receiverId: institute.user.id,
          masterId: req.masterId,
          module: 'institute',
          message: req.message
        };
        mobileNumber = filterMobileNumber(institute.country.code + institute.user.mobile);
        sms.customSMS(mobileNumber, req.message, institute.sms_provider, 1);
      });
      res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
      models.smslog.bulkCreate(logs);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.sendemail = function(req, res) {
    models.institute.belongsTo(models.user);
    models.institute.findAll({
      include: [{
        model: models.user,
        attributes: ['id', 'email']
      }],
      attributes: ['id'],
      where: {
        id: {
          $in: req.ids
        }
      }
    })
    .then(institutes => {
      if (institutes.length === 0) {
        return res({status:true, message:language.lang({key:"Email Sent", lang:req.lang}), data:{}});
      }
      var logs = [];      
      institutes.forEach((institute, index) => {
        institutes[index] = institute.user.email;
      });
      if(req.files){
        mail.sendMail({email:institutes, subject:req.subject, msg:req.message, attachments:req.files});
      } else{
        mail.sendMail({email:institutes, subject:req.subject, msg:req.message});
      }
      res({status:true, message:language.lang({key:"Email Sent", lang:req.lang}), data:{}});
    });
  };

  this.updateAuthKey = function(req, res){
    models.institute.update({
      smsProviderAuthKey:req.smsProviderAuthKey,
      smsSenderName:req.smsSenderName
    },{
      where:{
        id:req.instituteId
      }
    }).then(function(result){
      res({status: true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:result});
    }).catch(() => res({
      status:false, 
      error: true, 
      error_description: language.lang({key: "Internal Error", lang: req.lang}), 
      url: true
    }));
  };

  /*
   * get not eq. id
  */
  this.getAuthKey = function(req, res) {
    models.institute.find({
      attributes:['sms_provider','smsProviderAuthKey', 'smsSenderName'],
      where:{
        id:req.instituteId
      }
    }).then(function(data){
      res({data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get not eq. id
  */
  this.getAuthKeyByMasterId = function(req, res) {
    models.institute.find({
      attributes:['smsProviderAuthKey', 'smsSenderName'],
      where:{
        userId:req.masterId
      }
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getMetaInformations = function(req, res){
    if(!req.id){
      req.id = 0;
    }
    roleController.getAllRole(req, function(roles){
      country.getAllCountry(req, function(countries){
        language.getAllLanguage(req, function(languages){
          theme.getAllTheme(req, function(themes){
            module.exports.getAllInstitute(req, function(institutes){
              res({
                roles: roles,
                countries: countries,
                languages: languages,
                themes: themes,
                timezones: moment.tz.names(),
                institutes: institutes,
                date_formats: utils.date_formats,
              });
            });
          });
        });
      });
    });
  }


  this.creatXls=function(req,res){
    var tpsl_obj = config;

    req.id=req.body.id;
    models.institute.find({
      where:{
        id:req.id
      }
    }).then(function(data){

    var json2xls = require('json2xls');
    var fs = require('fs');
    
    var json = {
        'Sr No.':'1',
        'Scheme_Code':data['userId'],
        'Format': "",
        'Sample Value in Product Codes': "",
        'Account_name':data['bank_name'],
        'Account_number':data['account_no'],
        'IFSC_CODE':data['ifsc_code'],
        'BANK_NAME':data['bank_name'],
        'REPORT_FLG':'NEFT',
        'Branch Name':data['bank_branch'],
        'Branch City':data['bank_branch']
    }

    var table='<table style="width:100%" border="1"><tbody>';
    table +='<tr>'
    Object.keys(json).forEach(function(key) {
      table +='<th>'+key+'</th>'
    });
    table +='</tr>'


    table +='<tr>'
    Object.keys(json).forEach(function(key) {
      table +='<td>'+json[key]+'</td>'
    });
    table +='</tr>'


    table +='</tbody></table>'



    var footer='<p>noreply@pateast.co</p>\
                <p>Additional Information:</p>\
                <p>User Name: Pateast Edutech Software LLP</p>\
                <p>This is a system generated auto email.</p>\
                <p>Thank you,</p>\
                <p>Team Pateast Edutech Software LLP</p>';

    var xls = json2xls(json);
    var fileName=data['userId']+'.xls';
    fs.writeFileSync('./public/uploads/xls/'+fileName, xls, 'binary');

    mail.sendMail({
          email:tpsl_obj.send_email, 
          subject:'Account Details',
          msg:'<p>Hi Team,</p><p>Please map scheme to the MID '+tpsl_obj.mid+' .</p>'+table+footer, 
          attachments:[
          {filename:data['userId']+'.png',path:data['cheque_image']},
          {filename:fileName,path:'public/uploads/xls/' + data['userId']+'.xls'}
          ]
    });

     res({status:true, message:language.lang({key:"Email Sent", lang:req.lang}), data:{}});
    });
  };

  this.remove = async req => {
    try {
      await models.user.destroy({where: {id: req.id}});
    } catch (err) {
      return {
        status: false,
        message: language.lang({key: 'Can not delete Institute, It is being used.'}),
      }
    }

    return {
      status: true,
      message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
    };
  };

  this.signup = async req => {
    req.user.parentId = 0;
    req.user.is_active = 0;
    req.user.roleId = null;
    req.user.user_type = 'institute';
    req.userdetail.languageId = req.langId;
    req.institutedetail.languageId = req.langId;
    if (!req.user.secondary_lang) delete req.user.secondary_lang;
    let user = models.user.build(req.user),
      institute = models.institute.build(req.institute),
      userdetail = models.userdetail.build(req.userdetail),
      institutedetail = models.institutedetail.build(req.institutedetail);
    let errors = language.makeErrors(
      await Promise.all([
        user.validate(),
        institute.validate(),
        userdetail.validate(),
        institutedetail.validate(),
      ]),
      req.lang,
    );
    if (errors) return {status: false, errors};
    req.user.id = '';
    req.institute.id = '';
    req.institutedetail.id = '';
    let userdetails = [req.userdetail], institutedetails = [req.institutedetail];
    if (req.langId != 1) {
      userdetails.push({...req.userdetail, languageId: 1});
      institutedetails.push({...req.institutedetail, languageId: 1});
    }
    institute = await models.institute.create({
      ...req.institute,
      user: req.user,
      institutedetails,
    }, {
      include: [models.user, models.institutedetail],
    });
    institute.user.masterId = institute.user.id;
    userdetails.forEach(userdetail => userdetail.userId = institute.user.id);
    await Promise.all([
      institute.user.save(),
      models.userdetail.bulkCreate(userdetails),
    ]);
    let mailData1 = {
      email: req.user.email, 
      subject: language.lang({key: 'PATEAST: Sign Up Request Submitted', lang: req.lang}),
      list: req
    };
    let mailData2 = {
      email: req.user.email, 
      subject: language.lang({key: 'PATEAST: Sign Up Request', lang: req.lang}),
      list: req
    };

    mail.sendInstituteSignUpMail(mailData1, req.lang);
    mail.sendInstituteSignUpMailToAdmin(mailData2, req.lang);
    return {status: true};
  };
}

module.exports = new Institute();
