var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');

models.subject.hasMany(models.subjectdetail);
models.subject.hasMany(models.teachersubject);

function Utils() {

    /*
    * Get Bcs by Institute
    */
    this.getAllbcsByInstitute = function(req, res) {
      models.timetable.belongsTo(models.bcsmap);
      models.bcsmap.belongsTo(models.board);
      models.board.hasMany(models.boarddetail);
      models.bcsmap.belongsTo(models.section);
      models.section.hasMany(models.sectiondetail);
      models.bcsmap.belongsTo(models.classes);
      models.classes.hasMany(models.classesdetail);

      models.timetable.findAll({
        include: [
          {model: models.bcsmap,
             include: [{model: models.board, attributes:['id'],
               include: [{model: models.boarddetail,
                 attributes:['id', 'name', 'alias'],
                 where: language.buildLanguageQuery({}, req.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId')
               }]
             },{model: models.classes, attributes:['id'],
               include: [{model: models.classesdetail,
                 attributes:['id', 'name'],
                 where: language.buildLanguageQuery({}, req.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId')
               }]
             },{model: models.section, attributes:['id'],
               include: [{model: models.sectiondetail,
                 attributes:['id', 'name'],
                 where: language.buildLanguageQuery({}, req.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId')
               }]
             }],
             where: req.grade ? {gradeId: {$ne: null}} : undefined,
          }
        ],
        where: {masterId:req.masterId, academicSessionId:req.academicSessionId, is_active:1},
        order: [
          [ models.bcsmap, models.board, 'display_order', 'ASC'],
          [ models.bcsmap, models.board, 'id', 'ASC'],
          [ models.bcsmap, models.classes, 'display_order', 'ASC'],
          [ models.bcsmap, models.classes, 'id', 'ASC'],
          [ models.bcsmap, models.section, 'display_order', 'ASC'],
          [ models.bcsmap, models.section, 'id', 'ASC'],
          ['id', 'DESC']
        ],
      }).then(function(data){
        res({status:true, data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    };

    /*
    * Get Bcs by Teacher
    */
    this.getAllbcsByTeacher = function(req, res) {
      models.timetable.hasMany(models.timetableallocation);
      models.timetable.belongsTo(models.bcsmap,{foreignKey:'bcsMapId'});
      models.bcsmap.belongsTo(models.board);
      models.board.hasMany(models.boarddetail);
      models.bcsmap.belongsTo(models.section);
      models.section.hasMany(models.sectiondetail);
      models.bcsmap.belongsTo(models.classes);
      models.classes.hasMany(models.classesdetail);

      models.timetable.findAll({
        attributes:['id','bcsMapId'],
        include: [
          {model: models.timetableallocation, attributes:['id'], where:{teacherId:req.userId}},
          {model: models.bcsmap,
             include: [{model: models.board, attributes:['id'],
               include: [{model: models.boarddetail,
                 attributes:['id', 'name', 'alias'],
                 where: language.buildLanguageQuery({}, req.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId')
               }]
             },{model: models.classes, attributes:['id'],
               include: [{model: models.classesdetail,
                 attributes:['id', 'name'],
                 where: language.buildLanguageQuery({}, req.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId')
               }]
             },{model: models.section, attributes:['id'],
               include: [{model: models.sectiondetail,
                 attributes:['id', 'name'],
                 where: language.buildLanguageQuery({}, req.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId')
               }]
             }],
          }
        ],
        where: {masterId:req.masterId, academicSessionId:req.academicSessionId, is_active:1},
        order: [
          [ models.bcsmap, models.board, 'display_order', 'ASC'],
          [ models.bcsmap, models.board, 'id', 'ASC'],
          [ models.bcsmap, models.classes, 'display_order', 'ASC'],
          [ models.bcsmap, models.classes, 'id', 'ASC'],
          [ models.bcsmap, models.section, 'display_order', 'ASC'],
          [ models.bcsmap, models.section, 'id', 'ASC'],
          ['id', 'DESC']
        ]
      }).then(function(data){
        res({status:true, data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    };

  /*
  * Get Subject by Institute
  */
  this.getSubjectByInstitute  = function(req, res) {
    models.timetableallocation.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    models.sequelize.query("select id from timetables where bcsMapId = ? and academicSessionId = ? ",
    {replacements:[req.bcsMapId,req.academicSessionId], type: models.sequelize.QueryTypes.SELECT} )
    .then(function(timetableId) {
      models.timetableallocation.findAll({
        include:[{
          model:models.subject,
          attributes:['id'],
          include:[{
            model:models.subjectdetail,
            attributes:['id', 'name'],
            where: language.buildLanguageQuery({}, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId')
          }],
          where: {
            is_active: 1
          }
        }],
        where:{
          timetableId:timetableId[0].id
        },
        group:[['subjectId']]
      }).then(function(subjects){
        res({
          status:true,
          data:subjects
        });
      }).catch(() => res({
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

  /*
  * Get Subject by Teacher
  */
  this.getSubjectByTeacher  = function(req, res) {
    models.timetableallocation.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    models.sequelize.query("select id from timetables where bcsMapId = ? and academicSessionId = ? ",
    {replacements:[req.bcsMapId,req.academicSessionId], type: models.sequelize.QueryTypes.SELECT} )
    .then(function(timetableId) {
      models.timetableallocation.findAll({
        include:[{
          model:models.subject,
          attributes:['id'],
          include:[{
            model:models.subjectdetail,
            attributes:['id', 'name'],
            where: language.buildLanguageQuery({}, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId')
          }],
          where: {
            is_active: 1
          }
        }],
        where:{
          timetableId:timetableId[0].id,
          teacherId:req.userId
        },
        group:[['subjectId']]
      }).then(function(subjects){
        res({
          status:true,
          data:subjects
        });
      }).catch(() => res({
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

  /*
  * Get All Bcs by Master Id
  */
  this.getAllBcsByMasterId = function(req, res) {

    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);

    models.bcsmap.findAll({
           include: [{model: models.board, attributes:['id'],
             include: [{model: models.boarddetail,
               attributes:['id', 'name', 'alias'],
               where: language.buildLanguageQuery({}, req.langId, '`board`.`id`', models.boarddetail, 'boardId')
             }]
           },{model: models.classes, attributes:['id'],
             include: [{model: models.classesdetail,
               attributes:['id', 'name'],
               where: language.buildLanguageQuery({}, req.langId, '`class`.`id`', models.classesdetail, 'classId')
             }]
           },{model: models.section, attributes:['id'],
             include: [{model: models.sectiondetail,
               attributes:['id', 'name'],
               where: language.buildLanguageQuery({}, req.langId, '`section`.`id`', models.sectiondetail, 'sectionId')
             }]
           }],
      where: {masterId:req.masterId, is_active:1},
      order: [
        [ models.board, 'display_order', 'ASC'],
        [ models.board, 'id', 'ASC'],
        [ models.classes, 'display_order', 'ASC'],
        [ models.classes, 'id', 'ASC'],
        [ models.section, 'display_order', 'ASC'],
        [ models.section, 'id', 'ASC'],
        ['id', 'DESC']
      ]
    }).then(function(data){
      res({status:true, data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  * Get All Bcs by Master Id
  */
  this.getBcsId = function(req, res) {
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.bcsmap.find({
      include: [{
        model: models.board,
        attributes:['id'],
        include: [{
          model: models.boarddetail,
          attributes:['id', 'name', 'alias'],
          where: language.buildLanguageQuery({}, req.langId, '`board`.`id`', models.boarddetail, 'boardId')
        }]
      },{
        model: models.classes,
        attributes:['id'],
        include: [{
          model: models.classesdetail,
          attributes:['id', 'name'],
          where: language.buildLanguageQuery({}, req.langId, '`class`.`id`', models.classesdetail, 'classId')
        }]
      },{
        model: models.section,
        attributes:['id'],
        include: [{
          model: models.sectiondetail,
          attributes:['id', 'name'],
          where: language.buildLanguageQuery({}, req.langId, '`section`.`id`', models.sectiondetail, 'sectionId')
        }]
      }],
      attributes:['id'],
      where: {masterId:req.masterId, id:req.id},
      order: [
        [ models.board, 'display_order', 'ASC'],
        [ models.board, 'id', 'ASC'],
        [ models.classes, 'display_order', 'ASC'],
        [ models.classes, 'id', 'ASC'],
        [ models.section, 'display_order', 'ASC'],
        [ models.section, 'id', 'ASC'],
        ['id', 'DESC']
      ]
    }).then(function(data){
      res({status:true, message:language.lang({key:"bcs_list", lang:req.lang}), data:data});
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang, data:null}),
      url: true
    }));
  };

  /*
  * Get All Bcs by Master Id
  */
  this.getFilteredBcsByMasterId = function(req, res) {
    var isWhere = {};
    isWhere['is_active'] = 1;
    isWhere['masterId'] = req.masterId;

    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.sequelize.query("select group_concat(bcsMapId) as bcsMapIds from timetables where masterId = ? and academicSessionId = ? ",
    {replacements:[req.masterId,req.academicSessionId], type: models.sequelize.QueryTypes.SELECT} )
    .then(function(bcsIdList) {
      if(bcsIdList[0].bcsMapIds !== null){
        var ids = bcsIdList[0].bcsMapIds.split(',');
        isWhere['id'] = {$notIn:ids};
      }
      models.bcsmap.findAll({
             include: [{model: models.board, attributes:['id'],
               include: [{model: models.boarddetail,
                 attributes:['id', 'name', 'alias'],
                 where: language.buildLanguageQuery({}, req.langId, '`board`.`id`', models.boarddetail, 'boardId')
               }]
             },{model: models.classes, attributes:['id'],
               include: [{model: models.classesdetail,
                 attributes:['id', 'name'],
                 where: language.buildLanguageQuery({}, req.langId, '`class`.`id`', models.classesdetail, 'classId')
               }]
             },{model: models.section, attributes:['id'],
               include: [{model: models.sectiondetail,
                 attributes:['id', 'name'],
                 where: language.buildLanguageQuery({}, req.langId, '`section`.`id`', models.sectiondetail, 'sectionId')
               }]
             }],
        where: isWhere,
        order: [
          [ models.board, 'display_order', 'ASC'],
          [ models.board, 'id', 'ASC'],
          [ models.classes, 'display_order', 'ASC'],
          [ models.classes, 'id', 'ASC'],
          [ models.section, 'display_order', 'ASC'],
          [ models.section, 'id', 'ASC'],
          ['id', 'DESC']
        ]
      }).then(function(data){
        res({status:true, data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  * Get All Bcs by Master Id For Fee
  */
  this.getFilteredBcsByMasterIdForFee = function(req, res) {
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.bcsmap.findAll({
      include: [{model: models.board, attributes:['id'],
        include: [{
          model: models.boarddetail,
          attributes:['id', 'name', 'alias'],
          where: language.buildLanguageQuery({}, req.langId, '`board`.`id`', models.boarddetail, 'boardId')
        }]
      },{
        model: models.classes, attributes:['id'],
        include: [{model: models.classesdetail,
          attributes:['id', 'name'],
          where: language.buildLanguageQuery({}, req.langId, '`class`.`id`', models.classesdetail, 'classId')
        }]
      },{
        model: models.section, attributes:['id'],
        include: [{model: models.sectiondetail,
          attributes:['id', 'name'],
          where: language.buildLanguageQuery({}, req.langId, '`section`.`id`', models.sectiondetail, 'sectionId')
        }]
      }],
      where: {
        is_active: 1,
        masterId: req.masterId
      },
      order: [
        [ models.board, 'display_order', 'ASC'],
        [ models.board, 'id', 'ASC'],
        [ models.classes, 'display_order', 'ASC'],
        [ models.classes, 'id', 'ASC'],
        [ models.section, 'display_order', 'ASC'],
        [ models.section, 'id', 'ASC'],
        ['id', 'DESC']
      ],
      group:['boardId','classId']
    }).then(function(data){
      res({status:true, data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get By end date and master id
  */
 this.getNextAcademicSession = function(req, res) {
    var endDate = moment(req.academicSessionsEndDate).format('YYYY-MM-DD');
    models.academicsession.hasMany(models.academicsessiondetail);
    var isWhere = {};
    isWhere = language.buildLanguageQuery(
      isWhere, req.langId, '`academicsession`.`id`', models.academicsessiondetail, 'academicsessionId'
    );
    models.academicsession.find({
      include: [{
        model: models.academicsessiondetail,
        where:isWhere
      }],
      where:{masterId:req.masterId, start_date:{$gt:endDate}, is_active : 1},
    })
    .then(function(data){
      res({status:true, data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get Academic session by id
  */
 this.getAcademicSessionById = function(req, res) {
    models.academicsession.hasMany(models.academicsessiondetail);
    var isWhere = {};
    isWhere = language.buildLanguageQuery(
      isWhere, req.langId, '`academicsession`.`id`', models.academicsessiondetail, 'academicsessionId'
    );
    models.academicsession.find({
      include: [{
        model: models.academicsessiondetail,
        where:isWhere
      }],
      where:{id:req.academicSessionId},
    })
    .then(function(data){
      res({status:true, message:language.lang({key:"Current Academic Session", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  * Get All Bcs by Master Id
  */
  this.getAllBcsByMasterIdForTransfer = function(req, res) {

    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);

    models.bcsmap.findAll({
           include: [{model: models.board, attributes:['id'],
             include: [{model: models.boarddetail,
               attributes:['id', 'name', 'alias'],
               where: language.buildLanguageQuery({}, req.langId, '`board`.`id`', models.boarddetail, 'boardId')
             }]
           },{model: models.classes, attributes:['id'],
             include: [{model: models.classesdetail,
               attributes:['id', 'name'],
               where: language.buildLanguageQuery({}, req.langId, '`class`.`id`', models.classesdetail, 'classId')
             }]
           },{model: models.section, attributes:['id'],
             include: [{model: models.sectiondetail,
               attributes:['id', 'name'],
               where: language.buildLanguageQuery({}, req.langId, '`section`.`id`', models.sectiondetail, 'sectionId')
             }]
           }],
      where: {masterId:req.masterId, is_active:1, id:{$ne:req.bcsMapId}},
      order: [
        [ models.board, 'display_order', 'ASC'],
        [ models.board, 'id', 'ASC'],
        [ models.classes, 'display_order', 'ASC'],
        [ models.classes, 'id', 'ASC'],
        [ models.section, 'display_order', 'ASC'],
        [ models.section, 'id', 'ASC'],
        ['id', 'DESC']
      ]
    }).then(function(data){
      res({status:true, message:language.lang({key:"bcs_list", lang:req.lang}), data:data});
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

  /*
  * Get Current Date
  */
  this.getTimezone = function(req) {
    return models.institute.findOne({
      where: {
        userId: req.masterId
      },
      attributes: ['id', 'timezone']
    })
    .then((institute) => {
      return institute.timezone;
    });
  };

  this.subjects = req => {
    if (req.user_type === 'teacher') {
      return models.subject.findAll({
        include: [
          {
            model: models.subjectdetail,
            where: language.buildLanguageQuery(
              null,
              req.langId,
              '`subject`.`id`',
              models.subjectdetail,
              'subjectId'
            ),
            attributes: ['name']
          },
          {
            model: models.teachersubject,
            where: {
              teacherId: req.userTypeId,
            },
            attributes: [],
          }
        ],
        where: {
          masterId: req.masterId,
          is_active: true,
        },
        attributes: ['id'],
      })
    } else {
      return models.subject.findAll({
        include: [
          {
            model: models.subjectdetail,
            where: language.buildLanguageQuery(
              null,
              req.langId,
              '`subject`.`id`',
              models.subjectdetail,
              'subjectId'
            ),
            attributes: ['name']
          },
        ],
        where: {
          masterId: req.masterId,
          is_active: true,
        },
        attributes: ['id'],
      })
    }
  };

  this.getStudentsByBcsMapId = req => {
    return Promise.all([
      models.studentrecord.scope(
      { method: ['transferred', moment().format('YYYY-MM-DD')]},
      { method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
    ).findAll({
        include: [
          {
            model: models.student,
            attributes: [
              'id',
              'enrollment_no'
            ],
            include: [
              {
                model: models.user,
                attributes: [
                  'id'
                ],
                where: {
                  is_active: 1
                },
                include: [
                  {
                    model: models.userdetail,
                    attributes: ['id','fullname'],
                    where: language.buildLanguageQuery(
                      {},
                      req.langId,
                      '`student.user`.`id`',
                      models.userdetail,
                      'userId'
                    )
                  }
                ],
              }
            ],
          }
        ],
        where: {
          bcsMapId: req.bcsmapId,
          masterId: req.masterId,
          academicSessionId: req.academicSessionId
        },
        attributes: ['id']
      })
    ])
    .then(([data])=> ({status: true, data}));
  };

  this.timezones = () => moment.tz.names();
}
module.exports = new Utils();
