var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var mail = require('./mail');
var bcrypt = require('bcrypt-nodejs');
var randomstring = require("randomstring");
var moment = require('moment');
var utils = require('./utils');
var crypto = require('crypto');
var sms = require('./sms');

function myController(){
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var UserHasOne = models.user.hasOne(models.userdetail, {as: 'user_detail'});
    req.user_detail.languageId = req.langId;
    req.user_type = 'admin';
    var passwordForMail = req.password;
    var user = models.user.build(req);
    var userDetails = models.userdetail.build(req.user_detail);
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
        }
    ], function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          if (typeof req.password !== 'undefined') {
            req.password = bcrypt.hashSync(req.password, null, null);
          }
          delete req.confirm_password;
          if (typeof req.id !== 'undefined' && req.id !== '') {
            if (req.is_active === 0) {
              oauth.removeToken({id:req.id}, function(){});
            }
            req.user_detail.userId = req.id;
            models.user.update(req,{where: {id:req.id}, individualHooks: true}).then(function(data){
              models.userdetail.find({where:{userId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.user_detail.id = resultData.id;
                  models.userdetail.update(req.user_detail, {where:{id:resultData.id, userId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.user_detail.id;
                  models.userdetail.create(req.user_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.user_detail.languageId);
            module.exports.createUserName({fullname:req.user_detail.fullname}, function(username){
              req.user_name = username;
              models.user.create(req, {include: [UserHasOne], individualHooks: true}).then(function(data){
                username = data.user_name;
                if (langId === 1) {
                  var mailData = {email: req.email, subject: language.lang({key:"registrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl, institute_name: req.institute_name}};
                  mail.sendHtmlMail(mailData, req.lang);
                  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                } else {
                  req.user_detail.userId = data.id;
                  req.user_detail.languageId = 1;
                  models.userdetail.create(req.user_detail).then(function(){
                    var mailData = {email: req.email, subject: language.lang({key:"registrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:data.username, email:req.email, password: passwordForMail, link: req.loginUrl, institute_name: req.institute_name}};
                    mail.sendHtmlMail(mailData, req.lang);
                    res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
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
        responseData.user = {masterId:reqData.masterId};
        responseData.user.id ={$ne:1};
        responseData.user.user_type = 'admin';
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

    models.user.hasMany(models.userdetail);
    models.user.belongsTo(models.role);
    models.role.hasMany(models.roledetail);
    
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
    );
    isWhere.roledetail = language.buildLanguageQuery(
      isWhere.roledetail, reqData.langId, '`role`.`id`', models.roledetail, 'roleId'
    );

    models.user.findAndCountAll({
      include: [
        {model: models.userdetail, where:isWhere.userdetail},
        {model:models.role, include: [{model: models.roledetail, where:isWhere.roledetail}]}
      ],
      where: isWhere.user,
      order: [
        ['id', 'DESC']
      ],
      distinct: true,
      limit: setPage,
      offset: pag,
      subQuery: false
    }).then(function(result){
        var totalData = result.count;
        var pageCount = Math.ceil(totalData / setPage);
        res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    })
    .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}))
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    var isWhere = {};
    isWhere = language.buildLanguageQuery(
      isWhere, req.langId, '`user`.`id`', models.userdetail, 'userId'
    );
    models.user.hasMany(models.userdetail);
    models.user.find({
      include: [{
        model: models.userdetail, where:isWhere}], 
        where:{
          id:req.id,
          masterId: req.masterId
        }}).then(function(data){
      res(data);
    })
    .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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

  /*
  * function login
  */
  models.user.belongsTo(models.role);
  this.login = function(req, res) {
    var device_type = (typeof req.device_type === 'undefined')?'web':req.device_type;
    var deviceType = (req.deviceType == 'DESKTOP')?'web':device_type;
    var deviceId = (typeof req.deviceId === 'undefined')?'':req.deviceId;

    var userUpdate = {device_type: device_type};
    if(req.deviceType != 'DESKTOP'){
      userUpdate.device_id = deviceId;
    }
    var usr = models.user.build(req);
    usr.validate().then(function (err) {
      if (err !== null) {
        language.errors({errors:err.errors, lang:req.lang}, function(errors){
            res({status: false, errors});
        });
      } else {
        models.user.find({
          include: [
            {
              model: models.role,
              where: {is_active: 1},
              attributes: ['is_active'],
            }
          ],
          where: {
            user_name: req.username
          },
          attributes: [
            'id',
            'masterId',
            'email',
            'password',
            'user_name',
            'user_type',
            'secondary_lang',
            'roleId',
            'default_lang',
            'defaultSessionId' ,
            'createdAt',
            'is_active',
            'is_notification'
          ]
        }).then(function(userData){
          if (userData === null) {
            res({status:false, message:language.lang({key:"invalid_detail", lang:req.lang})});
          } else if (userData.role !== null && userData.role.is_active === 0) {
            res({status:false, message:language.lang({key:"accountDeactivated", lang:req.lang})});
          } else {
            let webLogin = ['student', 'institute', 'admin', 'teacher', 'superadmin'].indexOf(userData.user_type) !== -1,
              phoneLogin = ['student', 'parent', 'teacher', 'helper', 'driver'].indexOf(userData.user_type) !== -1;
            if ((webLogin && req.deviceType === 'DESKTOP') || (phoneLogin && req.deviceType !== 'DESKTOP')) {
              if (userData.is_active === 1) {
                if (!userData.password || !bcrypt.compareSync(req.userpassword, userData.password)) {
                    res({status:false, message:language.lang({key:"invalid_detail", lang:req.lang})});
                } else {
                  models.user.update(userUpdate, {where: {id:userData.id}}).then(function () {
                    module.exports.useInfo({id:userData.id, languageId:userData.default_lang, masterId:userData.masterId}, function(userInfo){
                      language.getUserLanguagesWeb(userData,function(langData){
                        language.geLanguageById({id:userData.default_lang},function(primaryLang){
                          module.exports.getModules({roleId:userData.roleId, id:userData.id},function(modules){
                            res({status:true, message:language.lang({key:"success", lang:req.lang}), data:userData, primaryLang:{code:primaryLang.code, name:primaryLang.name, direction:primaryLang.direction}, languages:langData, servicePath: global.image_url, modules:modules, userdetails:userInfo});
                          });
                        });
                      });
                    });
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              } else {
                res({status:false, message:language.lang({key:"accountDeactivated", lang:req.lang})});
              }
            } else {
              res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang})});
            }
          }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.createUserName = function(req, res){
    res(crypto.randomBytes(16).toString('hex'));
  };

  this.createUserNameImport = function(req, res){
    res(crypto.randomBytes(16).toString('hex'));
  };

  this.useInfo = function(req, res){
    var userInfo = {};
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.languageId, '`user`.`id`', models.userdetail, 'userId'
    );
    isWhere.institutedetail = language.buildLanguageQuery(
      isWhere.institutedetail, req.languageId, '`institute`.`id`', models.institutedetail, 'instituteId'
    );

    models.institute.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.institute.hasMany(models.institutedetail);
    models.institute.belongsTo(models.country);

    models.student.hasOne(models.studentrecord);
    models.studentrecord.belongsTo(models.bcsmap, {'foreignKey':'bcsMapId'});

    models.user.find({
      include:[{
        model:models.userdetail,
        where:isWhere.userdetail
      }],
      where:{id:req.id},
      attributes:['id', 'default_lang', 'user_image', 'user_type', 'masterId', 'salutation']
    }).then(function(userData){
      if (userData === null) {
        res({
          status: false,
          message: language.__('invalid_detail', req.lang),
        });
        return;
      }
      module.exports.academicSession(req, function(sessionData){
        userInfo.default_lang = userData.default_lang;
        userInfo.academicSessions = sessionData;
        if (userData.user_type ==='teacher') {
          Promise.all([
            models.teacher.find({
              where:{userId:req.id}
            }),
            models.institute.find({
              include:[{
                model:models.institutedetail,
                attributes:['name'],
                where:isWhere.institutedetail
              },{
                model:models.user,
                attributes:['id', 'defaultSessionId'],
                where:{id:userData.masterId}
              }],
              attributes:['id', 'date_format'],
            })
          ]).then(function(teacherData){
            userInfo.userId = teacherData[0].id;
            userInfo.user_image = userData.user_image;
            userInfo.fullname = userData.userdetails[0].fullname;
            userInfo.institute_name = teacherData[1].institutedetails[0].name;
            userInfo.academicSessionId = teacherData[1].user.defaultSessionId;
            userInfo.salutation = userData.salutation;
            userInfo.date_format = teacherData[1].date_format;
            res(userInfo);
          }).catch(() => res({
            status:false,
            error: true,
            error_description: language.lang({key: "Internal Error",lang: req.lang}),
            url: true
          }));
        } else if (userData.user_type ==='institute') {
          models.institute.find({
            include:[{
              model:models.institutedetail,
              where:isWhere.institutedetail
            }, {
              model: models.country,
              attributes: ['iso_code']
            }],
            where:{userId:req.id}
          }).then(function(instituteData){
            userInfo.userId = instituteData.id;
            userInfo.countryId = instituteData.countryId;
            userInfo.stateId = instituteData.stateId;
            userInfo.cityId = instituteData.cityId;
            userInfo.user_image = userData.user_image;
            userInfo.fullname = instituteData.institutedetails[0].name;
            userInfo.institute_name = instituteData.institutedetails[0].name;
            userInfo.countryISOCode = instituteData.country.iso_code;
            userInfo.date_format = instituteData.date_format;
            res(userInfo);
          });
        } else if (userData.user_type ==='student') {
          Promise.all([
            models.student.find({
              include:[{
                model:models.studentrecord.scope(
                  { method: ['transferred', moment().format('YYYY-MM-DD')]}
                  //{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', '(SELECT `defaultSessionId` FROM `users` WHERE `id` = `student`.`masterId`)']}
                ),
                attributes:['id', 'bcsMapId', 'academicSessionId'],
                where:{
                  academicSessionId: {$eq: models.sequelize.literal('(SELECT `defaultSessionId` FROM `users` WHERE `id` = `student`.`masterId`)')},
                  /*record_status:1,
                  $or: [
                    {transferred: 0},
                    {transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}},
                    {transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
                    ],*/
                  },
                include: [{
                  model: models.bcsmap
                }],
              }],
              where:{userId:req.id},
              order:[[models.studentrecord, 'id', 'DESC']],
            }),
            models.institute.find({
              include:[{
                model:models.institutedetail,
                attributes:['name'],
                where:isWhere.institutedetail
              }],
              attributes:['id', 'date_format'],
              where:{userId:userData.masterId}
            })
          ]).then(function(studentData){
            if (studentData[0] === null) {
              res({
                status: false,
                message: language.__('invalid_detail', req.lang),
              });
              return;
            }
            userInfo.userId = studentData[0].id;
            userInfo.bcsMapId = studentData[0].studentrecord.bcsMapId;
            userInfo.academicSessionId = studentData[0].studentrecord.academicSessionId;
            userInfo.boardId = studentData[0].studentrecord.bcsmap.boardId;
            userInfo.classId = studentData[0].studentrecord.bcsmap.classId;
            userInfo.user_image = userData.user_image;
            userInfo.fullname = userData.userdetails[0].fullname;
            userInfo.institute_name = studentData[1].institutedetails[0].name;
            userInfo.date_format = studentData[1].date_format;
            utils.getBcsId({langId:req.languageId, masterId:userData.masterId, id:studentData[0].studentrecord.bcsMapId},function(bcs){
              userInfo.bcs = bcs.data;
              res(userInfo);
            });
          }).catch(() => res({
            status:false,
            error: true,
            error_description: language.lang({key: "Internal Error", lang: req.lang}),
            url: true
          }));
        } else if (userData.masterId !== 1) {
          models.institute.find({
            include:[
              {
                model:models.institutedetail,
                attributes:['name'],
                where:isWhere.institutedetail
              },
              {
                model: models.user,
                attributes: ['defaultSessionId'],
              }
            ],
            where: {userId: userData.masterId},
          }).then(function(institute){
            userInfo.userId = userData.id;
            userInfo.academicSessionId =  institute.user.defaultSessionId;
            userInfo.user_image = userData.user_image;
            userInfo.fullname = userData.userdetails[0].fullname;
            userInfo.date_format = institute.date_format;
            userInfo.institute_name = institute.institutedetails[0].name;
            res(userInfo);
          }).catch(() => res({
            status:false,
            error: true,
            error_description: language.lang({key: "Internal Error", lang: req.lang}),
            url: true
          }));
        } else {
          userInfo.userId = userData.id;
          userInfo.user_image = userData.user_image;
          userInfo.fullname = userData.userdetails[0].fullname;
          userInfo.date_format = 'DD/MM/YYYY';
          res(userInfo);
        }
      });
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}),
      url: true
    }));
  };

  this.academicSession = function(req, res){
    var isWhere = {};
    isWhere.academicsessiondetail = language.buildLanguageQuery(
      isWhere.academicsessiondetail, req.languageId, '`academicsession`.`id`', models.academicsessiondetail, 'academicSessionId'
    );
    models.academicsession.hasMany(models.academicsessiondetail);
    models.academicsession.findAll({
      where:{
        masterId:req.masterId,
         is_active:1
       },
      attributes:['id', 'start_date', 'end_date'],
      include: [{
        model:models.academicsessiondetail,
        where:isWhere.academicsessiondetail,
        attributes:['name']
      }],
      order: [['id', 'DESC']]
    }).then(function(sessionData){
        res(sessionData);
    });
  };

  /*
  * function forgotpassword
  */
  this.forgotpassword = function(req, res) {
    var usr = models.user.build(req);
    usr.validate().then(function (err) {
      if (err !== null) {
        language.errors({errors:err.errors, lang:req.lang}, function(errors){
          res({errors, status:false});
        });
      } else {
        models.user.hasMany(models.userdetail);
        models.user.findAll({
          where:{
            user_name:req.username
          },
          include: [{
            model: models.userdetail,
            attributes: ['fullname'],
            group: ['userId']
          }],
          order: [[models.userdetail, 'languageId', 'ASC']]
        }).then(function(userData){
          if (!userData.length) {
            res({
              status:false,
              message:language.lang({key:"userNameNotExist", lang:req.lang})
            });
          } else {
            var rstPswrdToken = randomstring.generate();
            var rstPswrdVrfUrl = req.resetPassUrl+ rstPswrdToken;
            if (req.deviceType === 'PHONE') {
              if(userData[0].user_type === 'student' || userData[0].user_type === 'teacher' || userData[0].user_type === 'driver'  || userData[0].user_type === 'helper') {
                models.user.update({
                  reset_password_token: rstPswrdToken
                },{
                  where: {
                    id: userData[0].id
                  }
                }).then(function () {
                  var mailData = {
                    email: userData[0].email,
                    subject: language.lang({key:"passwordResetRequest", lang:req.lang}),
                    list: {
                      username: req.username,
                      link: rstPswrdVrfUrl,
                      fullname: userData[0].userdetails[0].fullname
                    }
                  };
                  mail.sendResetPasswordMail(mailData, req.lang);
                  res({
                    status:true,
                    message:language.lang({key:"passwordReset", lang:req.lang})
                  });
                }).catch(() => res({
                  status:false,
                  error: true,
                  error_description: language.lang({key: "Internal Error", lang: req.lang}),
                  url: true
                }));
              } else {
                res({
                  status:false,
                  message:language.lang({key:"invalidUserDetails", lang:req.lang})
                });
              }
            } else if (req.deviceType === 'DESKTOP') {
              if(userData[0].user_type !== 'student' && userData[0].user_type !== 'driver' && userData[0].user_type !== 'helper') {
                models.user.update({
                  reset_password_token: rstPswrdToken
                },{
                  where: {
                    id: userData[0].id
                  }
                }).then(function () {
                  var mailData = {
                    email: userData[0].email,
                    subject: language.lang({key:"passwordResetRequest", lang:req.lang}),
                    list: {
                      username: req.username,
                      link: rstPswrdVrfUrl,
                      fullname: userData[0].userdetails[0].fullname
                    }
                  };
                  mail.sendResetPasswordMail(mailData, req.lang);
                  res({
                    status:true,
                    message:language.lang({key:"passwordReset", lang:req.lang})
                  });
                }).catch(() => res({
                  status:false,
                  error: true,
                  error_description: language.lang({key: "Internal Error", lang: req.lang}),
                  url: true
                }));
              } else {
                res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang})});
              }
            } else {
              res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang})});
            }
          }
        }).catch(() => res({
          status:false,
          error: true,
          error_description: language.lang({key: "Internal Error", lang: req.lang}),
          url: true
        }));
      }
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}), 
      url: true
    }));
  };


  /*
  * function check Username
  */
  this.checkUsername = function(req, res) {
    models.user.find({
      where:{
        user_name:req.username,
        user_type:['teacher','student','helper','driver'],
      },
      attributes: Object.keys(models.user.attributes).concat([
        [
          models.sequelize.literal(
            '(SELECT `countries`.`code` FROM `institutes`\
             INNER JOIN `countries`\
             WHERE `institutes`.`userId` = `user`.`masterId` AND `countries`.`id` = `institutes`.`countryId` \
             )'
          ),
          'countryCode'
        ]
      ]),
    }).then(function(userData){
      if (!userData) {
        res({
          status:false,
          message:language.lang({key:"userNameNotFound", lang:req.lang})
        });
      } else {
        var countryCode = userData.getDataValue('countryCode');
        var usermobile = userData.getDataValue('mobile');
        var mobile=countryCode+usermobile;
          sms.otpSend({mobile: mobile, countryCode: countryCode}, function(otpData){
            otpData.rstatus=otpData.status;  
            delete otpData.status; 
            res({status:true, message:'Verified',otp:otpData});
          });
      }
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}),
      url: true
    }));
  };

  this.verfiyOtp = function(req, res){
      sms.otpVerify({token:req.token, code:req.code, countryCode: req.country_code}, function(response){
          res(response);
      });
  };


  this.resetpasswordwithOtp = function(req, res){
        module.exports.verfiyOtp(req, function(otpData){            
        if(otpData.status!='ERROR'){
          models.user.find({where:{user_name:req.username}}).then(function(userData){
          if (userData !== null) {
            var newPassword = bcrypt.hashSync(req.password, null, null);
              models.user.update({password: newPassword}, {where: {user_name: req.username}}).then(function () {
                res({status:true, message:language.lang({key:"updatedpPasswordSuccess", lang:req.lang})});
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            } else {
              res({status:false, message:language.lang({key:"userNameNotExist", lang:req.lang})});
            }
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }else {
          res({status:false, message:language.lang({key:otpData.message, lang:req.lang})});
        }
    });
  }


  /*
  * function resetpassword
  */
  this.resetpassword = function(req, res) {
    var usr = models.user.build(req);
    usr.validate().then(function (err) {
      if (err !== null) {
        language.errors({errors:err.errors, lang:req.lang}, function(errors){
            err.errors = errors;
            res(err);
        });
      } else {
        models.user.find({where:{reset_password_token:req.reset_password_token}}).then(function(userData){
          if (userData !== null) {
            var newPassword = bcrypt.hashSync(req.password, null, null);
              models.user.update({reset_password_token: '', password: newPassword}, {where: {reset_password_token: req.reset_password_token}}).then(function () {
                res({status:true, message:language.lang({key:"updatedpPasswordSuccess", lang:req.lang})});
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            } else {
              res({status:false, message:language.lang({key:"tokenExpire", lang:req.lang})});
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getModules = function(req, res) {
    if (req.id ==1) {
      models.manager.findAll({attributes:['module_name']}).then(function(data){
        //res(data);
        var newData = {};
        async.forEach(data, function (item, callback) {
            newData[item.module_name] = item.module_name;
            callback();
        }, function () {
          res(newData);
        });
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    } else {
      models.rolepermission.belongsTo(models.permission);
      models.rolepermission.findAll({
        include:[{
          model:models.permission,
          attributes:['action', 'model'],
          where: {is_active: 1},
        }],
        where:{
          roleId:req.roleId
        }
      }).then(function(data){
        var newData = {};
        async.forEach(data, function (item, callback) {
            if(typeof newData[item.permission.model] =='undefined'){
              newData[item.permission.model] = [];
              newData[item.permission.model].push(item.permission.action);
            } else {
              newData[item.permission.model].push(item.permission.action);
            }
            callback();
        }, function () {
          res(newData);
        });
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }
  };

  /*
   * Parent Registration
  */
  this.parentRegistration = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var UserHasOne = models.user.hasOne(models.userdetail, {as: 'user_detail'});
    req.user_detail.languageId = req.langId;
    req.user_type = 'parent';
    var langId = parseInt(req.user_detail.languageId);
      models.user.create(req, {include: [UserHasOne], individualHooks: true}).then(function(data){
        if (langId === 1) {
          //var mailData = {email: req.email, subject: language.lang({key:"registrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl}};
          //mail.sendHtmlMail(mailData, req.lang);
          res(data.id);
        } else {
          req.user_detail.userId = data.id;
          req.user_detail.languageId = 1;
          models.userdetail.create(req.user_detail).then(function(){
            //var mailData = {email: req.email, subject: language.lang({key:"registrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl}};
            //mail.sendHtmlMail(mailData, req.lang);
            res(data.id);
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * User Notification status update
  */
  this.notificationStatus = function(req, res) {
    models.user.update({is_notification:req.is_notification},{where:{id:req.userId}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:{notification:req.is_notification}});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * Log Out from App
  */
  this.appLogOut = function(req, res) {
    models.user.update({device_id:null, device_type:''},{where:{id:req.userId}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
}
module.exports = new myController();
