var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var sms = require('./sms');
var mail = require('./mail');
var notification = require('./notification');

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

function Empleave() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.leavestatus === 'undefined') {
      req.leavestatus = 0;
    }
    var empleave = models.empleave.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
          empleave.validate().then(function (err) {
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
          models.empleave.create(req).then(function(data){
            req.id = data.id;
            module.exports.sendMail(req, 'apply', 'institute');
            res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        } else {
          language.errors({errors:uniqueError, lang:req.lang}, function(errors){
            var newArr = {};
            newArr.errors = errors;
            newArr.status = false;
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
      responseData.empleave = {academicSessionId:reqData.academicSessionId, userId:reqData.userId};
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
    //isWhere['delete'] = 1;
    orderBy = 'id DESC';
    models.empleave.belongsTo(models.tag);
    models.empleave.belongsTo(models.empleavetype, {foreignKey:'empLeaveTypeId'});
    models.tag.hasMany(models.tagdetail);
    models.empleavetype.hasMany(models.empleavetypedetail, {foreignKey:'empLeaveTypeId'});
    
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, reqData.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
    );
    
    Promise.all([
      models.empleave.findAndCountAll({
        include: [{
          model: models.tag,
          attributes: ['id'],
          required:false,
          include: [{
            model: models.tagdetail,
            attributes: ['id', 'title', 'description'],
            where:isWhere.tagdetail, required:false, group:['tagId']
          }]
        },{
          model: models.empleavetype,
          attributes: ['id'],
          include: [{
            model: models.empleavetypedetail,
            attributes: ['id', 'name'],
            where:isWhere.empleavetypedetail
          }]
        }],
        where: isWhere.empleave,
        order: [
          ['id', 'DESC']
        ],
        distinct: true,
        limit: setPage,
        offset: pag,
        subQuery: false
      }),
      models.empleavetype.findAll({
        include: [{
          model: models.empleavetypedetail,
          attributes: ['id', 'name'],
          where: language.buildLanguageQuery(
            {}, reqData.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
          )
        }],
        attributes: ['id'],
        where: {
          masterId: reqData.masterId
        }
      })
    ]).then(function(result){
      var totalData = result[0].count;
      var pageCount = Math.ceil(totalData / setPage);
      res({
        status:true,
        message:language.lang({key:"leaveRecord", lang:req.lang}),
        data:result[0].rows,
        totalData: totalData,
        pageCount: pageCount,
        pageLimit: setPage,
        currentPage:currentPage,
        leavetypes: result[1]
      });
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: reqData.lang}),
      url: true
    }));
  };  

 this.institutelist = function(req, res) {
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
      responseData.empleave = {academicSessionId:reqData.academicSessionId};
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
    //isWhere['delete'] = 1;
    orderBy = 'id DESC';
    models.empleave.belongsTo(models.tag);
    models.empleave.belongsTo(models.user);
    models.empleave.belongsTo(models.empleavetype, {foreignKey:'empLeaveTypeId'});
    models.user.hasMany(models.userdetail);
    models.tag.hasMany(models.tagdetail);
    models.empleavetype.hasMany(models.empleavetypedetail, {foreignKey:'empLeaveTypeId'});
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
    );
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, reqData.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
    );
    Promise.all([
      models.empleave.findAndCountAll({
        include: [
          {model: models.tag, attributes: ['id'], required:false, include: [{model: models.tagdetail, attributes: ['id', 'description'], where:isWhere.tagdetail, required:false}]},
          {model: models.user, attributes: ['id'], include: [{model: models.userdetail, attributes: ['id', 'fullname'], where:isWhere.userdetail}]},
          {model: models.empleavetype, attributes: ['id'], include: [{model: models.empleavetypedetail, attributes: ['id', 'name'], where:isWhere.empleavetypedetail}]}
        ],
        where: isWhere.empleave,
        order: [
          ['id', 'DESC']
        ],
        distinct: true,
        limit: setPage,
        offset: pag, subQuery: false
      }),
      models.empleavetype.findAll({
        include: [{
          model: models.empleavetypedetail,
          attributes: ['id', 'name'],
          where: language.buildLanguageQuery(
            {}, reqData.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
          )
        }],
        attributes: ['id'],
        where: {
          masterId: reqData.masterId
        }
      })
    ]).then(function(result){
      var totalData = result[0].count;
      var pageCount = Math.ceil(totalData / setPage);
      res({
        status:true,
        message:language.lang({key:"leaveRecord", lang:req.lang}),
        data:result[0].rows,
        totalData: totalData,
        pageCount: pageCount,
        pageLimit: setPage,
        currentPage:currentPage,
        leavetypes: result[1]
      });
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}),
      url: true
    }));
  };
  
  
  this.view = function(req, res){
    models.empleave.belongsTo(models.tag);
    models.empleave.belongsTo(models.user);
    models.empleave.belongsTo(models.empleavetype, {foreignKey:'empLeaveTypeId'});
    models.user.hasMany(models.userdetail);
    models.tag.hasMany(models.tagdetail);
    models.empleavetype.hasMany(models.empleavetypedetail, {foreignKey:'empLeaveTypeId'});
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
    );
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, req.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
    );
    models.empleave.find({
      include: [
        {model: models.tag, attributes: ['id'], required:false, include: [{model: models.tagdetail, attributes: ['id', 'description'], where:isWhere.tagdetail, required:false}]},
        {model: models.user, attributes: ['id'], include: [{model: models.userdetail, attributes: ['id', 'fullname'], where:isWhere.userdetail}]},
        {model: models.empleavetype, attributes: ['id'], include: [{model: models.empleavetypedetail, attributes: ['id', 'name'], where:isWhere.empleavetypedetail}]}
      ],
      where:{
        id:req.id,
        masterId:req.masterId
      },
      order: [
        ['id', 'DESC']
      ]
    }).then(function(data){
      if(data){
        res({status:true, message:language.lang({key:"leaveRecord", lang:req.lang}), data:data});
      }else{
        res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true});
      }
      
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * Leave Tags
  */
 this.leaveTags = function(req, res) {
    var isWhere = {};
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );
    models.tag.hasMany(models.tagdetail);
    models.tag.findAll({
      include: [
        {model: models.tagdetail, where:isWhere.tagdetail},
      ],
      where:{type:2, masterId:req.masterId, is_active:1}
      }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
  
  this.leaveTypes = function(req, res) {
    models.empleavetype.hasMany(models.empleavetypedetail);
    var isWhere = {};
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, req.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empleavetypeId'
    );

    qry = "(SELECT (IFNULL(empleavetype.total_leaves, 0) - IFNULL(Sum(emp_leaves.duration),0)) FROM  emp_leaves WHERE empleavetype.id = emp_leaves.empLeaveTypeId AND emp_leaves.userId = "+req.userId+" AND emp_leaves.academicSessionId = "+req.academicSessionId+" AND emp_leaves.leavestatus NOT IN (2,3))";

    models.empleavetype.findAll({
      include: [
        {model: models.empleavetypedetail, where:isWhere.empleavetypedetail},
      ],
      attributes: Object.keys(models.empleavetype.attributes).concat([
            [models.sequelize.literal(qry), 'balance']
      ]),
      where:{is_active:1, masterId:req.masterId}
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
  this.leaveTagsAndLeaveTypes = function(req, res){
    module.exports.leaveTags(req, function(tags){
      module.exports.leaveTypes(req, function(leaveTypes){
        res({status:true, message:language.lang({key:"tagRecord", lang:req.lang}), tags:tags, leaveTypes:leaveTypes});
      });
    });
  };

  /*
   * status update for student
  */
 this.empleave_status = function(req, res) {
    var date = moment(req.date).format('YYYY-MM-DD');
    models.empleave.find({where:{id:req.id}}).then(function(result){
      var enddate = moment(result.end_date).format('YYYY-MM-DD');
      if (moment(date).isBefore(enddate)) {
        models.empleave.update(req,{where:{id:req.id}}).then(function(data){
        	module.exports.sendMail(req, 'status', 'institute');
        	res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      } else {
        res({status:false, message:language.lang({key:"notCancelBackDateLeave", lang:req.lang}), data:[]});
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.empleave.find({where:{id:req.id}}).then(function(result){
      var date = moment(req.date).format('YYYY-MM-DD');
      var enddate = moment(result.end_date).format('YYYY-MM-DD');
      if (moment(date).isSameOrBefore(enddate)) {
        models.empleave.update(req,{where:{id:req.id}}).then(function(data){
          //module.exports.sendSMS({masterId:result.masterId, userId:result.userId, start_date:result.start_date, end_date:result.end_date, leavestatus:req.leavestatus, lang: req.lang}, function(){
            module.exports.sendMail(req, 'status', 'employee');
            res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
          //});
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      } else {
        res({status:false, message:language.lang({key:"notChangeBackDateLeave", lang:req.lang}), data:[]});
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
  this.reject = function(req, res) {
    models.empleave.find({where:{id:req.id}}).then(function(result){
      var date = moment(req.date).format('YYYY-MM-DD');
      var enddate = moment(result.end_date).format('YYYY-MM-DD');
      if (moment(date).isSameOrBefore(enddate)) {
        var empleave = models.empleave.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
          empleave.validate().then(function (err) {
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
          models.empleave.update(req,{where:{id:req.id}}).then(function(data){
            //module.exports.sendSMS({masterId:result.masterId, userId:result.userId, start_date:result.start_date, end_date:result.end_date, leavestatus:req.leavestatus, lang: req.lang}, function(){
              module.exports.sendMail(req, 'status', 'employee');
              res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:[]});
            //});
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        } else {
          language.errors({errors:uniqueError, lang:req.lang}, function(errors){
            var newArr = {};
            newArr.errors = errors;
            newArr.status = false;
            res(newArr);
          });
        }
    });
      } else {
        res({status:false, message:language.lang({key:"notChangeBackDateLeave", lang:req.lang}), data:[]});
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };


  this.sendMail =  function(req, emailType, sendMailTo){
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
    );
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
    );
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, req.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
    );
    models.empleave.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.empleave.belongsTo(models.tag);
    models.tag.hasMany(models.tagdetail);
    models.empleave.belongsTo(models.empleavetype);
    models.empleavetype.hasMany(models.empleavetypedetail);
    Promise.all([
      models.user.find({
        attributes:['id', 'email'],
        where:{id:req.masterId}
      }),
      models.empleave.find({
        include:[{
          model:models.user,
          attributes:['id', 'email', 'device_id', 'is_notification'],
          include:[{
            model:models.userdetail,
            where:isWhere.userdetail
          }]
        },{
          model:models.tag,
          attributes:['id'],
          required:false,
          include:[{
            model:models.tagdetail,
            attributes:['id', 'title', 'description'],
            required:false,
            where:isWhere.tagdetail
          }]
        },{
          model:models.empleavetype,
          attributes:['id'],
          include:[{
            model:models.empleavetypedetail,
            attributes:['id', 'name'],
            where:isWhere.empleavetypedetail
          }]
        }],
        attributes:['id', 'start_date', 'end_date', 'duration', 'halfday', 'comment', 'reject_reason', 'tagId', 'leavestatus'],
        where:{id:req.id}
      })
    ]).then(function(result){
      var data = {};
      data.fullname = result[1].user.userdetails[0].fullname;
      data.start_date = result[1].start_date;
      data.end_date = result[1].end_date;
      data.leavestatus = result[1].leavestatus;

      if(result[1].duration === 0.5){
        data.halfday = result[1].halfday;
      } else{
        data.duration = result[1].duration;
      }

      data.leavetype = result[1].empleavetype.empleavetypedetails[0].name;

      if(result[1].tagId !==0){
        data.comment = result[1].tag.tagdetails[0].description;
      } else {
        data.comment = result[1].comment;
      }

      if(data.leavestatus === 3){
        data.reject_reason = result[1].reject_reason;
      }
      var mailTo = result[0].email;
      if(sendMailTo === 'employee'){
      	mailTo = result[1].user.email;
        
        //-------------------START NOTIFICATION--------------
        if(data.leavestatus == 1){
          notification.send([{
            id:result[1].user.id, 
            device_id:result[1].user.device_id,
            is_notification:result[1].user.is_notification
          }],
          'front/notification/leave/approve',
          {
            lang:req.lang,
            fullname:data.fullname,
            start_date:data.start_date,
            end_date:data.end_date,
            moment:moment
          }, {masterId:req.masterId, senderId:req.status_updatedby, data:{type:'leave_approved'}});
        }

        if(data.leavestatus == 3){
          notification.send([{
            id:result[1].user.id, 
            device_id:result[1].user.device_id,
            is_notification:result[1].user.is_notification
          }],
          'front/notification/leave/reject',
          {
            lang:req.lang,
            fullname:data.fullname,
            start_date:data.start_date,
            end_date:data.end_date,
            moment:moment
          }, {masterId:req.masterId, senderId:req.status_updatedby, data:{type:'leave_rejected'}});
        }
        //-------------------END NOTIFICATION--------------
      }
      var subject = language.lang({key:"Leave Notification", lang:req.lang});
      var mailData = {email: mailTo, subject:subject, list: data};
      if(emailType == 'apply'){
        mail.empleaveApply(mailData, req.lang);
      } else {
        mailData.sendMailTo = sendMailTo;
        mail.empleaveStatus(mailData, req.lang);
      }
    });
  };
}

module.exports = new Empleave();
