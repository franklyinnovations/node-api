var async = require('async');
const models = require('../models');
var language = require('./language');
var notification = require('./notification');
var moment = require('moment');

function Rvdhsmap() {
  /*
   * save
  */
  this.save = function(req, res){
    var rvdhsmap = models.rvdhsmap.build(req);
    var rvdhsmapaddress = models.rvdhsmap.hasMany(models.rvdhsmapaddress, {as:'rvdhs_map_address'});
    var errors = [];
    async.parallel([
        function (callback) {
            rvdhsmap.validate().then(function (err) {
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
            if(req.helperId == ''){
                req.helperId = null;
            }
            if (typeof req.id !== 'undefined' && req.id !== '') {
            Promise.all([
              models.rvdhsmap.update(req,{where: {id:req.id}}),
              models.rvdhsmapaddress.bulkCreate(req.rvdhs_map_address,{
                updateOnDuplicate:['pick_up_time', 'drop_time'],
                ignoreDuplicates:true
              })
            ]).then(function(data){
              module.exports.createRecord({id:req.id, studentId:req.studentId}, function(){
                module.exports.notification({id:req.id, lang:req.lang, langId:req.langId, masterId:req.masterId, userId:req.userId});
                res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
              });
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            models.rvdhsmap.create(req, {include:[rvdhsmapaddress]}).then(function(data){
              module.exports.createRecord({id:data.id, studentId:req.studentId}, function(){
                module.exports.notification({id:data.id, lang:req.lang, langId:req.langId, masterId:req.masterId, userId:req.userId});
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              });
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

  this.createRecord = function(req, res){
    var rvdhsmapId = req.id;
    models.rvdhsmaprecord.destroy({where:{rvdhsmapId:rvdhsmapId}}).then(function(){
      var count =1;
      var studentData = [];
      var studentId = [];
      if (typeof req.studentId !=='undefined') {
        studentId = req.studentId;
      }
      async.forEach(studentId, function (item, callback) {
        var saveData = {};
        saveData.rvdhsmapId = rvdhsmapId;
        saveData.studentId = item;
        studentData.push(saveData);
        if (studentId.length ==count) {
          callback(studentData);
        }
        count++;
      }, function () {
        models.rvdhsmaprecord.bulkCreate(studentData).then(function(data){
          res(data);
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
      responseData.rvdhsmap = {masterId:reqData.masterId, academicSessionId:reqData.academicSessionId};
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

    models.rvdhsmap.belongsTo(models.user, {foreignKey: 'driverId', as: 'driver'});
    models.rvdhsmap.belongsTo(models.user, {foreignKey: 'helperId', as: 'helper'});
    models.user.hasMany(models.userdetail);
    models.rvdhsmap.belongsTo(models.route);
    models.rvdhsmap.belongsTo(models.vehicle);
    models.vehicle.hasMany(models.vehicledetail);

    isWhere.driver = language.buildLanguageQuery(
      isWhere.driver, reqData.langId, '`driver`.`id`', models.userdetail, 'userId'
    );
    isWhere.helper = language.buildLanguageQuery(
      isWhere.helper, reqData.langId, '`helper`.`id`', models.userdetail, 'userId'
    );
    isWhere.vehicledetail = language.buildLanguageQuery(
      isWhere.vehicledetail, reqData.langId, 'vehicle.id', models.vehicledetail, 'vehicleId'
    );

    var isRequired = false;
    if(isWhere.helper.fullname){
      isRequired = true;
    }

    models.rvdhsmap.findAndCountAll({
      include:[
        {
          model:models.user,
          attributes:['id'],
          include:[{
            model:models.userdetail,
            where:isWhere.driver
          }],
          as:'driver'
        },
        {
          model:models.user,
          required:isRequired,
          attributes:['id'],
          include:[{
            model:models.userdetail,
            required:isRequired,
            where:isWhere.helper
          }],
          as:'helper'
        },
        {
          model:models.route,
          where:isWhere.route
        },
        {
          model:models.vehicle,
          attributes:['id', 'number'],
          include:[{
            model:models.vehicledetail,
            where:isWhere.vehicledetail
          }],
          where:isWhere.vehicle
        }
      ],
      attributes:['id', 'vehicle_type'],
      where: isWhere.rvdhsmap,
      order: [
        ['id', 'DESC']
      ],
      limit: setPage,
      offset: pag, subQuery: false
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    });
  };

  this.getRoute = function(req, res){
    Promise.all([
      module.exports.routes(req, res),
      module.exports.drivers(req, res),
      module.exports.helpers(req, res)
    ]).then(function(result){
      res({
        status:true,
        routes: result[0],
        drivers: result[1],
        helpers: result[2]
      });
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}),
      url: true
    }));
  };

  this.getById = function(req, res){
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`rvdhsmaprecords.student.user`.`id`', models.userdetail, 'userId'
    );
    isWhere.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, '`rvdhsmaprecords.student`.`id`', models.studentdetail, 'studentId'
    );
    models.rvdhsmap.hasMany(models.rvdhsmaprecord);
    models.rvdhsmaprecord.belongsTo(models.student);
    models.student.belongsTo(models.user);
    models.student.hasMany(models.studentdetail);
    models.user.hasMany(models.userdetail);
    Promise.all([
      models.rvdhsmap.find({
        include:[{
          model:models.rvdhsmaprecord.scope({method: ['tc', '`rvdhsmaprecords`.`studentId`']}),
          required:false,
          include:[{
            model:models.student,
            required:false,
            attributes:['id'],
            include:[{
              model:models.user,
              required:false,
              attributes:['id'],
              include:[{
                model:models.userdetail,
                required:false,
                where:isWhere.userdetail
              }]
            },{
              model:models.studentdetail,
              required:false,
              where:isWhere.studentdetail
            }]
          }]
        }],
        where:{masterId:req.masterId, id:req.id, academicSessionId:req.academicSessionId}
      }),
      module.exports.routes(req, res),
      module.exports.drivers(req, res),
      module.exports.helpers(req, res)
    ]).then(function(result){
      res({
        status:true,
        data:result[0],
        routes: result[1],
        drivers: result[2],
        helpers: result[3]
      });
    });
  };

  this.routes = function(req, res){
    return models.route.findAll({
      where:{
        is_active:1,
        masterId:req.masterId
      }
    })
  };

  this.drivers = function(req, res){
    models.user.hasMany(models.userdetail);
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, 'user.id', models.userdetail, 'userId'
    );
     var driver = models.user.hasOne(models.rvdhsmap, {foreignKey:'driverId'});
    return models.user.findAll({
      include:[{
        model:models.userdetail,
        where:isWhere.userdetail
      },
        driver
      ],
      attributes:['id'],
      where:{
        user_type:'driver',
        masterId:req.masterId,
        is_active:1
      }
    });
  };

  this.helpers = function(req, res){
    models.user.hasMany(models.userdetail);
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, 'user.id', models.userdetail, 'userId'
    );
    var helper = models.user.hasOne(models.rvdhsmap, {foreignKey:'helperId'});
    return models.user.findAll({
      include:[{
        model:models.userdetail,
        where:isWhere.userdetail
      },
        helper
      ],
      attributes:['id'],
      where:{
        user_type:'helper',
        masterId:req.masterId,
        is_active:1
      }
    });
  };

  this.getVehicles = function(req, res){
    var isWhere = {};
    isWhere.vehicledetail = language.buildLanguageQuery(
      isWhere.vehicledetail, req.langId, 'vehicle.id', models.vehicledetail, 'vehicleId'
    );
    models.vehicle.hasMany(models.vehicledetail);
    models.vehicle.hasMany(models.rvdhsmap);
    models.vehicle.findAll({
      include:[{
        model:models.vehicledetail,
        where:isWhere.vehicledetail
      },{
        model:models.rvdhsmap,
        attributes:['id']
      }],
      where:{
        is_active:1,
        masterId:req.masterId,
        vehicle_type:req.vehicle_type
      }
    }).then(function(vehicles){
      res({
        data:vehicles
      });
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({
        key: "Internal Error",
        lang: req.lang
      }),
      url: true
    }));
  };

  this.getStudents = function(req, res){
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, 'user.id', models.userdetail, 'userId'
    );
    isWhere.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, 'student.id', models.studentdetail, 'studentId'
    );
    models.student.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.student.hasOne(models.studentrecord);
    models.student.hasOne(models.rvdhsmaprecord);
    models.student.hasMany(models.studentdetail);
    models.rvdhsmaprecord.belongsTo(models.rvdhsmap);
    models.routeaddress.hasOne(models.rvdhsmapaddress, {foreignKey:'routeaddressId'});
    Promise.all([
      models.student.findAll({
        include:[
          {
            model:models.user,
            attributes:['id'],
            include:[
              {
                model: models.userdetail,
                where:isWhere.userdetail
              }
            ],
            where: {is_active: 1}
          },
          {
            model:models.studentrecord.scope(
              {
                method: ['transferred', moment().format('YYYY-MM-DD')]
              },
              {
                method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]
              }
            ),
            where:{
              academicSessionId:req.academicSessionId
            }
          },
          {
            model:models.rvdhsmaprecord.scope({method: ['tc', '`rvdhsmaprecord`.`studentId`']}),
            required:false,
            include:[{
              model:models.rvdhsmap,
              attributes:['id'],
              required:false,
              where:{
                routeId:req.routeId
              }
            }]
          },{
            model:models.studentdetail,
            where:isWhere.studentdetail
          }
        ],
        attributes:['id'],
        where:{
          routeId:req.routeId, 
          masterId:req.masterId,
        }
      }),
      models.routeaddress.findAll({
        include:[{
          model:models.rvdhsmapaddress,
          required:false,
          where:{rvdhsmapId:req.rvdhsmapId}
        }],
        where:{
          routeId:req.routeId
        },
        order: [
          ['position', 'ASC']
        ],
      })
    ]).then(function(result){
      res({
        status:true,
        students:result[0],
        routeaddress:result[1]
      });
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({
        key: "Internal Error",
        lang: req.lang
      }),
      url: true
    }));
  };

  this.view = function(req, res){
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`rvdhsmaprecord.student.user`.`id`', models.userdetail, 'userId'
    );
    isWhere.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, '`rvdhsmaprecord.student`.`id`', models.studentdetail, 'studentId'
    );
    isWhere.vehicledetail = language.buildLanguageQuery(
      isWhere.vehicledetail, req.langId, '`rvdhsmaprecord.vehicle`.`id`', models.vehicledetail, 'vehicleId'
    );
    isWhere.boarddetail = language.buildLanguageQuery(
      isWhere.boarddetail, req.langId, '`rvdhsmaprecords.student.studentrecord.bcsmap.board`.`id`', models.boarddetail, 'boardId'
    );
    isWhere.classesdetail = language.buildLanguageQuery(
      isWhere.classesdetail, req.langId, '`rvdhsmaprecords.student.studentrecord.bcsmap.classes`.`id`', models.classesdetail, 'classId'
    );
    isWhere.sectiondetail = language.buildLanguageQuery(
      isWhere.sectiondetail, req.langId, '`rvdhsmaprecords.student.studentrecord.bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
    );
    models.rvdhsmap.hasMany(models.rvdhsmaprecord);
    models.rvdhsmaprecord.belongsTo(models.student);
    models.student.belongsTo(models.user);
    models.student.hasMany(models.studentdetail);

    models.student.hasOne(models.studentrecord);
    models.studentrecord.belongsTo(models.bcsmap, {foreignKey: 'bcsMapId'});
    models.bcsmap.belongsTo(models.board);
    models.bcsmap.belongsTo(models.classes);
    models.bcsmap.belongsTo(models.section);
    models.board.hasMany(models.boarddetail);
    models.classes.hasMany(models.classesdetail);
    models.section.hasMany(models.sectiondetail);

    models.user.hasMany(models.userdetail);
    models.rvdhsmap.belongsTo(models.vehicle);
    models.vehicle.hasMany(models.vehicledetail);
    models.rvdhsmap.find({
      include:[{
        model:models.rvdhsmaprecord.scope({method: ['tc', '`rvdhsmaprecords`.`studentId`']}),
        required:false,
        include:[{
          model:models.student,
          required:false,
          attributes:['id'],
          include:[{
            model:models.user,
            required:false,
            attributes:['id'],
            include:[{
              model:models.userdetail,
              required:false,
              where:isWhere.userdetail
            }]
          },{
            model:models.studentdetail,
            required:false,
            where:isWhere.studentdetail
          },{
            model:models.studentrecord.scope(
              {
                method: ['transferred', moment().format('YYYY-MM-DD')]
              }
            ),
            //attributes:['id'],
            required:false,
            include:[{
              model:models.bcsmap,
              attributes:['id'],
              required:false,
              include:[{
                model:models.board,
                attributes:['id'],
                required:false,
                include:[{
                  model:models.boarddetail,
                  required:false,
                  attributes:['id', 'name', 'alias'],
                  where:isWhere.boarddetail
                }]
              },{
                model:models.classes,
                attributes:['id'],
                required:false,
                include:[{
                  model:models.classesdetail,
                  required:false,
                  attributes:['id', 'name'],
                  where:isWhere.classesdetail
                }]
              },{
                model:models.section,
                attributes:['id'],
                required:false,
                include:[{
                  model:models.sectiondetail,
                  required:false,
                  attributes:['id', 'name'],
                  where:isWhere.sectiondetail
                }]
              }]
            }],
          }]
        }]
      },{
        model:models.vehicle,
        attributes:['id', 'total_seats', 'number'],
        include:[{
          model:models.vehicledetail
        }]
      }],
      attributes:['id'],
      order:[[models.rvdhsmaprecord, models.student, models.studentrecord, 'id', 'DESC']],
      where:{masterId:req.masterId, id:req.id}
    }).then(function(result){
      res({
        status:true,
        data:result
      });
    })
  };

  this.notification = function(req, res){
    models.rvdhsmap.belongsTo(models.user, {foreignKey: 'driverId', as: 'driver'});
    models.rvdhsmap.belongsTo(models.user, {foreignKey: 'helperId', as: 'helper'});
    models.user.hasMany(models.userdetail);
    models.rvdhsmap.belongsTo(models.route);
    models.rvdhsmap.belongsTo(models.vehicle);
    models.vehicle.hasMany(models.vehicledetail);

    var isWhere = {};
    isWhere.driver = language.buildLanguageQuery(
      isWhere.driver, req.langId, '`driver`.`id`', models.userdetail, 'userId'
    );
    isWhere.helper = language.buildLanguageQuery(
      isWhere.helper, req.langId, '`helper`.`id`', models.userdetail, 'userId'
    );

    models.rvdhsmap.find({
      include:[
        {
          model:models.user,
          attributes:['id'],
          include:[{
            model:models.userdetail,
            attributes:['id', 'fullname'],
            where:isWhere.driver
          }],
          as:'driver'
        },
        {
          model:models.user,
          required:false,
          attributes:['id'],
          include:[{
            model:models.userdetail,
            required:false,
            attributes:['id', 'fullname'],
            where:isWhere.helper
          }],
          as:'helper'
        },
        {
          model:models.route,
          attributes:['id', 'name']
        },
        {
          model:models.vehicle,
          attributes:['id', 'number'],
          where:isWhere.vehicle
        }
      ],
      attributes:[
        'id',
        [models.sequelize.literal("(SELECT GROUP_CONCAT(`studentId`) FROM `rvdhs_map_records` WHERE `rvdhsmapId` = "+req.id+")"), 'studentIds'],
      ],
      where: {
        id:req.id
      }
    }).then(function(data){
      data = data.toJSON();
      models.sequelize.query(
        "SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
        INNER JOIN `students` ON `users`.`id` = `students`.`userId` \
        WHERE FIND_IN_SET(`students`.`id`, ?)",
        {replacements:[data.studentIds], type: models.sequelize.QueryTypes.SELECT}
      ).then(function(studentData){
        models.sequelize.query(
          "SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` \
          WHERE FIND_IN_SET (`mobile`, (SELECT GROUP_CONCAT(`father_contact`,',',`father_contact_alternate`,',', \
          `mother_contact`,',',`mother_contact_alternate`,',',`guardian_contact`,',',`guardian_contact_alternate`) AS mob\
          FROM `students` \
          WHERE FIND_IN_SET(`students`.`id`, ?)))\
          AND `users`.`user_type` = 'parent' GROUP BY `users`.`device_id`",
          {replacements:[data.studentIds], type: models.sequelize.QueryTypes.SELECT}
        ).then(function(parentData){
          var notifiData = {};
          notifiData.lang = req.lang;
          notifiData.driver = data.driver.userdetails[0].fullname;
          notifiData.helper = data.helper ? data.helper.userdetails[0].fullname : null;
          notifiData.vehicle_no = data.vehicle.number;
          notifiData.route = data.route.name;
          notification.send(studentData, 'front/notification/transport/student', notifiData, {masterId:req.masterId, senderId:req.userId, data:{type:'transport'}}).then(function(){
            notification.send(parentData, 'front/notification/transport/parent', notifiData, {masterId:req.masterId, senderId:req.userId, data:{type:'transport'}});
          });
        });
      });
    });
  };
}

module.exports = new Rvdhsmap();
