var async = require('async');
const models = require('../models');
var language = require('./language');
var sms = require('./sms');

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

function Attendancereport() {

  /*
  * Get Subject by Institute
  */
  this.getAllSubjectsByInstitute  = function(req, res) {
    models.timetableallocation.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    
    var isWhere = {};
    isWhere.subjectdetail = language.buildLanguageQuery(
      isWhere.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
    );
    
    models.sequelize.query("select id from timetables where bcsMapId = ? and academicSessionId = ? ",
    {replacements:[req.bcsMapId,req.academicSessionId], type: models.sequelize.QueryTypes.SELECT} )
    .then(function(timetableId) {
      models.timetableallocation.findAll({
        include:[{model:models.subject, attributes:['id'],
          include:[{model:models.subjectdetail, attributes:['id', 'name'],
          where:isWhere.subjectdetail
           }]
         }],
         where:{timetableId:timetableId[0].id},
         group:[['subjectId']]}).then(function(subjects){
          module.exports.getAllStudents(req, function(students){
          res({status:true, message:language.lang({key:"subject_list", lang:req.lang}),subjects:subjects, students:students});
        });
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  * Get Subject by Institute
  */
  this.getAllSubjectsByTeacher  = function(req, res) {
    models.timetableallocation.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    var isWhere = {};
    isWhere.subjectdetail = language.buildLanguageQuery(
      isWhere.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
    );
    models.sequelize.query("select id from timetables where bcsMapId = ? and academicSessionId = ? ",
    {replacements:[req.bcsMapId,req.academicSessionId], type: models.sequelize.QueryTypes.SELECT} )
    .then(function(timetableId) {
      models.timetableallocation.findAll({
        include:[{model:models.subject, attributes:['id'],
          include:[{model:models.subjectdetail, attributes:['id', 'name'],
          where:isWhere.subjectdetail
          }]
        }],
        where:{timetableId:timetableId[0].id, teacherId:req.userId},
        group:[['subjectId']]}).then(function(subjects){
        module.exports.getAllStudents(req, function(students){
          res({status:true, message:language.lang({key:"subject_list", lang:req.lang}),subjects:subjects, students:students});
        });
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  * Get Students
  */
  this.getAllStudents  = function(req, res) {
    models.studentrecord.belongsTo(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    
    var isWhere = {};
    isWhere.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, '`student`.`id`', models.studentdetail, 'studentId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
    );
    models.studentrecord.findAll({
       include: [
        {model:models.student, attributes:['id','father_contact', 'enrollment_no'],
        include:[{model:models.user, attributes:['id'], where:{'is_active':1},
        include:[{model:models.userdetail, attributes:['id', 'fullname'],
        where:isWhere.userdetail}]},
        {model:models.studentdetail, attributes:['id','father_name'], where:isWhere.studentdetail}]},
      ],
      where:{
        masterId:req.masterId,
        academicSessionId:req.academicSessionId,
        bcsMapId:req.bcsMapId,
        record_status:1
      }}).then(function(subjects){
      res(subjects);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getReport = function(req, res){
    var isWhere = {};
    var isWhereAR = {};
    if (req.subjectId !== '') {
      isWhereAR.subjectId = req.subjectId;
    }
    if (req.studentId !== '') {
      isWhereAR.studentId = req.studentId;
    }

    if (typeof req !== 'undefined') {
        var responseData = {};
        async.forEach(Object.keys(req), function (item, callback) {
            if (req[item] !== ''){
              if(item == 'startDate' || item == 'endDate'){
                 responseData['date'] = {$between:[req['startDate'], req['endDate']]};
              }else{
                 responseData[item] = req[item];
              }
            }
            callback();
        }, function (err) {
            delete responseData.langId;
            delete responseData.orderby;
            delete responseData.lang;
            delete responseData.studentId;
            delete responseData.subjectId;
            isWhere = responseData;
        });
    }

    models.attendancerecord.belongsTo(models.attendance);
    models.attendancerecord.belongsTo(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.hasOne(models.studentrecord);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    
    var isWherelang = {};
    isWherelang.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, '`student`.`id`', models.studentdetail, 'studentId'
    );
    isWherelang.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
    );
    
    models.attendancerecord.findAll({
      include: [
        {model:models.attendance,attributes:['id'],
          where:isWhere
        },
        {model:models.student, attributes:['id','father_contact', 'enrollment_no'],
           include:[
             {model:models.user, attributes:['id','user_image'], where:{'is_active':1},
               include:[{model:models.userdetail, attributes:['id', 'fullname'],
               where:isWherelang.userdetail}]
             },
            {model:models.studentdetail, attributes:['id','father_name'], where:isWherelang.studentdetail},
            {
              model: models.studentrecord,
              attributes: ['roll_no'],
              where: {
                record_status: 1,
                bcsMapId: req.bcsMapId
              }
            }
           ]
        }
      ],
       attributes:[
         'studentId',
         [models.sequelize.fn('COUNT', models.sequelize.col('attendancerecord.id')), 'totalAttendance'],
         [models.sequelize.fn('SUM', models.sequelize.fn('IF',models.sequelize.literal('attendancerecord.is_present=1 or attendancerecord.is_present=2,1,0'))), 'totalPresent'],
       ],
      order: [
        [models.student, 'id', 'ASC']
      ],
      group:[['studentId']],
      where:isWhereAR
      }).then(function(data){
      res({status:true, message:language.lang({key:"attendance_report", lang:req.lang}),data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getReportByStudent = function(req, res){
    var isWhere = {};
    var isWhereAR = {};
    if (req.studentId !== '') {
      isWhereAR.studentId = req.studentId;
    }

    if (typeof req !== 'undefined') {
      var responseData = {};
      async.forEach(Object.keys(req), function (item, callback) {
        if (req[item] !== ''){
          responseData[item] = req[item];
        }
        callback();
      }, function (err) {
        delete responseData.langId;
        delete responseData.orderby;
        delete responseData.lang;
        delete responseData.studentId;
        isWhere = responseData;
      });
    }
    
    var isWherelang = {};
    isWherelang.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );

    models.attendance.hasMany(models.attendancerecord);
    models.attendance.findAll({
      attributes:['id', 'date', 'period'],
      include: [{model:models.attendancerecord,
        attributes:['id', 'is_present', 'tags', 'studentId'],
        where:isWhereAR
      }],
      where:isWhere
    }).then(function(data){
      models.tag.hasMany(models.tagdetail);
      return models.tag.findAll({
        include:[{
          model: models.tagdetail,
          where: isWherelang.tagdetail,
          attributes: ['title', 'description']
        }],
        where: {
          masterId: req.masterId,
          type: 0
        },
        order: [['id']]
      }).then(tags=>res({
        status:true,
        message:language.lang({key:"attendance_report", lang:req.lang}),
        data:data,
        tagsData: tags
      }))
      .catch(() => res({
        status:false,
        error: true,
        error_description: language.lang({key: "Internal Error", lang: req.lang}),
        url: true
      }));
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}),
      url: true
    }));
  };

  this.sendsms = function(req, res) {
    models.student.belongsTo(models.user);
    models.institute.belongsTo(models.country);
    models.student.belongsTo(models.institute, {foreignKey: 'masterId', targetKey: 'userId'});
    models.student.findAll({
      include: [{
        model: models.institute,
        attributes: ['id','sms_provider'],
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
    .then(students => {
      if (students.length === 0) {
        return res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
      }
      var logs = [];
      var sms_provider = students[0].institute.sms_provider;
      students.forEach((student, index) => {
        logs[index] = {
          senderId: req.userId,
          receiverId: student.user.id,
          masterId: req.masterId,
          module: 'attendance',
          message: req.message
        };
        students[index] = filterMobileNumber(student.institute.country.code + student.user.mobile);
      });
      students = students.filter((student, index) => students.indexOf(student) === index);
      models.smslog.bulkCreate(logs);
      sms.customSMS(students, req.message, sms_provider, req.masterId);
      //sms.sendByMsg91(students, req.message);
      res({status:true, message:language.lang({key:"SMS Sent", lang:req.lang}), data:{}});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

}

module.exports = new Attendancereport();
