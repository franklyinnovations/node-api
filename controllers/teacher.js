var async = require('async');
const models = require('../models');
var language = require('./language');
var bcrypt = require('bcrypt-nodejs');
var mail = require('./mail');
var userController = require('./users');
var oauth = require('./oauth');
var sms = require('./sms');
var randomstring = require('randomstring');
var crypto = require('crypto');

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

function randomPassword() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(4, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString('hex'))
      }
    })
  });
}

function Teacher() {
  /*
   * save
  */
  this.save = async function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    if (typeof req.teacher.subjectId === 'undefined') {
      req.teacher.subjectId = '';
    }

    var teacherHasOne = models.teacher.hasOne(models.teacherdetail, {as: 'teacher_detail'});
    var userHasOne = models.user.hasOne(models.userdetail, {as: 'user_detail'});
    req.teacher_detail.languageId = req.langId;
    req.teacher.masterId = req.masterId;
    req.user_detail.languageId = req.langId;
    req.user_type = 'teacher';
    req.teacher.masterId = req.masterId;
    var user = models.user.build(req);
    var userDetails = models.userdetail.build(req.user_detail);
    var teacher = models.teacher.build(req.teacher);
    var teacherDetails = models.teacherdetail.build(req.teacher_detail);
    if (!req.id && !req.password) req.password = await randomPassword();
    var passwordForMail = req.password;

    if (!req.teacher.countryId) delete req.teacher.countryId;
    if (!req.teacher.stateId) delete req.teacher.stateId;
    if (!req.teacher.cityId) delete req.teacher.cityId;

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
        })
      },
      function (callback) {
        userDetails.validate().then(function (err) {
            if (err !== null) {
                errors = errors.concat(err.errors);
                callback(null, errors);
            } else {
                callback(null, errors);
            }
        })
      },
      function (callback) {
        teacher.validate().then(function (err) {
            if (err !== null) {
                errors = errors.concat(err.errors);
                callback(null, errors);
            } else {
                callback(null, errors);
            }
        })
      },
      function (callback) {
          teacherDetails.validate().then(function (err) {
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
        if(req.teacher.dob ===''){
          req.teacher.dob = null;
        }
        if(req.teacher.join_date ===''){
          req.teacher.join_date = null;
        }
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
            req.teacher_detail.teacherId = req.teacher.id;
            models.user.update(req,{where: {id:req.id}, individualHooks: true}).then(function(data){
              async.parallel({
                one: function (callback) {
                  models.userdetail.find({where:{userId:req.id,languageId:req.langId}}).then(function(resultData){
                    if (resultData !==null) {
                      req.user_detail.id = resultData.id;
                      models.userdetail.update(req.user_detail, {where:{id:resultData.id, userId:req.id,languageId:req.langId}}).then(function(){
                        callback(null, '1');
                      })
                    } else {
                      delete req.user_detail.id;
                      models.userdetail.create(req.user_detail).then(function(){
                        callback(null, '1');
                      })
                    }
                  })
                },
                two: function (callback) {
                  models.teacher.update(req.teacher,{where: {id:req.teacher.id}}).then(function(){
                    models.teacherdetail.find({where:{teacherId:req.teacher.id,languageId:req.langId}}).then(function(resultData){
                      if (resultData !==null) {
                        req.teacher_detail.id = resultData.id;
                        models.teacherdetail.update(req.teacher_detail, {where:{id:resultData.id, teacherId:req.teacher.id,languageId:req.langId}}).then(function(){
                          callback(null, '2');
                        })
                      } else {
                        delete req.teacher_detail.id;
                        models.teacherdetail.create(req.teacher_detail).then(function(){
                          callback(null, '2');
                        })
                      }
                    });
                  })
                },
                three: function (callback) {
                  module.exports.createSubjects({id:teacher.id, subjectIds:req.teacher.subjectId}, function(){
                    callback(null, '3');
                  });
                }
              }, function (err, result) {
                if (result.one === '1' && result.two === '2' && result.three ==='3') {
                  res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                }
              });
            })
          } else {
            var langId = parseInt(req.user_detail.languageId);
            userController.createUserName({fullname:req.user_detail.fullname}, function(username){
              req.user_name = username;
              models.user.create(req, {include: [userHasOne], individualHooks: true}).then(function(data){
                username = data.user_name;
                req.teacher.userId = data.id;
                req.teacher.teacher_detail = req.teacher_detail;
                models.teacher.create(req.teacher, {include: [teacherHasOne]}).then(function(teacherData){
                  module.exports.createSubjects({id:teacherData.id, subjectIds:req.teacher.subjectId}, function(){
                    if (langId === 1) {
                      var mailData = {email: req.email, subject: language.lang({key:"teacherRegistrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl, institute_name: req.institute_name}};
                      if(req.email !==''){
                        mail.sendHtmlMailToTeacher(mailData, req.lang);
                      }
                      models.institute.belongsTo(models.country);
                      models.institute.findOne({include: [{model: models.country, attributes: ['code']}], where: {userId: req.masterId}, attributes: ['sms_provider']})
                      .then(institute => sms.sendTeacherRegistrationSMS(filterMobileNumber(institute.country.code + req.mobile), {link: req.loginUrl, username: username, password: passwordForMail, lang: req.lang, institute_name: req.institute_name}, institute.sms_provider, req.masterId));
                      // .then(console.log, console.log);
                      res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                    } else {
                      req.user_detail.userId = data.id;
                      req.user_detail.languageId = 1;
                      req.teacher.teacher_detail.teacherId =teacherData.id;
                      req.teacher.teacher_detail.languageId =1;
                      models.userdetail.create(req.user_detail).then(function(){
                        models.teacherdetail.create(req.teacher.teacher_detail).then(function(){
                          var mailData = {email: req.email, subject: language.lang({key:"teacherRegistrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl, institute_name: req.institute_name}};
                          if(req.email !==''){
                            mail.sendHtmlMailToTeacher(mailData, req.lang);
                          }
                          models.institute.belongsTo(models.country);
                          models.institute.findOne({include: [{model: models.country, attributes: ['code']}], where: {userId: req.masterId}, attributes: ['sms_provider']})
                          .then(institute => sms.sendTeacherRegistrationSMS(filterMobileNumber(institute.country.code + req.mobile), {link: req.loginUrl, username: username, password: passwordForMail, lang: req.lang, institute_name: req.institute_name}, institute.sms_provider, req.masterId));
                          // .then(console.log, console.log);
                          res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                        })
                      })
                    }
                  });
                })
              })
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
      if (reqData.masterId !==1) {
        responseData.user = {masterId:reqData.masterId};
      }
      if (reqData.masterId !==1) {
        responseData.teacher = {masterId:reqData.masterId};
      }
      responseData.userdetail = {};
      responseData.teacherdetail = {};

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

    models.teacher.hasMany(models.teacherdetail);
    models.teacher.belongsTo(models.user);
    models.user.hasMany(models.userdetail);

    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
    );

    models.teacher.findAndCountAll({
      include: [
        {model: models.user, where:isWhere.user, attributes:['id', 'email', 'user_name', 'mobile', 'user_image', 'is_active'], include: [{model: models.userdetail, where:isWhere.userdetail, attributes:['id', 'fullname']}]}
      ],
      where: isWhere.teacher,
      attributes:['id'],
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
    })
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.teacher.hasMany(models.teacherdetail);
    models.teacher.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.teacher.hasMany(models.teachersubject);

    models.teacher.find({
      include: [
        {
          model: models.teacherdetail,
          where: language.buildLanguageQuery(
            {},
            req.langId,
            '`teacher`.`id`',
            models.teacherdetail,
            'teacherId'
          )
        },
        {
          model:models.user,
          include: [
            {
              model: models.userdetail,
              where: language.buildLanguageQuery(
                {},
                req.langId,
                '`user`.`id`',
                models.userdetail,
                'userId'
              )
            }
          ]
        },
        {
          model: models.teachersubject
        }
      ],
      where: {
        id:req.id,
        masterId: req.masterId
      }
    })
    .then(res)
    .catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}),
      url: true
    }));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.user.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      oauth.removeToken(req, function(result){
        res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
      });
    })
  };

  this.createSubjects = function(req, res){
    var teacherId = req.id;
    models.teachersubject.destroy({where:{teacherId:teacherId}}).then(function(){
      if (typeof req.subjectIds === 'string') {
        models.teachersubject.create({teacherId:teacherId, subjectId:req.subjectIds}).then(function(data){
            res(data);
          })
      } else{
        var count =1;
        var subjectData = [];
        var subjectIds = req.subjectIds;
        async.forEach(subjectIds, function (item, callback) {
          var saveData = {};
            saveData.teacherId = teacherId;
            saveData.subjectId = item;
            subjectData.push(saveData);
            if (req.subjectIds.length ==count) {
              callback(subjectData);
            }
          count++;
        }, function () {
          models.teachersubject.bulkCreate(subjectData).then(function(data){
            res(data);
          })
        });
      }
    })
  };

  this.sendLoginInfo = function (req, res) {
    models.user.hasMany(models.userdetail);
    models.teacher.belongsTo(models.user);
    models.institute.belongsTo(models.country);
    models.teacher.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
    models.teacher.findOne({
      include: [{
        model: models.institute,
        attributes: ['sms_provider'],
        include: [{
          model: models.country,
          attributes: ['code']
        }]
      }, {
        model: models.user,
        attributes: ['id', 'mobile', 'email', 'user_name'],
        include: [{
          model: models.userdetail,
          attributes: ['fullname'],
          where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId')
        }]
      }],
      attributes: ['id'],
      where: {
        id: req.id,
        masterId: req.masterId
      }
    })
    .then(teacher => {
      var rstPswrdToken = randomstring.generate();
      var rstPswrdVrfUrl = req.resetPassUrl+ rstPswrdToken;
      models.user.update({reset_password_token: rstPswrdToken}, {where: {id: teacher.user.id}})
      .then(() => {
        var mailData = {
          email: teacher.user.email,
          subject: language.lang({key:"passwordResetRequest", lang:req.lang}),
          list: {username: teacher.user.user_name, link: rstPswrdVrfUrl, fullname: teacher.user.userdetails[0].fullname}
        };
        mail.sendResetPasswordMail(mailData, req.lang);
        sms.sendForgotPasswordSMS(
          filterMobileNumber(teacher.institute.country.code + teacher.user.mobile),
          {link: rstPswrdVrfUrl, username: teacher.user.user_name, lang: req.lang},
          teacher.institute.sms_provider,
          req.masterId
        );
        res({status: true, message: language.lang({key: "Login info sent", lang: req.lang}), data: {}});
      })
    })
  };

  this.sendsms = function(req, res) {
    models.teacher.belongsTo(models.user);
    models.institute.belongsTo(models.country);
    models.teacher.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
    models.teacher.findAll({
      include: [{
        model: models.institute,
        attributes: ['id', 'sms_provider'],
        include: [{
          model: models.country,
          attributes: ['code']
        }]
      }, {
        model: models.user,
        attributes: ['id', 'mobile']
      }],
      attributes: ['id'],
      where: {
        id: {
          $in: req.ids
        },
        masterId: req.masterId
      }
    })
    .then(teachers => {
      if (teachers.length === 0) {
        return res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
      }
      var logs = [];
      var sms_provider = teachers[0].institute.sms_provider;
      teachers.forEach((teacher, index) => {
        logs[index] = {
          senderId: req.userId, // id of sender in users tables
          receiverId: teacher.user.id,
          masterId: req.masterId,
          module: 'teacher',
          message: req.message
        };
        teachers[index] = filterMobileNumber(teacher.institute.country.code + teacher.user.mobile);
      });
      teachers = teachers.filter((teacher, index) => teachers.indexOf(teacher) === index);
      sms.customSMS(teachers, req.message, sms_provider, req.masterId);
      //sms.sendByMsg91(teachers, req.message);
      res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
      models.smslog.bulkCreate(logs);
    })
  };

  this.viewSubjects = function(req, res){
    models.teachersubject.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);

    var isWhere = {};
    isWhere.subjectdetail = language.buildLanguageQuery(
      isWhere.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
    );
    models.teachersubject.findAll({
      include:[
        {model: models.subject, required:false, attributes:['id'],
          include:[
            {model: models.subjectdetail, attributes:['id', 'name'], required:false,
             where:isWhere.subjectdetail}
          ]
        }
      ],
      attributes:['id'],
      where:{teacherId:req.id}
    }).then(function(teachersubjects){
      res({teachersubjects:teachersubjects});
    })
  };

  this.sendemail = function(req, res) {
    models.teacher.belongsTo(models.user);
    Promise.all([
      models.teacher.findAll({
        include: [{
          model: models.user,
          attributes: ['id', 'email']
        }],
        attributes: ['id'],
        where: {
          id: {
            $in: req.ids
          },
          masterId:req.masterId
        }
      }),
      models.user.find({
        where:{id:req.masterId},
        attributes:['id', 'email']
      })
    ]).then(teachers => {
      if (teachers[0].length === 0) {
        return res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
      }
      var logs = [];
      var emailIds = [];      
      teachers[0].forEach((teacher, index) => {
        if(teacher.user.email != ''){
          emailIds.push(teacher.user.email);
        }
      });

      var from = '';
      if(teachers[1]){
        from = teachers[1].email;
      }
      if(req.files){
        mail.sendMail({email:emailIds, subject:req.subject, msg:req.message, attachments:req.files, from:from});
      } else{
        mail.sendMail({email:emailIds, subject:req.subject, msg:req.message});
      }
      res({status:true, message:language.lang({key:"Email Sent", lang:req.lang}), data:{}});
    });
  };

  this.remove = async req => {
    try {
      await models.user.destroy({where: {id: req.id}});
    } catch (err) {
      return {
        status: false,
        message: language.lang({key: 'Can not delete teacher, It is being used.'}),
      }
    }

    return {
      status: true,
      message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
    };
  };

}

module.exports = new Teacher();
