var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var notification = require('./notification');

function Mark() {
  /*
  * list of all
  */
 this.list = function(req, res) {
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
    var isWhere = {
      mark: {}
    };
    var orderBy = '';
    if (req.query) {
      var responseData = {};
      responseData.mark = {masterId:reqData.masterId, academicSessionId:reqData.academicSessionId,};
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
    if (reqData.user_type === 'teacher') {
      isWhere.mark.teacher = models.sequelize.literal(
        '(SELECT COUNT(*) FROM `timetables` INNER JOIN `timetable_allocations` \
        ON `timetables`.`id` = `timetable_allocations`.`timetableId` AND `teacherId` = '
        + JSON.stringify(parseInt(reqData.userTypeId))
        + ' AND `timetables`.`is_active` = 1 AND `timetables`.`academicSessionId` = '
        + JSON.stringify(parseInt(reqData.academicSessionId))
        + ' AND `timetables`.`masterId` = '
        + JSON.stringify(parseInt(reqData.masterId))
        + ' WHERE `timetables`.`bcsMapId` = `bcsmap`.`id`)'
      );
    }

    models.mark.hasMany(models.markrecord);
    models.mark.belongsTo(models.examschedule, {foreignKey: 'examScheduleId'});
    models.examschedule.belongsTo(models.examhead);
    models.examhead.hasMany(models.examheaddetail);
    models.mark.belongsTo(models.bcsmap, {foreignKey: 'bcsMapId'});
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    
    isWhere.examheaddetail = language.buildLanguageQuery(
      isWhere.examheaddetail, reqData.langId, '`examschedule.examhead`.`id`', models.examheaddetail, 'examheadId'
    );
    isWhere.boarddetail = language.buildLanguageQuery(
      isWhere.boarddetail, reqData.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
    );
    isWhere.classesdetail = language.buildLanguageQuery(
      isWhere.classesdetail, reqData.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
    );
    isWhere.sectiondetail = language.buildLanguageQuery(
      isWhere.sectiondetail, reqData.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
    );
    
    models.mark.findAndCountAll({
      include: [
        {model: models.bcsmap, attributes:['id'],
        include:[
            {model: models.board, attributes:['id'], include:[{model: models.boarddetail, where:isWhere.boarddetail, attributes:['id', 'name', 'alias']}]},
            {model: models.classes, attributes:['id'], include:[{model: models.classesdetail, where:isWhere.classesdetail, attributes:['id', 'name']}]},
            {model: models.section, attributes:['id'], include:[{model: models.sectiondetail, where:isWhere.sectiondetail, attributes:['id', 'name']}]}
         ]},
         {model: models.examschedule, attributes:['id'], include:[{model: models.examhead, attributes:['id'], include:[{model: models.examheaddetail, attributes:['id', 'name'], where:isWhere.examheaddetail, group:['examheadId']}]}]},
      ],
      attributes:['id', 'bcsMapId', 'examScheduleId'],
      where: isWhere.mark,
      order: [
         ['id', 'DESC']
      ],
      distinct: true,
      group:['examScheduleId', 'bcsMapId'],
      limit: setPage,
      offset: pag, subQuery: false
    }).then(function(result){
        var totalData = result.count.length;  
        var pageCount = Math.ceil(totalData / setPage);
        res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };

  this.getAllStudents = function(req, res){
    var isWhere = {};
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );
    isWhere.subjectcategorydetail = language.buildLanguageQuery(
      isWhere.subjectcategorydetail, req.langId, '`subjectcategory`.`id`', models.subjectcategorydetail, 'subjectCategoryId'
    );

    models.examschedulesubjectcategory.belongsTo(models.subjectcategory, {foreignKey: 'subjectCategoryId'});
    models.subjectcategory.hasMany(models.subjectcategorydetail,{foreignKey: 'subjectCategoryId'});
    models.timetableallocation.belongsTo(models.timetable);
    models.tag.hasMany(models.tagdetail);
    Promise.all([
      models.tag.findAll({
        include:[{
          model: models.tagdetail, 
          where: isWhere.tagdetail, 
          attributes: ['title', 'description']
        }],
        attributes:['id'],
        where: {
          masterId: req.masterId, 
          type: 1, 
          is_active: 1
        },
        order: [['id']]
      }),
      models.mark.find({
        where:{
          masterId:req.masterId,
          examScheduleId:req.examScheduleId,
          bcsMapId:req.bcsMapId,
          subjectId:req.subjectId,
          exam_type:req.examtype
        }
      }),
      models.examscheduledetail.find({
        where:{
          examScheduleId:req.examScheduleId, 
          subjectId:req.subjectId, 
          masterId:req.masterId
        }
      }),
      models.timetableallocation.find({
        include: [{
          model: models.timetable, 
          where:{
            academicSessionId:req.academicSessionId, 
            bcsMapId:req.bcsMapId, 
            masterId:req.masterId
          }
        }], 
        where:{
          teacherId:req.userId, 
          subjectId:req.subjectId
        }
      })
    ]).then(function(result){
      if (req.user_type == 'teacher' && result[3] === null) {
        res({status:false, notassigned:'notassigned'});
      } else {
        models.examschedulesubjectcategory.findAll({
          include:[{
            model: models.subjectcategory,
            include:[{
              model: models.subjectcategorydetail,
              where:isWhere.subjectcategorydetail
            }] 
          }],
          where:{
            examScheduleId:req.examScheduleId,
            examScheduleDetailId:result[2].id
          }
        }).then(function(subcatresult){
          req.examdate = moment(result[2].date).format('YYYY-MM-DD');
          if(result[1]){
            req.markId = result[1].id;
            module.exports.withMarkRecord(req, function(withMark){
              res({status:true, students:withMark, markId:result[1].id, examscheduledetail:result[2], tagsData: result[0], examsubcats: subcatresult})
            });
          } else {
            module.exports.withOutMarkRecord(req, function(withOutMark){
              res({status:true, students:withOutMark, markId:null, examscheduledetail:result[2], tagsData: result[0], examsubcats: subcatresult})
            });
          }
        });
      }
    });
  };

  this.withMarkRecord = function(req, res){
    var isWhere = {};
    isWhere.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, '`student`.`id`', models.studentdetail, 'studentId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
    );
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );
    models.studentrecord.belongsTo(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.hasOne(models.markrecord);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.studentrecord.scope(
      { method: ['transferred', req.examdate]},
      { method: ['doa', '"'+req.examdate+'"']},
      { method: ['tc', '"'+req.examdate+'"', req.academicSessionId]}
    ).findAll({
      include: [{
        model:models.student, 
        attributes:['id','father_contact','enrollment_no', 'doa'],
        include:[{
          model:models.user, 
          attributes:['id','user_image'],
          include:[{
            model:models.userdetail, 
            attributes:['id', 'fullname'],
            where:isWhere.userdetail
          }], 
          where:{is_active:1}
        },{
          model:models.studentdetail, 
          attributes:['id','father_name'],
          where:isWhere.studentdetail
        },{
          model:models.markrecord,
          required:false,
          where:{
            markId:req.markId
          },
          attributes:['id', 'obtained_mark', 'subjectcategory_marks', 'tags']
        }]
      }],
      where: {
        masterId:req.masterId, 
        academicSessionId:req.academicSessionId, 
        bcsMapId:req.bcsMapId,
        /*record_status:1,
        $or: [
          {transferred: 0}, 
          {transferred: 1, transerred_effective_from: {$lt:req.examdate}}, 
          {transferred: 2, transerred_effective_from: {$lt:req.examdate}}
        ],
        doa: models.sequelize.literal('`student`.`doa` < "'+req.examdate+'" ')*/
      },
      attributes:['id', 'roll_no'],
      order: [
        ['roll_no', 'DESC'],
        [ models.student, 'id', 'ASC']
      ],
      subQuery:false
    }).then(function(students){
      res(students);
    }).catch(() => res({
      status:false, 
      error: true, 
      error_description: language.lang({key: "Internal Error", lang: req.lang}), 
      url: true
    }));
  };

  this.withOutMarkRecord = function(req, res){
    var isWhere = {};
    isWhere.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, '`student`.`id`', models.studentdetail, 'studentId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
    );
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );
    models.studentrecord.belongsTo(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.hasOne(models.markrecord);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.studentrecord.scope(
      { method: ['transferred', req.examdate]},
      { method: ['doa', '"'+req.examdate+'"']},
      { method: ['tc', '"'+req.examdate+'"', req.academicSessionId]}
    ).findAll({
      include: [{
        model:models.student, 
        attributes:['id','father_contact','enrollment_no'],
        include:[{
          model:models.user, 
          attributes:['id','user_image'],
          include:[{
            model:models.userdetail, 
            attributes:['id', 'fullname'],
            where:isWhere.userdetail
          }], 
          where:{is_active:1}
        },{
          model:models.studentdetail, 
          attributes:['id','father_name'],
          where:isWhere.studentdetail
        }]
      }],
      where: {
        masterId:req.masterId, 
        academicSessionId:req.academicSessionId, 
        bcsMapId:req.bcsMapId,
        /*record_status:1,
        $or: [
          {transferred: 0}, 
          {transferred: 1, transerred_effective_from: {$lt:req.examdate}}, 
          {transferred: 2, transerred_effective_from: {$lt:req.examdate}}
        ],
        doa: models.sequelize.literal('`student`.`doa` < "'+req.examdate+'" ')*/
      },
      attributes:['id', 'roll_no'],
      order: [
        ['roll_no', 'ASC'],
        [ models.student, 'id', 'ASC']
      ]
    }).then(function(students){
      res(students);
    }).catch(() => res({
      status:false, 
      error: true, 
      error_description: language.lang({key: "Internal Error", lang: req.lang}), 
      url: true
    }));
  };

  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var markrecordHasMany = models.mark.hasMany(models.markrecord, {as: 'markrecord'});
    var mark = models.mark.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
            mark.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }
            }).catch(callback);
        }
    ], function (err, errors) {
      if (err) {
        res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true});
      }
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          if (typeof req.id !== 'undefined' && req.id !== '') {
            models.markrecord.bulkCreate(req.markrecord,{
              updateOnDuplicate:['obtained_mark', 'tags', 'subjectcategory_marks'],
              ignoreDuplicates:true
            }).then(function(update){
              res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:update});
            }).catch(() => res({
              status:false, 
              error: true, 
              error_description: language.lang({key: "Internal Error", lang: req.lang}), 
              url: true
            }));
          } else {
            models.mark.create(req, {include:[markrecordHasMany]}).then(function(data){
              module.exports.notification({masterId:req.masterId, lang:req.lang, markId:data.id, senderId:req.senderId, langId:req.langId});
              res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
            }).catch(() => res({
              status:false, 
              error: true, 
              error_description: language.lang({key: "Internal Error", lang: req.lang}), 
              url: true
            }));
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

  this.getScheduleExam  = function(req, res){
    models.examschedule.belongsTo(models.examhead);
    models.examhead.hasMany(models.examheaddetail);
    models.examschedule.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.examschedule.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    var isWhere = {};
    isWhere.examheaddetail = language.buildLanguageQuery(
       isWhere.examheaddetail, req.langId, '`examhead`.`id`', models.examheaddetail, 'examheadId'
    );
    isWhere.boarddetail = language.buildLanguageQuery(
       isWhere.boarddetail, req.langId, '`board`.`id`', models.boarddetail, 'boardId'
    );
    isWhere.classesdetail = language.buildLanguageQuery(
       isWhere.classesdetail, req.langId, '`class`.`id`', models.classesdetail, 'classId'
    );     
    
    let where = {masterId:req.masterId, academicSessionId:req.academicSessionId, is_active:1};
    if (req.user_type === 'teacher') {
      where.teacher = models.sequelize.literal(
        '(SELECT COUNT(*) FROM `timetables` INNER JOIN `timetable_allocations` \
        ON `timetables`.`id` = `timetable_allocations`.`timetableId` AND `teacherId` = '
        + JSON.stringify(parseInt(req.userTypeId))
        + ' AND `timetables`.`is_active` = 1 AND `timetables`.`academicSessionId` = '
        + JSON.stringify(parseInt(req.academicSessionId))
        + ' AND `timetables`.`masterId` = '
        + JSON.stringify(parseInt(req.masterId))
        + ' INNER JOIN `bcs_maps` ON `timetables`.`bcsMapId` = `bcs_maps`.`id`'
        + ' WHERE `examschedule`.`classId` =  `bcs_maps`.`classId`'
        + ' AND `examschedule`.`boardId` =  `bcs_maps`.`boardId`)'
      );
    }

    models.examschedule.findAll({
       include: [
          {model:models.examhead, include:[{model:models.examheaddetail, where:isWhere.examheaddetail}]},
          {model:models.board, include:[{model:models.boarddetail, where:isWhere.boarddetail}]},
          {model:models.classes, include:[{model:models.classesdetail, where:isWhere.classesdetail}]}
       ],
       order: [
          ['id', 'ASC']
       ],
       where,
       attributes: ['id']
    }).then(function(data){
       res({status:true, data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getSectionAndSubjects = function(req, res){
    module.exports.getSection(req, function(sections){
       module.exports.getSubject(req, function(subjects){
          res({status:true, message:language.lang({key:"examSchedule", lang:req.lang}), data:{sections:sections, subjects:subjects}});
       });
    });
  };

   this.getSection = function(req, res){
      models.bcsmap.belongsTo(models.section);
      models.section.hasMany(models.sectiondetail);
      var isWherelang = {};
      isWherelang.sectiondetail = language.buildLanguageQuery(
         isWherelang.sectiondetail, req.langId, '`section`.`id`', models.sectiondetail, 'sectionId'
      );
      var isWhere ={};
      models.sequelize.query("select group_concat(bcs_maps.id) as bcsMapIds from bcs_maps INNER JOIN exam_schedules where exam_schedules.masterId = ? and exam_schedules.academicSessionId = ? and exam_schedules.id = ? and  bcs_maps.classId = exam_schedules.classId and bcs_maps.boardId = exam_schedules.boardId", {replacements:[req.masterId,req.academicSessionId, req.examScheduleId], type: models.sequelize.QueryTypes.SELECT} ).then(function(bcsIdList) {
         if(bcsIdList[0].bcsMapIds !== null){
            var ids = bcsIdList[0].bcsMapIds.split(',');
            isWhere['id'] = {$in:ids};
         }
         models.bcsmap.findAll({
            include:[
               {model:models.section, include:[{model:models.sectiondetail, where:isWherelang.sectiondetail}]},
            ],
            where:isWhere,
            order: [
               [ models.section, models.sectiondetail, 'name', 'ASC'],
            ],
         }).then(function(sections){
            res(sections);
         }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      });
   };

   this.getSubject = function(req, res){
      models.examscheduledetail.belongsTo(models.subject);
      models.subject.hasMany(models.subjectdetail);
      var isWherelang = {};
      isWherelang.subjectdetail = language.buildLanguageQuery(
         isWherelang.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
      );
      models.examscheduledetail.findAll({
         include:[
            {model:models.subject, include:[{model:models.subjectdetail, where:isWherelang.subjectdetail}]}
         ],
         where:{examScheduleId:req.examScheduleId},
         order: [
            [ models.subject, models.subjectdetail, 'name', 'ASC'],
         ],
      }).then(function(subjects){
         res(subjects);
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
   };

   this.viewSubjects = function(req, res){
      models.mark.belongsTo(models.subject);
      models.subject.hasMany(models.subjectdetail);
      var isWherelang = {};
      isWherelang.subjectdetail = language.buildLanguageQuery(
         isWherelang.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
      );
      var isWhere = {examScheduleId:req.examScheduleId, bcsMapId:req.bcsMapId, masterId:req.masterId, academicSessionId:req.academicSessionId};
      if (req.user_type === 'teacher') {
      models.sequelize.query("select group_concat(timetable_allocations.subjectId) as subjectIds from timetable_allocations INNER JOIN timetables where timetable_allocations.timetableId = timetables.id and timetables.masterId = ? and timetables.academicSessionId = ? and timetables.bcsMapId = ? and timetable_allocations.teacherId = ?",
    {replacements:[req.masterId,req.academicSessionId, req.bcsMapId, req.userId], type: models.sequelize.QueryTypes.SELECT} )
    .then(function(subjectIdList) {
      if(subjectIdList[0].subjectIds !== null){
        var ids = subjectIdList[0].subjectIds.split(',');
        isWhere['subjectId'] = {$in:ids};
        models.mark.findAll({
            include:[{
              model:models.subject, 
              attributes:['id'], 
              include:[{
                model:models.subjectdetail, 
                attributes:['id', 'name'], 
                where:isWherelang.subjectdetail
              }]
            }],
            order: [
              [models.subject, models.subjectdetail, 'name', 'ASC'],
            ],
            attributes:['id', 'exam_type'],
            where:isWhere
         }).then(function(result){
            res({data:result});
         });
      } else {
        res({data: []});
      }
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      } else {
         models.mark.findAll({
            include:[{
              model:models.subject, 
              attributes:['id'], 
              include:[{
                model:models.subjectdetail, 
                attributes:['id', 'name'], 
                where:isWherelang.subjectdetail
              }]
            }],
            attributes:['id', 'exam_type'],
            where:isWhere
         }).then(function(result){
            res({data:result});
         }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }
   };

   this.getById = function(req, res){
    var isWhere = {};
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );
    isWhere.subjectdetail = language.buildLanguageQuery(
       isWhere.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
    );
    isWhere.examheaddetail = language.buildLanguageQuery(
       isWhere.examheaddetail, req.langId, '`examschedule.examhead`.`id`', models.examheaddetail, 'examheadId'
    );
    isWhere.boarddetail = language.buildLanguageQuery(
       isWhere.boarddetail, req.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
    );
    isWhere.classesdetail = language.buildLanguageQuery(
       isWhere.classesdetail, req.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
    );
    isWhere.sectiondetail = language.buildLanguageQuery(
     isWhere.sectiondetail, req.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
    );

    isWhere.subjectcategorydetail = language.buildLanguageQuery(
      isWhere.subjectcategorydetail, req.langId, '`subjectcategory`.`id`', models.subjectcategorydetail, 'subjectCategoryId'
    );

    models.examschedulesubjectcategory.belongsTo(models.subjectcategory, {foreignKey: 'subjectCategoryId'});
    models.subjectcategory.hasMany(models.subjectcategorydetail,{foreignKey: 'subjectCategoryId'});
    
    models.tag.hasMany(models.tagdetail);
    models.mark.belongsTo(models.examschedule, {foreignKey: 'examScheduleId'});
    models.examschedule.belongsTo(models.examhead);
    models.examhead.hasMany(models.examheaddetail);
    models.mark.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);

    models.mark.belongsTo(models.bcsmap, {foreignKey: 'bcsMapId'});
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);

    Promise.all([
      models.tag.findAll({
        include:[{
          model: models.tagdetail, 
          where: isWhere.tagdetail, 
          attributes: ['title', 'description']
        }],
        attributes:['id'],
        where: {
          masterId: req.masterId, 
          type: 1, 
          is_active: 1
        },
        order: [['id']]
      }),
      models.mark.find({
        include:[{
          model: models.examschedule, 
          attributes:['id'], 
          include:[{
            model: models.examhead, 
            attributes:['id'], 
            include:[{
              model: models.examheaddetail, 
              attributes:['id', 'name'], 
              where:isWhere.examheaddetail, 
            }]
          }]
        },{
          model:models.subject, 
          attributes:['id'], 
          include:[{
            model:models.subjectdetail, 
            attributes:['id', 'name'], 
            where:isWhere.subjectdetail
          }]
        },{
          model: models.bcsmap, 
          attributes:['id'],
          include:[{
            model: models.board, 
            attributes:['id'], 
            include:[{
              model: models.boarddetail, 
              where:isWhere.boarddetail, 
              attributes:['id', 'name', 'alias']
            }]
          },{
            model: models.classes, 
            attributes:['id'],
            include:[{
              model: models.classesdetail, 
              where:isWhere.classesdetail, 
              attributes:['id', 'name']
            }]
          },{
            model: models.section, 
            attributes:['id'], 
            include:[{
              model: models.sectiondetail, 
              where:isWhere.sectiondetail,
              attributes:['id', 'name']
            }]
          }]
        }],
        where:{
          id:req.id,
          academicSessionId:req.academicSessionId,
          masterId:req.masterId
        }
      })
    ]).then(function(result){
      if(result[1]){
        req.markId = result[1].id;
        models.examscheduledetail.find({
          where:{
            examScheduleId:result[1].examScheduleId, 
            subjectId:result[1].subjectId, 
            masterId:req.masterId
          }
        }).then(function(examscheduledetail){
          req.bcsMapId = result[1].bcsMapId;
          req.examdate = moment(examscheduledetail.date).format('YYYY-MM-DD');
          models.examschedulesubjectcategory.findAll({
            include:[{
              model: models.subjectcategory,
              include:[{
                model: models.subjectcategorydetail,
                where:isWhere.subjectcategorydetail
              }] 
            }],
            where:{
              examScheduleId:examscheduledetail.examScheduleId,
              examScheduleDetailId:examscheduledetail.id
            }
          }).then(function(subcatresult){
            module.exports.withMarkRecord(req, function(withMark){
              res({
                status:true, 
                students:withMark,
                markdata:result[1],
                markId:result[1].id, 
                examscheduledetail:examscheduledetail, 
                tagsData: result[0],
                examsubcats:subcatresult
              });
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
      } else {
        res({
          status:false, 
          error: true, 
          error_description: language.lang({key: "Internal Error", lang: req.lang}), 
          url: true
        });
      }
    });
  };

  this.view = function(req, res){
    models.mark.hasMany(models.markrecord);
    models.markrecord.belongsTo(models.student);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.student.hasMany(models.studentdetail);
    models.student.hasOne(models.studentrecord);

    models.mark.belongsTo(models.examschedule, {foreignKey: 'examScheduleId'});
    models.examschedule.belongsTo(models.examhead);
    models.examhead.hasMany(models.examheaddetail);
    models.mark.belongsTo(models.bcsmap, {foreignKey: 'bcsMapId'});
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    
    var isWherelang = {};
    isWherelang.userdetail = language.buildLanguageQuery(
       isWherelang.userdetail, req.langId, '`markrecords.student.user`.`id`', models.userdetail, 'userId'
    );
    isWherelang.studentdetail = language.buildLanguageQuery(
       isWherelang.studentdetail, req.langId, '`markrecords.student`.`id`', models.studentdetail, 'studentId'
    );
    isWherelang.boarddetail = language.buildLanguageQuery(
       isWherelang.boarddetail, req.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
    );
    isWherelang.classesdetail = language.buildLanguageQuery(
       isWherelang.classesdetail, req.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
    );
    isWherelang.sectiondetail = language.buildLanguageQuery(
       isWherelang.sectiondetail, req.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
    );
    isWherelang.examheaddetail = language.buildLanguageQuery(
       isWherelang.examheaddetail, req.langId, '`examschedule.examhead`.`id`', models.examheaddetail, 'examheadId'
    );
    isWherelang.tagdetail = language.buildLanguageQuery(
       isWherelang.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );

    models.mark.findAll({
      include:[{
        model:models.markrecord,
        include: [{
          model:models.student, 
          attributes:['id','father_contact','enrollment_no'],
          include:[{
            model:models.user, 
            attributes:['id','user_image'],
            include:[{
              model:models.userdetail, 
              attributes:['id', 'fullname'],
              where:isWherelang.userdetail
            }], 
            where:{is_active:1}
          },{
            model:models.studentdetail, 
            attributes:['id','father_name'],
            where:isWherelang.studentdetail
          },{
            model: models.studentrecord, 
            attributes: ['roll_no'], 
            where: {
              academicSessionId: req.academicSessionId, 
              bcsMapId:req.bcsMapId,
              masterId:req.masterId,
            }
          }],
        }],
        group:['studentId'],
      },{
        model: models.bcsmap, 
        attributes:['id'],
        include:[{
          model: models.board, 
          attributes:['id'], 
          include:[{
            model: models.boarddetail, 
            where:isWherelang.boarddetail, 
            attributes:['id', 'name', 'alias']
          }]
        },{
          model: models.classes, 
          attributes:['id'], 
          include:[{
            model: models.classesdetail, 
            where:isWherelang.classesdetail, 
            attributes:['id', 'name']
          }]
        },{
          model: models.section, 
          attributes:['id'], 
          include:[{
            model: models.sectiondetail, 
            where:isWherelang.sectiondetail, 
            attributes:['id', 'name']
          }]
        }]
      },{
        model: models.examschedule, 
        attributes:['id'], 
        include:[{
          model: models.examhead, 
          attributes:['id'], 
          include:[{
            model: models.examheaddetail, 
            attributes:['id', 'name'], 
            where:isWherelang.examheaddetail
          }]
        }]
      }],
      attributes:['id', 'examScheduleId', 'bcsMapId'],
      where:{
        examScheduleId:req.examScheduleId, 
        bcsMapId:req.bcsMapId, 
        academicSessionId:req.academicSessionId, 
        masterId:req.masterId
      },
      order: [
        [models.markrecord, models.student, models.studentrecord, 'roll_no', 'ASC']
      ]
    }).then(function(result){
       res({data:result});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

   this.viewMark = function(req, res){
      models.mark.hasMany(models.markrecord);
      models.mark.belongsTo(models.subject);
      models.subject.hasMany(models.subjectdetail);

      models.mark.belongsTo(models.examschedule, {foreignKey: 'examScheduleId'});
      models.examschedule.hasMany(models.examscheduledetail, {foreignKey: 'examScheduleId'});
      models.examscheduledetail.hasMany(models.examschedulesubjectcategory, {foreignKey: 'examScheduleDetailId'});
      models.examschedulesubjectcategory.belongsTo(models.subjectcategory, {foreignKey:'subjectCategoryId'});
      models.subjectcategory.hasMany(models.subjectcategorydetail, {foreignKey:'subjectCategoryId'});
      var isWherelang = {};
      isWherelang.subjectdetail = language.buildLanguageQuery(
         isWherelang.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
      );

      isWherelang.subjectdetail = language.buildLanguageQuery(
         isWherelang.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
      );
      models.mark.findAll({
        include:[{
          model:models.markrecord, 
          where:{
            studentId:req.studentId
          }
        },{
          model:models.subject, 
          attributes:['id'], 
          include:[{
            model:models.subjectdetail, 
            attributes:['id', 'name'], 
            where:isWherelang.subjectdetail
          }]
        },{
          model:models.examschedule,
          attributes:['id'],
          required:false,
          include:[{
            model:models.examscheduledetail,
            attributes:['id'],
            required:false,
            include:[{
              model:models.examschedulesubjectcategory,
              attributes:['id', 'max_marks'],
              required:false,
              include:[{
                model:models.subjectcategory,
                attributes:['id'],
                required:false,
                include:[{
                  model:models.subjectcategorydetail,
                  attributes:['name'],
                  required:false,
                }]
              }]
            }],
            where:{
              subjectId:{
                $eq: models.sequelize.literal('`mark`.`subjectId`')
              }
            }
          }]
        }],
        attributes:['id', 'min_passing_mark', 'max_mark', 'exam_type'],
        where:{
          examScheduleId:req.examScheduleId, 
          bcsMapId:req.bcsMapId, 
          masterId:req.masterId, 
          academicSessionId:req.academicSessionId
        }
      }).then(function(result){
        res({data:result});
      })
   };

   this.notification = function(data){
    models.mark.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    models.mark.belongsTo(models.examschedule);
    models.examschedule.belongsTo(models.examhead);
    models.examhead.hasMany(models.examheaddetail);
    var isWhere = {};
    isWhere.subjectdetail = language.buildLanguageQuery(
       isWhere.subjectdetail, data.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
    );
    isWhere.examheaddetail = language.buildLanguageQuery(
       isWhere.examheaddetail, data.langId, '`examschedule.examhead`.`id`', models.examheaddetail, 'subjectId'
    );
    models.mark.find({
      include:[{
        model:models.subject,
        attributes:['id'],
        include:[{
          model:models.subjectdetail,
          attributes:['id', 'name'],
          where:isWhere.subjectdetail
        }]
      },{
        model: models.examschedule, 
        attributes:['id'], 
        include:[{
          model: models.examhead, 
          attributes:['id'], 
          include:[{
            model: models.examheaddetail, 
            attributes:['id', 'name'], 
            where:isWhere.examheaddetail
          }]
        }]
      }],
      where:{id:data.markId},
      attributes:['id', 'bcsMapId', 'academicSessionId']
    }).then(function(result){
      Promise.all([
        notification.getStudentsByBcsmapId(result.bcsMapId, result.academicSessionId),
        notification.getParentByBcsmapId(result.bcsMapId, result.academicSessionId)
      ]).then(function(deviceIds){
        var notiData = {};
        notiData.lang = data.lang;
        notiData.subject = result.subject.subjectdetails[0].name;
        notiData.exam = result.examschedule.examhead.examheaddetails[0].name;
        notification.send(deviceIds[0], 'front/notification/exam_marks/student', notiData, {masterId:data.masterId, senderId:data.senderId, data:{type:'exam_mark'}});
        notification.send(deviceIds[1], 'front/notification/exam_marks/parent', notiData, {masterId:data.masterId, senderId:data.senderId, data:{type:'exam_mark'}})
      });
    });
   }
}

module.exports = new Mark();