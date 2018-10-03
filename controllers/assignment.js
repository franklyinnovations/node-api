var async = require('async');
const models = require('../models');
var language = require('./language');
var fs = require('fs');
var moment = require('moment');
var notification = require('./notification');
var utils = require('./utils');

models.assignmentremark.belongsTo(models.student);
models.student.belongsTo(models.user);

function assignment() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var assignmentHasOne = models.assignment.hasOne(models.assignmentdetail, {as: 'assignmentdetails'});
    req.assignmentdetails.languageId = req.langId;
    req.assignmentdetails.masterId = req.masterId;
    var assignment = models.assignment.build(req);
    var assignmentDetails = models.assignmentdetail.build(req.assignmentdetails);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
            assignment.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            assignmentDetails.validate().then(function (err) {
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
          if (typeof req.id !== 'undefined' && req.id !== '') {
            req.assignmentdetails.assignmentId = req.id;
            models.assignment.update(req,{where: {id:req.id}, individualHooks: true}).then(function(data){
              models.assignmentdetail.find({where:{assignmentId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.assignmentdetails.id = resultData.id;
                  models.assignmentdetail.update(req.assignmentdetails, {where:{id:resultData.id, assignmentId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:req});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.assignmentdetails.id;
                  models.assignmentdetail.create(req.assignmentdetails).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:req});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              });
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.assignmentdetails.languageId);
            models.assignment.create(req, {include: [assignmentHasOne], individualHooks: true}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.assignmentdetails.assignmentId = data.id;
                req.assignmentdetails.languageId = 1;
                models.assignmentdetail.create(req.assignmentdetails).then(function(){
                  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
              }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
      responseData.assignment  = {};
      if (reqData.masterId !==1) {
        if(reqData.userType == 'teacher'){
          responseData.assignment.userId = reqData.userId;
          responseData.assignment.masterId = reqData.masterId;
        }else{
          responseData.assignment.masterId = reqData.masterId;
        }
      }
      responseData.assignment.academicSessionId = reqData.academicSessionId;
      async.forEach(Object.keys(req.query), function (item, callback) {
        if (req.query[item] !== ''){
          var modelKey = item.split('__');
          if(typeof responseData[modelKey[0]] =='undefined'){
            var col = {};
            if (modelKey.length === 3) {
               if(modelKey[2] === 'gte'){
                 col[modelKey[1]] = {$gte: req.query[item]};
               }else{
                 col[modelKey[1]] = req.query[item];
               }
            } else {
              col[modelKey[1]] = {$like: '%' + req.query[item] + '%'};
            }
            responseData[modelKey[0]] = col;
          } else {
            if (modelKey.length === 3) {
              responseData[modelKey[0]][modelKey[1]] = req.query[item];
            } else {
              responseData[modelKey[0]][modelKey[1]] = {$like: '%' + req.query[item] + '%'};
            }
          }
        }
        callback();
      }, function () {
        isWhere = responseData;
      });
    }
    
    //isWhere['delete'] = 1;
    orderBy = 'id DESC';

    models.assignment.hasMany(models.assignmentdetail);
    models.assignment.belongsTo(models.bcsmap,{foreignKey: 'bcsMapId'});
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    models.assignment.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    
    isWhere.assignmentdetail = language.buildLanguageQuery(
      isWhere.assignmentdetail, reqData.langId, 'assignment.id', models.assignmentdetail, 'assignmentId'
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
    isWhere.subjectdetail = language.buildLanguageQuery(
      isWhere.subjectdetail, reqData.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
    );

    models.assignment.findAndCountAll({
      include: [
        {model: models.assignmentdetail, where:isWhere.assignmentdetail},
        {model: models.bcsmap,
           include: [{model: models.board, attributes:['id'],
             include: [{model: models.boarddetail,
               attributes:['id', 'name', 'alias'],
               where:isWhere.boarddetail
             }]
           },{model: models.classes, attributes:['id'],
             include: [{model: models.classesdetail,
               attributes:['id', 'name'],
               where:isWhere.classesdetail
             }]
           },{model: models.section, attributes:['id'],
             include: [{model: models.sectiondetail,
               attributes:['id', 'name'],
               where:isWhere.sectiondetail
             }]
           }],
        },
        {model: models.subject, attributes:['id'],
          include:[
            {model: models.subjectdetail, attributes:['id', 'name'], where:isWhere.subjectdetail}
          ]
        }
      ],
      where: isWhere.assignment,
      order: [
        ['id', 'DESC']
      ],
      distinct: true,
      limit: setPage,
      offset: pag, subQuery: false
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({status:true, message:language.lang({key:"assignmentList", lang:req.lang}),data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.assignment.hasMany(models.assignmentdetail);
    var isWhere = {};
    isWhere = language.buildLanguageQuery(
      isWhere, req.langId, '`assignment`.`id`', models.assignmentdetail, 'assignmentId'
    );
    models.assignment.find({
      include: [{model: models.assignmentdetail,
      where:isWhere}],
      where:{
        id:req.id,
        masterId: req.masterId
      }
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.assignment.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      if(req.assignment_status == 'Published'){
        module.exports.notification(req);
        var msgKey = "publishedSuccessfully";
      }else if(req.assignment_status == 'Canceled'){
        var msgKey = "cancelledSuccessfully";
      }else{
        var msgKey = "updatedSuccessfully";
      }
      res({status:true, message:language.lang({key:msgKey, lang:req.lang}), data:data});
    });
  };

  /*
   * delete data
  */
 this.delete = function(req, res) {
   models.assignment.find({
     where: {
         id: req.id,
         masterId: req.masterId
     }
   }).then(function (result) {
    if(result !== null){
     if(result.assignment_file !== null){
       path = result.assignment_file;
       try{
        fs.unlinkSync(path);
       }catch(err){
       }
     }
     models.assignmentdetail.destroy({//Delete From Associate model assignmentdetail
         where: {
           assignmentId: req.id
         }
     }).then(function (data) {
         models.assignment.destroy({//Delete From main model assignment
             where: {
                id: req.id
             }
         }).then(function (data) {
             res({status:true, message:language.lang({key:"deletedSuccessfully", lang:req.lang}), data:data});
         }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
     }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
   }else{
      res({status:true, message:language.lang({key:"No Record Found", lang:req.lang}), data:[]});
   } 
   }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getAllStudents = function(req, res){
    var iswhere_enroll = {};
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`student.user`.`id`', models.userdetail, 'userId'
    );
    isWhere.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, '`student`.`id`', models.studentdetail, 'studentId'
    );
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );

    if(typeof req.enrollment_no !== 'undefined' && req.enrollment_no !== ''){
      iswhere_enroll['enrollment_no'] = {$like: '%'+req.enrollment_no+'%'};
    }
    if(typeof req.name !== 'undefined' && req.name !== ''){
      isWhere.userdetail['fullname'] = {$like: '%'+req.name+'%'};
    }
    
    models.studentrecord.belongsTo(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.hasOne(models.assignmentremark);
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.tag.hasMany(models.tagdetail);

    models.assignment.find({
      where:{id:req.assignmentId}
    }).then(function(assignmentData){
      Promise.all([
        models.studentrecord.scope(
          { method: ['transferred', moment(assignmentData.end_date).format('YYYY-MM-DD')]},
          { method: ['doa', '"'+moment(assignmentData.end_date).format('YYYY-MM-DD')+'"']},
          { method: ['tc', '"'+moment(assignmentData.end_date).format('YYYY-MM-DD')+'"', req.academicSessionId]}
        ).findAll({
          include: [{
            model:models.student, 
            attributes:['id','father_contact','enrollment_no'],
            include:[{model:models.user, 
              attributes:['id','user_image'],
              where:{'is_active':1},
              include:[{
                model:models.userdetail, 
                attributes:['id', 'fullname'],
                where:isWhere.userdetail
              }]
            },{
              model:models.studentdetail, 
              attributes:['id','father_name'],
              where:isWhere.studentdetail
            },{
              model:models.assignmentremark,
              required:false,
              where:{
                assignmentId:req.assignmentId
              }
            }],
            where:iswhere_enroll
          }],
          where: {
            masterId:req.masterId, 
            academicSessionId:req.academicSessionId, 
            bcsMapId:req.bcsMapId,
            /*record_status:1,
            $or: [
              {transferred: 0}, 
              {transferred: 1, transerred_effective_from: {$lt:moment(assignmentData.end_date).format('YYYY-MM-DD')}}, 
              {transferred: 2, transerred_effective_from: {$lt:moment(assignmentData.end_date).format('YYYY-MM-DD')}}
            ],
            doa: models.sequelize.literal('`student`.`doa` < "'+moment(assignmentData.end_date).format('YYYY-MM-DD')+'" ')*/
          },
          attributes:['id', 'bcsMapId', 'roll_no'],
          order: [
            ['id', 'DESC']
          ]
        }),
        models.tag.findAll({
          include:[{
            model: models.tagdetail, 
            where: isWhere.tagdetail,
            attributes: ['description', 'title']
          }],
          where: {
            masterId: req.masterId, 
            type: 3, 
            is_active: 1
          },
          order: [['id']]
        })
      ]).then(function(data){
        res({status:true, data:data[0], tagsData:data[1]});
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

  /* Assignment Remarks Update*/
  /*
   * save Remarks
  */
  this.saveRemark  = function(req, res) {
    models.assignmentremark.bulkCreate(req.assignmentremark, {
      updateOnDuplicate:['tags']
    })
    .then(() => models.assignmentremark.count({
        include:
        [
          {
            model: models.student,
            include:
            [
              {
                model: models.user,
                where: {
                  is_active: 1,
                }
              }
            ]
          },
        ],
        where: {assignmentId:req.assignmentId, tags:{$eq: ''}},
      }))
      .then(count => {
        if (count === 0) {
          module.exports.notificationRemarks({assignmentId:req.assignmentId, langId:req.langId, lang:req.lang, senderId:req.updateById});
          return models.assignment.update({assignment_status:'Completed', reviewedAt: req.reviewedAt},{where:{id:req.assignmentId}});
        } else {
          return true;
        }
      })
    .then(function(){
      res({status:true, message:language.lang({key:"remarkAddedSuccessfully", lang:req.lang})});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.notification = function(req){
    var isWhere = {};
    models.assignment.hasMany(models.assignmentdetail);
    models.assignment.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    isWhere.assignmentdetail = language.buildLanguageQuery(
      isWhere.assignmentdetail, req.langId, 'assignment.id', models.assignmentdetail, 'assignmentId'
    );
    isWhere.subjectdetail = language.buildLanguageQuery(
      isWhere.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
    );
    models.assignment.find({
      include:[{
        model:models.assignmentdetail,
        attributes:['id', 'title'],
        where:isWhere.assignmentdetail
      },{
        model:models.subject,
        attributes:['id'],
        include:[{
          model:models.subjectdetail,
          attributes:['id', 'name'],
          where:isWhere.subjectdetail
        }]
      }],
      attributes:['id', 'bcsMapId', 'academicSessionId', 'end_date', 'masterId'],
      where:{id:req.id}
    }).then(function(data){
      var bcsMapId = [data.bcsMapId];
      Promise.all([
        notification.getStudentsByBcsmapId(bcsMapId, data.academicSessionId),
        notification.getParentByBcsmapId(bcsMapId, data.academicSessionId)
      ]).then(function(result){
        var notiData = {};
        notiData.end_date = data.end_date;
        notiData.name = data.assignmentdetails[0].title;
        notiData.subject = data.subject.subjectdetails[0].name;
        notiData.moment = moment;
        notification.send(result[0], 'front/notification/assignment/student', notiData, {masterId:data.masterId, senderId:req.updateById, data:{type:'assignment'}}).then(function(){
          notification.send(result[1], 'front/notification/assignment/parent', notiData, {masterId:data.masterId, senderId:req.updateById, data:{type:'assignment'}});
        });
      });
    });
  };

  this.notificationRemarks = function(req){
    var isWhere = {};
    models.assignment.hasMany(models.assignmentdetail);
    isWhere.assignmentdetail = language.buildLanguageQuery(
      isWhere.assignmentdetail, req.langId, 'assignment.id', models.assignmentdetail, 'assignmentId'
    );
    models.assignment.find({
      include:[{
        model:models.assignmentdetail,
        attributes:['id', 'title'],
        where:isWhere.assignmentdetail
      }],
      attributes:['id', 'bcsMapId', 'academicSessionId', 'masterId'],
      where:{id:req.assignmentId}
    }).then(function(data){
      var bcsMapId = [data.bcsMapId];
      Promise.all([
        notification.getStudentsByBcsmapId(bcsMapId, data.academicSessionId),
        notification.getParentByBcsmapId(bcsMapId, data.academicSessionId)
      ]).then(function(result){
        var notiData = {};
        notiData.name = data.assignmentdetails[0].title;
        notiData.moment = moment;
        notification.send(result[0], 'front/notification/assignmentremark/student', notiData, {masterId:data.masterId, senderId:req.senderId, data:{type:'assignmentremark'}}).then(function(){
          notification.send(result[1], 'front/notification/assignmentremark/parent', notiData, {masterId:data.masterId, senderId:req.senderId, data:{type:'assignmentremark'}});
        });
      });
    });
  };

  this.getEditData = function(req, res) {
    models.assignment.hasMany(models.assignmentdetail);
    var isWhere = {};
    isWhere = language.buildLanguageQuery(
      isWhere, req.langId, '`assignment`.`id`', models.assignmentdetail, 'assignmentId'
    );
    models.assignment.find({
      include: [{model: models.assignmentdetail,
      where:isWhere}],
      where:{
        id:req.id,
        masterId: req.masterId
      }
    }).then(function(data){
      req.bcsMapId = data.bcsMapId;
      module.exports.getMetaInformations(req, function(result){
        module.exports.getSubjects(req, function(subjects){
          res({data:data, bcsmaps:result.bcsmaps, subjects:subjects.subjects});
        });
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getMetaInformations = function(req, res){
    if(req.user_type === 'teacher') {
      utils.getAllbcsByTeacher(req, function(bcsmaps){
        res({bcsmaps:bcsmaps});
      });
    } else {
      utils.getAllbcsByInstitute(req, function(bcsmaps){
        res({bcsmaps:bcsmaps});
      });
    }
  };

  this.getSubjects = function(req, res){
    if(req.user_type === 'teacher') {
      utils.getSubjectByTeacher(req, function(subjects){
        res({subjects:subjects});
      });
    } else {
      utils.getSubjectByInstitute(req, function(subjects){
        res({subjects:subjects});
      });
    }
  };
}

module.exports = new assignment();
