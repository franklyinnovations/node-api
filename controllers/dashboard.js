var async = require('async');
const moment = require('moment');
const models = require('../models');
var language = require('./language');
var mail = require('./mail');
var todo = require('./todo');

models.student.hasOne(models.studentrecord);
models.student.belongsTo(models.user);
models.student.hasMany(models.attendancerecord);
models.attendancerecord.belongsTo(models.attendance);


function Dashboard() {

  /*
   * get Teacher By MasterId id
  */
  this.getTeacherbyinstitute = function(req, res) {
    models.teacher.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    
    var isWhere = {};
    isWhere = language.buildLanguageQuery(
      isWhere, req.langId, '`user`.`id`', models.userdetail, 'userId'
    );
    
    
    models.teacher.findAndCountAll({
      where: {masterId: req.masterId},
      include:[{
        model: models.user,
        include: [{
          model: models.userdetail,
          where: isWhere,
          attributes: ['fullname']
        }],
        attributes: ['id']
      }],
      distinct: true,
      attributes: ['id']
    }).then(data => res(data))
    .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };


  /*
   * get Student By MasterId id
  */
  this.getStudentbyinstitute = function(req, res) {
    models.student.belongsTo(models.user);
    models.student.hasOne(models.studentrecord);
    models.student.count({
      include: [
        {model: models.user, where:{is_active:1}},
        {model: models.studentrecord, where:{academicSessionId:req.academicSessionId}},
      ],
      where:{masterId:req.id},
      distinct: true
    }).then(function(data){
      res({count:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get Student By MasterId id current session
  */
  this.getStudentbyinstitutesession = function(req, res) {
    models.student.belongsTo(models.user);
    models.student.hasOne(models.studentrecord);
    models.student.count({
      include: [
        {model: models.user, where:{is_active:1}},
        {model: models.studentrecord, where:{academicSessionId:req.academicSessionId}}
      ],
      where:{masterId:req.id},
      distinct: true
    }).then(function(data){
      res({count:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };


  /*
   * get Last Three Sessions Student By MasterId
  */
  this.getFewsessionstudents = function(req, res) {
    models.academicsession.hasOne(models.studentrecord, {foreignKey: 'academicSessionId'});
    models.studentrecord.belongsTo(models.student);
    models.academicsession.findAndCountAll({
      attributes:['id'],
      include: [
        {model: models.studentrecord, attributes:['id'], include: [{model: models.student, attributes:['id']}]},
      ],
      where:{masterId:req.id,is_active:1},
      order:[['start_date','DESC']],
      //limit: 3,
    }).then(function(result){
      res({result});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get Classes By MasterId id
  */
 this.getClassesbyinstitute = function(req, res) {
    models.classes.count({
      where:{masterId:req.id,is_active:1},
    }).then(function(data){
      res({count:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get Timetable By Class id
  */
 this.getTimetable = function(req, res) {
    models.timetable.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    models.timetable.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.timetable.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    
    var isWhere = {};
    isWhere.boarddetail = language.buildLanguageQuery(
      isWhere.boarddetail, req.langId, '`board`.`id`', models.boarddetail, 'boardId'
    );
    isWhere.classesdetail = language.buildLanguageQuery(
      isWhere.classesdetail, req.langId, '`class`.`id`', models.classesdetail, 'classId'
    );
    isWhere.sectiondetail = language.buildLanguageQuery(
      isWhere.sectiondetail, req.langId, '`section`.`id`', models.sectiondetail, 'sectionId'
    );
    
    
    models.timetable.findAll({
      include: [
        {model: models.section, attributes:['id'], include: [{model: models.sectiondetail, attributes:['id', 'name'], where:isWhere.sectiondetail}]},
        {model: models.board, attributes:['id'], include: [{model: models.boarddetail, attributes:['id', 'name'], where:isWhere.boarddetail}]},
        {model: models.classes, attributes:['id'], include: [{model: models.classesdetail, attributes:['id', 'name'], where:isWhere.classesdetail}]},
      ],
      where: {masterId:req.masterId, academicSessionId:req.academicSessionId},
      attributes:['id'],
      order: [
        ['id', 'DESC']
      ]
    }).then(function(data){
      res({status:true, data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get Total Assignment for teacher By MasterId id current session
  */
  this.getTotalAssignment = function(req, res) {
    models.assignment.count({
      where:{userId:req.userId,masterId:req.masterId,academicSessionId:req.academicSessionId},
    }).then(function(result){
      if(result !== null){
        res({count:result});
      }else{
        res({count:0});
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get Total Assigned Classes for teacher By MasterId id current session
  */
  this.getTotalAssignedClasses = function(req, res) {
    var isWhere = {};
    isWhere['is_active'] = 1;
    isWhere['academicSessionId'] = req.academicSessionId;
    isWhere['masterId'] = req.masterId;
    models.sequelize.query("select group_concat(timetableId) as timeTableIds from timetable_allocations where teacherId = ? ",
    {replacements:[req.userId], type: models.sequelize.QueryTypes.SELECT} )
    .then(function(timeTableIdList) {
      if(timeTableIdList[0].timeTableIds !== null){
        var ids = timeTableIdList[0].timeTableIds.split(',');
        isWhere['id'] = {$in:ids};
      }
      models.timetable.count({
        where: isWhere,
      }).then(function(result){
          if(result !== null){
            res({count:result});
          }else{
            res({count:0});
          }
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get Total Assigned Periods for teacher By MasterId id current session
  */
  this.getTotalAssignedPeriods = function(req, res) {
    models.timetableallocation.belongsTo(models.timetable);
    models.timetableallocation.count({
      include: [
        {model: models.timetable,
          where: {masterId:req.masterId, academicSessionId:req.academicSessionId, is_active:1},
      }],
      where:{teacherId:req.userId},
    }).then(function(result){
      if(result !== null){
        res({count:result});
      }else{
        res({count:0});
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };


  /*
   * Email Send
  */
 this.sendMaildashboard = function(req, res) {
    var mailData = {email: req.emailto, subject: req.subject, msg: req.message, from: req.fromMail};
    mail.sendMail(mailData);
    res({status:true, message:language.lang({key:"emailSent", lang:req.lang})});
  };

  this.useInfo = function(req, res){
     var isWhere = {};
      isWhere.userdetail = language.buildLanguageQuery(
        isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
      );
      isWhere.teacherdetail = language.buildLanguageQuery(
        isWhere.teacherdetail, req.langId, '`teacher`.`id`', models.teacherdetail, 'teacherId'
      );
     if (req.user_type ==='teacher') {
      models.teacher.hasMany(models.teacherdetail);
      models.teacher.belongsTo(models.user);
      models.user.hasMany(models.userdetail);
           
      models.teacher.find({
        include: [
          {model: models.teacherdetail, where:isWhere.teacherdetail},
          {model: models.user, include: [{model: models.userdetail, where:isWhere.userdetail}]}
        ],
        where:{userId:req.id}
        }).then(function(userData){
        res({status:true, message:language.lang({key:"userInfo", lang:req.lang}),data:userData});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    } else {
      models.user.hasMany(models.userdetail);
      models.user.find({
        include: [
          {model: models.userdetail, where:isWhere.userdetail},
        ],
        where:{id:req.id}
        }).then(function(userData){
        res({status:true, message:language.lang({key:"userInfo", lang:req.lang}),data:userData});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }
  };
  
 this.superadmin = function(req, res) {
    Promise.all([
      models.user.count(),
      models.ticket.count({where: {status: 0}}),
      models.contact.count(),
      models.institute.count({where:{id:{$ne:1}}}),
      new Promise(resolve => todo.getAllTodoList({id: 1}, resolve))
    ]).then(result => res({
      users: result[0],
      tickets: result[1],
      messages: result[2],
      institutes: result[3],
      todoList: result[4]
    }))
    .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.teacherApp = function(req, res){
    Promise.all([
      models.notificationreceiver.count({
        where:{
          receiverId:req.userId,
          status:0
        }
      })
    ]).then(function(result){
      res({status:true, notification:result[0]});
    });
  };

  /* Functions for react-redux admin*/
  this.getDashboardInstitute = function(req, res){
    Promise.all([
      models.user.count({
        where: {
          masterId: req.masterId,
          user_type: 'teacher',
          is_active: true
        },
      }),
      models.student.count({
        include: [
          {
            model: models.user,
            where: {is_active: 1}
          },
          {
            model: models.studentrecord.scope(
            { method: ['transferred', moment().format('YYYY-MM-DD')]},
            { method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
          ),
            where: {
              academicSessionId: req.academicSessionId,
              /*record_status: 1,
               $or : [
                {transferred: 0},
                {transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}},
                {transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}},
              ],*/
            }
          },
        ],
        where:{masterId:req.masterId},
        distinct: true,
      }),
      models.classes.count({
        where:{
          masterId: req.masterId,
          is_active: 1,
        },
      }),
      models.vehicle.count({
        where: {
          masterId: req.masterId,
          is_active: 1,
        }
      }),
      models.empleave.count({
        where: {
          masterId: req.masterId,
          start_date: {
            $lte: moment().format('YYYY-MM-DD'),
          },
          end_date: {
            $gte: moment().format('YYYY-MM-DD'),
          },
          user_type: 'teacher',
          leavestatus: {
            $in: [0, 1],
          }
        }
      }),
      models.student.count({
        include: [
          {
            model: models.user,
            where: {is_active: 1}
          },
          {
            model: models.studentrecord,
            where: {
              academicSessionId: req.academicSessionId,
              record_status: 1,
            }
          },
          {
            model: models.attendancerecord,
            include: [
              {
                model: models.attendance,
                where: {
                  date: moment().format('YYYY-MM-DD'),
                  academicSessionId: req.academicSessionId,
                }
              }
            ],
            where: {
              is_present: {$in: [1, 2]},
            }
          },
        ],
        where:{masterId:req.masterId},
        distinct: true,
      }),
      models.ticket.count({
        where: {
          masterId: req.masterId
        }
      })
    ]).then(([teachers, students, classes, vehicles, absentTeachers, presentStudents, tickets]) => {
      res({
        status:true,
        teachers,
        students,
        classes,
        vehicles,
        absentTeachers,
        presentStudents,
        tickets,
      });
    })
    .catch(() => res({
      status: false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}),
      url: true,
      code: 500
    }));
  }

}

module.exports = new Dashboard();
