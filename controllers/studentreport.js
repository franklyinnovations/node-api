var async = require('async');
const models = require('../models');
var language = require('./language');

function Studentreport() {

  /*
  * Get Subject by Institute
  */
  this.getAllSubjectsByInstitute  = function(req, res) {
    models.timetableallocation.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    models.sequelize.query("select id from timetables where bcsMapId = ? and academicSessionId = ? ",
    {replacements:[req.bcsMapId,req.academicSessionId], type: models.sequelize.QueryTypes.SELECT} )
    .then(function(timetableId) {
      if(timetableId.length > 0){
        timetableIdVal = timetableId[0].id;
      }else{
        timetableIdVal = 0;
      }
      models.timetableallocation.findAll({
        include:[{model:models.subject, attributes:['id'],
          include:[{model:models.subjectdetail, attributes:['id', 'name'],
          where: language.buildLanguageQuery({}, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId')
           }]
         }],
         where:{timetableId:timetableIdVal},
         group:[['subjectId']]
      }).then(function(subjects){
          res({status:true, message:language.lang({key:"subject_list", lang:req.lang}),data:subjects});
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };


  this.getReport = function(req, res){
    var isWhere = {};
    var isWhereAR = {};
    if (req.subjectId !== '') {
      isWhereAR.subjectId = req.subjectId;
    }
    isWhereAR.studentId = req.studentId;

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
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.attendancerecord.findAll({
      include: [
        {model:models.attendance,attributes:['id'],
          where:isWhere
        },
        {model:models.student, attributes:['id','father_contact', 'enrollment_no'],
           include:[
             {model:models.user, attributes:['id','user_image'],
               include:[{model:models.userdetail, attributes:['id', 'fullname'],
               where: language.buildLanguageQuery({}, req.langId, '`student.user`.`id`', models.userdetail, 'userId'), required: false}], required: false
             },
           {model:models.studentdetail, attributes:['id','father_name'], where: language.buildLanguageQuery({}, req.langId, 'student.id', models.studentdetail, 'studentId')}
           ],  required: false
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
    isWhereAR.studentId = req.studentId;

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

    models.attendance.hasMany(models.attendancerecord);
    models.attendancerecord.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    models.attendance.findAll({
      attributes:['id', 'date'],
      include: [{model:models.attendancerecord,
        attributes:['id', 'is_present', 'studentId', 'subjectId'],
        include:[{model:models.subject, attributes:['id'],
          include:[{model:models.subjectdetail, attributes:['id', 'name'],
          where: language.buildLanguageQuery({}, req.langId, '`attendancerecords.subject`.`id`', models.subjectdetail, 'subjectId')
           }]
         }],
        where:isWhereAR
      }],
      where:isWhere
    }).then(function(data){
      res({status:true, message:language.lang({key:"attendance_report", lang:req.lang}),data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
  this.getReportByParent = function(req, res){
    var langIdArr = req.langId.split(',');
    var isWhere = {};
    var isWhereAR = {};
    isWhereAR.studentId = req.studentId;

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
    
    models.attendance.hasMany(models.attendancerecord);
    models.attendancerecord.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    models.attendance.findAll({
      attributes:['id', 'date'],
      include: [{model:models.attendancerecord,
        attributes:['id', 'is_present', 'studentId', 'subjectId'],
        include:[{model:models.subject, attributes:['id'],
          include:[{model:models.subjectdetail, attributes:['id', 'name'],
          where: language.buildLanguageQuery(
            {},
            req.langId,
            '`attendancerecords.subject`.`id`',
            models.subjectdetail,
            'subjectId'
          )
          }]
         }],
        where:isWhereAR
      }],
      where:isWhere,
      group:'date',
      order: 'date desc'
    }).then(function(data){
       sliceData=data.slice(0, 4); 
      res({status:true, message:language.lang({key:"attendance_report", lang:req.lang}),data:sliceData});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

}

module.exports = new Studentreport();
