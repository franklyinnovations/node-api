var async = require('async');
const models = require('../models');
var language = require('./language');
var notification = require('./notification');
var board = require('./board');

function Examschedule() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    if (typeof req.has_activity === 'undefined') {
      req.has_activity = 0;
    }
    var examscheduleHasOne = models.examschedule.hasOne(models.examscheduledetail, {as: 'examscheduledetail'});
    req.examscheduledetail.masterId = req.masterId;
    var examschedule = models.examschedule.build(req);
     if (typeof req.id !== 'undefined' && req.id !== '') {
        req.examscheduledetail.examScheduleId = req.id;
     }
    var examscheduleDetails = models.examscheduledetail.build(req.examscheduledetail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
            examschedule.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            examscheduleDetails.validate().then(function (err) {
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
          if (req.id) {
            req.examscheduledetail.examScheduleId = req.id;
            models.examscheduledetail.create(req.examscheduledetail).then(function(data){
              res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
            });
          } else {
            models.examschedule.create(req, {include: [examscheduleHasOne]}).then(function(data){
              res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
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

  this.save2 = function (req) {
    return (
      req.id
      ? models.examschedule.update(req, {
        where: {
          id: req.id
        }
      })
      : models.examschedule.create(req)
    )
    .then(data => ({
      status: true,
      message:language.lang({
        key: req.id ? 'updatedSuccessfully' : 'addedSuccessfully',
        lang:req.lang
      }),
      data
    }))
    .catch(
      err => new Promise(
        resolve => language.errors(
          {
            errors: err.errors,
            lang: req.lang
          },
          errors => resolve({errors})
        )
      )
    );
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
    var reqData = req.body.data ? JSON.parse(req.body.data) : req.body;
    var isWhere = {};
    var orderBy = '';
    if (req.query) {
      var responseData = {};
      responseData.examschedule = {masterId:reqData.masterId, academicSessionId:reqData.academicSessionId};
      async.forEach(Object.keys(req.query), function (item, callback) {
        if (req.query[item] !== ''){
          var modelKey = item.split('__');
          if(typeof responseData[modelKey[0]] =='undefined'){
            var col = {};
            if (modelKey.length === 3) {
               col[modelKey[1]] = req.query[item];
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
    orderBy = 'id DESC';
    models.examschedule.belongsTo(models.examhead);
    models.examhead.hasMany(models.examheaddetail);
    models.examschedule.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.examschedule.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);

    isWhere.examheaddetail = language.buildLanguageQuery(
      isWhere.examheaddetail, reqData.langId, '`examhead`.`id`', models.examheaddetail, 'examheadId'
    );
    isWhere.boarddetail = language.buildLanguageQuery(
      isWhere.boarddetail, reqData.langId, '`board`.`id`', models.boarddetail, 'boardId'
    );
    isWhere.classesdetail = language.buildLanguageQuery(
      isWhere.classesdetail, reqData.langId, '`class`.`id`', models.classesdetail, 'classId'
    );

    models.examschedule.findAndCountAll({
      include: [
        {model: models.examhead, include:[{model: models.examheaddetail, where:isWhere.examheaddetail}]},
        {model: models.board, include:[{model: models.boarddetail, where:isWhere.boarddetail}]},
        {model: models.classes, include:[{model: models.classesdetail, where:isWhere.classesdetail}]}
      ],
      where: isWhere.examschedule,
      order: [
        ['id', 'DESC']
      ],
      distinct: true,
      limit: setPage,
      offset: pag, subQuery: false
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      board.getAllBoard(reqData, function(boards){
        res({
          data:result.rows,
          totalData: totalData,
          pageCount: pageCount,
          pageLimit: setPage,
          currentPage:currentPage,
          boards:boards
        });
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };


  /*
   * status update
  */
 this.status = function(req, res) {
    models.examschedule.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.scheduleClasses = function(req, res){
    var isWhere = {};
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    var isWherelang = {};
    isWherelang.boarddetail = language.buildLanguageQuery(
      isWherelang.boarddetail, req.langId, '`board`.`id`', models.boarddetail, 'boardId'
    );
    isWherelang.classesdetail = language.buildLanguageQuery(
      isWherelang.classesdetail, req.langId, '`class`.`id`', models.classesdetail, 'classId'
    );
    models.sequelize.query("select group_concat(bcs_maps.id) as bcsMapIds from bcs_maps INNER JOIN timetables where bcs_maps.masterId = ? and timetables.academicSessionId = ? and bcs_maps.id = timetables.bcsMapId and timetables.is_active = 1",
    {replacements:[req.masterId,req.academicSessionId], type: models.sequelize.QueryTypes.SELECT}).then(function(bcsIdList) {
      if(bcsIdList[0].bcsMapIds !== null){
        var ids = bcsIdList[0].bcsMapIds.split(',');
        isWhere['id'] = {$in:ids};
      }else{
        isWhere['id'] = {$in:[0]};
      }
      models.bcsmap.findAll({
        include:[
          {model: models.board, attributes:['id'], include:[{model: models.boarddetail, attributes:['name','alias'], where:isWherelang.boarddetail}]},
          {model: models.classes, attributes:['id'], include:[{model: models.classesdetail, attributes:['name'], where:isWherelang.classesdetail}]}
        ],
        where:isWhere,
        order: [
          [ models.board, 'display_order', 'ASC'],
          [ models.board, 'id', 'ASC'],
          [ models.classes, 'display_order', 'ASC'],
          [ models.classes, 'id', 'ASC']
        ],
        attributes:['id', 'classId', 'boardId'],
        group:['boardId','classId']
      }).then(function(classes){
        res({status:true, data:classes});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    });
  };

  this.examSchedule = function(req, res){
    models.examschedule.hasMany(models.examscheduledetail);
    models.examscheduledetail.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    models.examschedule.hasMany(models.activityschedule);
    models.activityschedule.belongsTo(models.activity);
    models.activity.hasMany(models.activitydetail);

    var isWhere = {};
    isWhere.subjectdetail = language.buildLanguageQuery(
      isWhere.subjectdetail, req.langId, '`examscheduledetails.subject`.`id`', models.subjectdetail, 'subjectId'
    );

    models.examschedule.find({
      include:[
        { model: models.examscheduledetail, required:false, include:[{model: models.subject, required:false, attributes:['id'], include:[{model: models.subjectdetail, attributes:['id', 'name'], required:false, where:isWhere.subjectdetail}]}]},
        {
          model: models.activityschedule,
          include:
          [
            {
              model: models.activity,
              include:
              [
                {
                  model: models.activitydetail,
                  where: language.buildLanguageQuery(
                    {},
                    req.langId,
                    '`activityschedules.activity`.`id`',
                    models.activitydetail,
                    'activityId'
                  ),
                  required: false,
                  attributes: ['name']
                }
              ],
              required: false,
              attributes: ['id', 'superActivityId']
            }
          ]
        }
      ],
      order: [
        [models.examscheduledetail, 'date', 'ASC'],
        [models.examscheduledetail, 'start_time', 'ASC']
      ],
      where:{masterId:req.masterId, boardId:req.boardId, classId:req.classId, academicSessionId:req.academicSessionId, examheadId:req.examheadId}
    }).then(function(examschedules){
      res({examschedules:examschedules});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.classSubjects = function(req, res){
    var isWhere = {};
    models.subject.hasMany(models.subjectdetail);
    var isWherelang = {};
    isWherelang.subjectdetail = language.buildLanguageQuery(
      isWherelang.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
    );
    models.sequelize.query("select group_concat(DISTINCT timetable_allocations.subjectId) as subjectIds from bcs_maps INNER JOIN timetables INNER JOIN timetable_allocations where bcs_maps.masterId = ? and timetables.academicSessionId = ? and bcs_maps.boardId = ? and  bcs_maps.classId = ? and bcs_maps.id = timetables.bcsMapId and timetables.id = timetable_allocations.timetableId", {replacements:[req.masterId,req.academicSessionId, req.boardId, req.classId], type: models.sequelize.QueryTypes.SELECT}).then(function(subjects) {
      if(subjects[0].subjectIds !== null){
        var ids = subjects[0].subjectIds.split(',');
        isWhere['id'] = {$in:ids};
      }
      models.subject.findAll({
        include:[
          {model: models.subjectdetail, where:isWherelang.subjectdetail}
        ],
        where:isWhere
      }).then(function(subjects){
        res({subjects:subjects});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    });
  };

  this.getById = function(req, res){
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
    models.examschedule.find({
      include: [
        {model: models.examhead, include:[{model: models.examheaddetail, where:isWhere.examheaddetail}]},
        {model: models.board, include:[{model: models.boarddetail, where:isWhere.boarddetail}]},
        {model: models.classes, include:[{model: models.classesdetail, where:isWhere.classesdetail}]}
      ],
      where: {id:req.id, masterId:req.masterId}
    }).then(function(result){
      res({data:result});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.viewSchedule = function(req, res){
    models.examschedule.hasMany(models.examscheduledetail);
    models.examscheduledetail.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);

    var isWhere = {};
    isWhere.subjectdetail = language.buildLanguageQuery(
      isWhere.subjectdetail, req.langId, '`examscheduledetails.subject`.`id`', models.subjectdetail, 'subjectId'
    );

    models.examschedule.find({
      include:[
        { model: models.examscheduledetail, required:false, include:[{model: models.subject, required:false, attributes:['id'], include:[{model: models.subjectdetail, attributes:['id', 'name'], required:false, where:isWhere.subjectdetail}]}]}
      ],
      attributes:['id'],
      order: [[models.examscheduledetail, 'date', 'ASC'], [models.examscheduledetail, 'start_time', 'ASC'], [models.examscheduledetail, 'id', 'ASC']],
      where:{masterId:req.masterId, academicSessionId:req.academicSessionId, id:req.id}
    }).then(function(examschedules){
      res({examschedules:examschedules});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.removeSchedule = function(req, res){
    models.examscheduledetail.find({where:{id:req.id}}).then(function(data){
      models.mark.find({
        where:{
          examScheduleId:data.examScheduleId,
          subjectId:data.subjectId,
          exam_type:data.exam_type
        }
      }).then(function(markData){
        if(!markData){
            models.examscheduledetail.destroy({where:{id:req.id}}).then(function(dataDeleted){
              res({status:true, message:language.lang({key:"deletedSuccessfully", lang:req.lang}), data:dataDeleted});
            }).catch(() => res({
              status:false,
              error: true,
              error_description: language.lang({key: "Internal Error", lang: req.lang}),
              url: true
            }));
        } else {
          res({
            status:false,
            message:language.lang({key:"You can not delete this exam schedule due to marks has been filled",
            lang:req.lang}),
            data:[]
          });
        }
      })
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}),
      url: true
    }));
  };

  this.editSchedule = function(req, res){
    models.examscheduledetail.belongsTo(models.examschedule);
    models.examscheduledetail.find({
      include:[
        { model: models.examschedule, attributes:['masterId', 'examheadId', 'academicSessionId', 'boardId', 'classId']}
      ],
      where:{id:req.id}
    }).then(function(data){
      var reqData = data.examschedule;
      reqData.langId = req.langId;
      reqData.orderby = req.orderby;
      module.exports.classSubjects(reqData, function(subjects){
        res({status:true, message:language.lang({key:"editRecord", lang:req.lang}), data:data, subjects:subjects.subjects});
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.saveEdit = function(req, res){
    var examscheduleDetails = models.examscheduledetail.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
            examscheduleDetails.validate().then(function (err) {
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
          models.examscheduledetail.update(req, {where:{id:req.id}}).then(function(data){
            res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        } else {
          language.errors({errors:uniqueError, lang:req.lang}, function(errors){
            var newArr = {};
            newArr.errors = errors;
            res(newArr);
          });
        }
    });
  };

  this.exam_notification = function(req, res){
    models.examschedule.find({
      where:{id:req.id}
    }).then(function(data){
      notification.bcsmapIds(data.boardId, data.classId).then(function(bcsmapIds){
        Promise.all([
          notification.getTeachersByBcsmapId(bcsmapIds, data.academicSessionId),
          notification.getStudentsByBcsmapId(bcsmapIds, data.academicSessionId),
          notification.getParentByBcsmapId(bcsmapIds, data.academicSessionId)
        ]).then(function(data){
          notification.send(data[0], 'front/notification/exam/teacher', {lang:req.lang}, {masterId:req.masterId, senderId:req.userId, data:{type:'examschedule'}}).then(function(){
            notification.send(data[1], 'front/notification/exam/student', {lang:req.lang}, {masterId:req.masterId, senderId:req.userId, data:{type:'examschedule'}}).then(function(){
              notification.send(data[2], 'front/notification/exam/parent', {lang:req.lang}, {masterId:req.masterId, senderId:req.userId, data:{type:'examschedule'}})
            });
          });
        });
      });
      res({status:true, message:language.lang({key:"notificationSentSuccessfully", lang:req.lang}), data:[]});
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}),
      url: true
    }));
  };

  this.addCategories = function(req, res){
    var isWhere = {};
    isWhere.subjectcategorydetail = language.buildLanguageQuery(
      isWhere.subjectcategorydetail, req.langId, '`subjectcategory`.`id`', models.subjectcategorydetail, 'subjectCategoryId'
    );
    isWhere.subjectdetail = language.buildLanguageQuery(
      isWhere.subjectdetail, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId'
    );
    models.examschedulesubjectcategory.belongsTo(models.subjectcategory, {foreignKey:'subjectCategoryId'});
    models.subjectcategory.hasMany(models.subjectcategorydetail, {foreignKey:'subjectCategoryId'});
    models.examscheduledetail.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);

    models.examscheduledetail.find({
      include:[{
        model:models.subject,
        attributes:['id'],
        include:[{
          model:models.subjectdetail,
          attributes:['name'],
          where:isWhere.subjectdetail
        }]
      }],
      attributes:['id', 'examScheduleId', 'subjectId', 'max_mark'],
      where:{
        id:req.id
      }
    }).then(function(result){
      Promise.all([
        models.subjectcategory.findAll({
          include:[{
            model:models.subjectcategorydetail,
            attributes:['name'],
            where:isWhere.subjectcategorydetail
          }],
          attributes:['id'],
          where:{
            subjectId:result.subjectId,
            is_active:1
          }
        }),
        models.examschedulesubjectcategory.findAll({
          include:[{
            model:models.subjectcategory,
            attributes:['id'],
            include:[{
              model:models.subjectcategorydetail,
              attributes:['name'],
              where:isWhere.subjectcategorydetail
            }]
          }],
          where:{
            examScheduleDetailId:result.id
          }
        })
      ]).then(function(data){
        res({status:true, subjectcategory:data[0], examschedulesubjectcategory:data[1], examscheduledetail:result});
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

  this.saveCategories = function(req, res){
    var newObj = [];
    if(req.subjectcategory){
      req.subjectcategory.forEach(function(item){
        if(item && item.subjectCategoryId){
          item.subjectId=req.subjectId;
          item.examScheduleId=req.examScheduleId;
          delete item.examscheduledetailId;
          item.examScheduleDetailId=req.examScheduleDetailId;
          newObj.push(item);
        }
      });
    }

    models.examschedulesubjectcategory.destroy({
      where:{id:{$in:req.delSubCatIds}}
    }).then(function(data){
      if(newObj){
        models.examschedulesubjectcategory.bulkCreate(newObj, {
          updateOnDuplicate:['max_marks'],
          ignoreDuplicates:true,
        }).then(function(data){
          res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
        });
      }
    });
  };

  this.removeCategories = function(req, res){
    models.examschedulesubjectcategory.destroy({
      where:{id:req.id}
    }).then(function(data){
      res({status:true, message:language.lang({key:"deletedSuccessfully", lang:req.lang}), data:data});
    });
  };

  this.getDataById = function (req) {
    models.examschedule.hasMany(models.examscheduledetail);
    models.examscheduledetail.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);
    models.examschedule.hasMany(models.activityschedule);
    models.activityschedule.belongsTo(models.activity);
    models.activity.hasMany(models.activitydetail);
    return models.examschedule.findOne({
      where: {
        id: req.id,
        masterId: req.masterId
      },
      include:
      [
        {
          model: models.examscheduledetail,
          include:
          [
            {
              model: models.subject,
              include:
              [
                {
                  model: models.subjectdetail,
                  where: language.buildLanguageQuery(
                    {},
                    req.langId,
                    '`examscheduledetails.subject`.`id`',
                    models.subjectdetail,
                    'subjectId'
                  ),
                  required: false,
                  attributes: ['name']
                }
              ],
              required: false,
              attributes: ['id']
            }
          ]
        },
        {
          model: models.activityschedule,
          include:
          [
            {
              model: models.activity,
              include:
              [
                {
                  model: models.activitydetail,
                  where: language.buildLanguageQuery(
                    {},
                    req.langId,
                    '`activityschedules.activity`.`id`',
                    models.activitydetail,
                    'activityId'
                  ),
                  required: false,
                  attributes: ['name']
                }
              ],
              required: false,
              attributes: ['id', 'superActivityId']
            }
          ]
        }
      ],
    })
  };

  this.remove = async req => {
    try {
      await models.examschedule.destroy({where: {id: req.id}});
    } catch (err) {
      return {
        status: false,
        message: language.lang({key: 'Can not delete exam schedule, It is being used.'}),
      };
    }

    return {
      status: true,
      message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
    };
  };
}

module.exports = new Examschedule();