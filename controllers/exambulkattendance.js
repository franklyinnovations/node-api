var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');

function Exambulkattendance() {

  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var ebaHasMany = models.exambulkattendance.hasMany(models.exambulkattendancedetail, {as: 'exambulkattendance_detail'});
    var exambulkattendance = models.exambulkattendance.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
            exambulkattendance.validate().then(function (err) {
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
            Promise.all([
              models.exambulkattendance.update({
                total: req.total
              },{
                where: {
                  id: req.id
                }
              }),
              models.exambulkattendancedetail.bulkCreate(req.exambulkattendance_detail,{
                updateOnDuplicate:['present_days'],
                ignoreDuplicates:true
              })
            ]).then(function(update){
              res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:update[1]});
            }).catch(() => res({
              status:false, 
              error: true, 
              error_description: language.lang({key: "Internal Error", lang: req.lang}), 
              url: true
            }));
          } else {
            models.exambulkattendance.create(req, {include:[ebaHasMany]}).then(function(data){
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
    var isWhere = {};
    var orderBy = '';
    if (req.query) {
      var responseData = {};
      responseData.exambulkattendance = {masterId:reqData.masterId, academicSessionId: reqData.academicSessionId};
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

    models.exambulkattendance.belongsTo(models.bcsmap);
    models.exambulkattendance.belongsTo(models.examhead);
    models.examhead.hasMany(models.examheaddetail);
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);

    isWhere.boarddetail = language.buildLanguageQuery(
      isWhere.boarddetail, reqData.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
    );
    isWhere.classesdetail = language.buildLanguageQuery(
      isWhere.classesdetail, reqData.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
    );
    isWhere.sectiondetail = language.buildLanguageQuery(
      isWhere.sectiondetail, reqData.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
    );
    isWhere.examheaddetail = language.buildLanguageQuery(
      isWhere.examheaddetail, reqData.langId, '`examhead`.`id`', models.examheaddetail, 'examheadId'
    );
    models.exambulkattendance.findAndCountAll({
      include: [{
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
      },{
        model: models.examhead,
        attributes:['id'],
        required: ((req.query.examheaddetail__name !== undefined)?true:false),
        include:[{
          model: models.examheaddetail,
          attributes:['id', 'name'],
          required: ((req.query.examheaddetail__name!== undefined)?true:false),
          where:isWhere.examheaddetail,
        }]
      }],
      where: isWhere.exambulkattendance,
      distinct: true,
      order: [
        ['id', 'DESC']
      ],
      limit: setPage,
      offset: pag,
      subQuery: false
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    }).catch(() => res({
      status:false, 
      error: true, 
      error_description: language.lang({key: "Internal Error", lang: req.lang}), 
      url: true
    }));
  };

  this.getById = function(req, res){
    models.exambulkattendance.find({
      where:{
        id: req.id,
        academicSessionId: req.academicSessionId,

      }
    }).then(function(result){
      req.bcsMapId = result.bcsmapId;
      req.exambulkattendanceId = result.id;
      module.exports.withRecord(req, function(students){
        res({
          status:true, 
          students:students,
          exambulkattendancedata:result,
          exambulkattendanceId:result.id,
        });
      });
    });
  };

  this.getAllStudents = function(req, res){
    models.exambulkattendance.find({
      where:{
        masterId: req.masterId,
        examheadId: (req.pattern == 1 ? req.examheadId : null),
        month: (req.pattern == 2 ? req.month : null),
        pattern: req.pattern,
        bcsMapId: req.bcsMapId,
        academicSessionId: req.academicSessionId,
      }
    }).then(function(result){
      if(result){
        req.exambulkattendanceId = result.id;
        module.exports.withRecord(req, function(students){
          res({
            status:true,
            students:students,
            exambulkattendanceId:result.id,
            exambulkattendancedata:result
          })
        });
      } else {
        module.exports.withOutRecord(req, function(students){
          res({status:true, students:students, exambulkattendanceId:null})
        });
      }
    });
  };

  this.withRecord = function(req, res){
    var isWhere = {};
    isWhere.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, '`student`.`id`', models.studentdetail, 'studentId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
    );
    models.studentrecord.belongsTo(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.hasMany(models.exambulkattendancedetail);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.studentrecord.scope(
      { method: ['transferred', moment().format('YYYY-MM-DD')]},
      { method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
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
          model:models.exambulkattendancedetail,
          required:false,
          where:{
            exambulkattendanceId:req.exambulkattendanceId
          },
          attributes:['id', 'exambulkattendanceId', 'studentId', 'present_days']
        }]
      }],
      where: {
        masterId:req.masterId, 
        academicSessionId:req.academicSessionId, 
        bcsMapId:req.bcsMapId,
        /*record_status:1,
        $or: [
              {transferred: 0}, 
              {transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}}, 
              {transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
            ],*/
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

  this.withOutRecord = function(req, res){
    var isWhere = {};
    isWhere.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, '`student`.`id`', models.studentdetail, 'studentId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
    );
    models.studentrecord.belongsTo(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.studentrecord.scope(
      { method: ['transferred', moment().format('YYYY-MM-DD')]},
      { method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
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
              {transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}}, 
              {transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
            ],*/
      },
      attributes:['id', 'roll_no'],
      order: [
        ['roll_no', 'ASC'],
        [ models.student, 'id', 'DESC']
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

  this.getExams = function(req, res){
    models.examschedule.belongsTo(models.examhead);
    models.examhead.hasMany(models.examheaddetail);
    var isWhere = {};
    isWhere.examheaddetail = language.buildLanguageQuery(
      isWhere.examheaddetail, req.langId, '`examhead`.`id`', models.examheaddetail, 'examheadId'
    );
    models.examschedule.findAll({
      include: [{
        model: models.examhead,
        include: [{
          model: models.examheaddetail,
          where: isWhere.examheaddetail
        }]
      }],
      where: {
        masterId: req.masterId,
        academicSessionId: req.academicSessionId,
        boardId: req.boardId,
        classId: req.classId,
        is_active: 1,
      }
    }).then(function(exams){
      res({exams:exams});
    }).catch(() => res({
      status:false, 
      error: true, 
      error_description: language.lang({key: "Internal Error", lang: req.lang}), 
      url: true
    }));
  }
}

module.exports = new Exambulkattendance();
