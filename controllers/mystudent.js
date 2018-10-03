var async = require('async');
const models = require('../models');
var language = require('./language');
var sms = require('./sms');
var moment = require('moment');

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

function myStudent() {

  this.getAllTeacherStudents = function(req, res) {
    var iswhere_enroll = {};
    var iswhere_name = {};
    if(typeof req.enrollment_no !== 'undefined' && req.enrollment_no !== ''){
      iswhere_enroll['enrollment_no'] = {$like: '%'+req.enrollment_no+'%'};
    }
    if(typeof req.name !== 'undefined' && req.name !== ''){
      iswhere_name['fullname'] = {$like: '%'+req.name+'%'};
    }
    models.studentrecord.belongsTo(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    iswhere_name = language.buildLanguageQuery(
      iswhere_name, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
    );
    models.studentrecord.scope(
      { method: ['transferred', moment(req.date).format('YYYY-MM-DD')]},
      { method: ['doa', '"'+moment(req.date).format('YYYY-MM-DD')+'"']},
      { method: ['tc', '"'+moment(req.date).format('YYYY-MM-DD')+'"', req.academicSessionId]}
    ).findAll({
      include: [
        {model:models.student, attributes:['id','father_contact', 'enrollment_no'],
        include:[{model:models.user, attributes:['id', 'user_image', 'mobile'],where:{'is_active':1},
        include:[{model:models.userdetail, attributes:['id', 'fullname'],
        where:iswhere_name}]},
        {model:models.studentdetail, attributes:['id','father_name', 'mother_name'],where: language.buildLanguageQuery({}, req.langId, 'student.id', models.studentdetail, 'studentId')}],
        where:iswhere_enroll}
      ],
      where: {
        masterId:req.masterId,
        academicSessionId:req.academicSessionId,
        bcsMapId:req.bcsMapId,
      },
      order: [
        ['id', 'DESC']
      ]
    }).then(function(data){
      res({status:true, message:language.lang({key:"student_list", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.sendsms = function(req, res) {
    models.student.belongsTo(models.user);
    models.institute.belongsTo(models.country);
    models.student.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
    models.student.find({
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
        id: req.id,
        masterId: req.masterId
      }
    })
    .then(student => {
      if (student === null) {
        return res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
      }
      var mobile = filterMobileNumber(student.institute.country.code + student.user.mobile);
      sms.SendSMS(mobile, req.message, student.institute.sms_provider, req.masterId);
      models.smslog.create({
        senderId: req.userId,
        receiverId: student.user.id,
        masterId: req.masterId,
        module: 'mystudent',
        message: req.message
      });
      res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getClassStudentsForPromotion = function(req, res) {
    var iswhere_enroll = {};
    var iswhere_name = {};

    if(typeof req.enrollment_no !== 'undefined' && req.enrollment_no !== ''){
      iswhere_enroll['enrollment_no'] = {$like: '%'+req.enrollment_no+'%'};
    }
    if(typeof req.name !== 'undefined' && req.name !== ''){
      iswhere_name['fullname'] = {$like: '%'+req.name+'%'};
    }
    models.studentrecord.belongsTo(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    iswhere_name = language.buildLanguageQuery(
      iswhere_name, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
    );
    models.studentrecord.scope(
      { method: ['tcwithoutdate', req.academicSessionId]}
    ).findAll({
      include: [
        {model:models.student, attributes:['id','father_contact', 'enrollment_no'],
        include:[{model:models.user, attributes:['id', 'user_image', 'mobile'],where:{'is_active':1},
        include:[{model:models.userdetail, attributes:['id', 'fullname'],
        where:iswhere_name}]},
        {model:models.studentdetail, attributes:['id','father_name', 'mother_name'],where: language.buildLanguageQuery({}, req.langId, 'student.id', models.studentdetail, 'studentId')}],
        where:iswhere_enroll},
      ],
      where: {
        masterId:req.masterId,
        academicSessionId:req.academicSessionId,
        bcsMapId:req.bcsMapId,
        promoted:0,
        transferred:{$ne: 1}
      },
     // attributes:['id'],
      order: [
        ['id', 'DESC']
      ]
    }).then(function(data){
      res({status:true, data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getClassStudentsForTransfer = function(req, res) {
    var iswhere_enroll = {};
    var iswhere_name = {};

    if(typeof req.enrollment_no !== 'undefined' && req.enrollment_no !== ''){
      iswhere_enroll['enrollment_no'] = {$like: '%'+req.enrollment_no+'%'};
    }
    if(typeof req.name !== 'undefined' && req.name !== ''){
      iswhere_name['fullname'] = {$like: '%'+req.name+'%'};
    }
    models.studentrecord.belongsTo(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    iswhere_name = language.buildLanguageQuery(
      iswhere_name, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
    );
    models.studentrecord.scope(
      { method: ['tcwithoutdate', req.academicSessionId]}
    ).findAll({
      include: [
        {model:models.student, attributes:['id','father_contact', 'enrollment_no'],
        include:[{model:models.user, attributes:['id', 'user_image', 'mobile'],where:{'is_active':1},
        include:[{model:models.userdetail, attributes:['id', 'fullname'],
        where:iswhere_name}]},
        {model:models.studentdetail, attributes:['id','father_name', 'mother_name'],where: language.buildLanguageQuery({}, req.langId, 'student.id', models.studentdetail, 'studentId')}],
        where:iswhere_enroll},
      ],
      where: {
        masterId:req.masterId,
        academicSessionId:req.academicSessionId,
        bcsMapId:req.bcsMapId,
        promoted:0,
        transferred:{$ne: 1}
      },
     // attributes:['id'],
      order: [
        ['id', 'DESC']
      ]
    }).then(function(data){
      res({status:true, data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

}

module.exports = new myStudent();
