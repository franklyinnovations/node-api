var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment-timezone');
var mail = require('./mail');
var notification = require('./notification');
var utils = require('./utils');

function Proxy() {

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

    let reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
    isWhere = {};
    if (req.query) {
      var responseData = {};
      responseData.proxy_classes  = {masterId: reqData.masterId, academicSessionId: reqData.academicSessionId};
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

    isWhere.boarddetail = language.buildLanguageQuery(
      isWhere.boarddetail, reqData.langId, '`bcsmap.board`.`id`', models.boarddetail, 'boardId'
    );
    isWhere.classesdetail = language.buildLanguageQuery(
      isWhere.classesdetail, reqData.langId, '`bcsmap.class`.`id`', models.classesdetail, 'classId'
    );
    isWhere.sectiondetail = language.buildLanguageQuery(
      isWhere.sectiondetail, reqData.langId, '`bcsmap.section`.`id`', models.sectiondetail, 'sectionId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, reqData.langId, '`teacher.user`.`id`', models.userdetail, 'userId'
    );

    if(isWhere.proxy_classes && isWhere.proxy_classes.bcsmapId){
      isWhere.proxy_classes.bcsmapId = isWhere.proxy_classes.bcsmapId.split('-')[1]; 
    }
    
    models.proxy_classes.belongsTo(models.bcsmap,{foreignKey:'bcsmapId'});
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);

    models.proxy_classes.belongsTo(models.teacher, {foreignKey:'teacherId'});
    models.teacher.belongsTo(models.user);
    models.user.hasMany(models.userdetail);

    models.proxy_classes.belongsTo(models.timetableallocation, {foreignKey:'timetableallocationId'});

    models.proxy_classes.findAndCountAll({
      include: [
        {model: models.bcsmap,
           include: [{model: models.board, attributes:['id'],
             include: [{model: models.boarddetail,
               attributes:['id', 'alias'],
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
        },{
          model:models.teacher,
          attributes:['id'],
          include:[{
            model:models.user,
            attributes:['id'],
            include:[{
              model:models.userdetail,
              attributes:['fullname'],
              where:isWhere.userdetail
            }]
          }]
        },
        {
          model:models.timetableallocation,
          attributes:['id','period'],
          where: isWhere.timetableallocation
        }
      ],
      attributes:['id', 'academicSessionId', 'teacherId', 'bcsMapId', 'masterId', 'date', 'timetableallocationId'],
      where: isWhere.proxy_classes,
      order: [
        ['id', 'DESC']
      ],
      distinct: true,
      limit: setPage,
      offset: pag
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage});
    })
  };

  this.save = function(req,res) {
    var proxyclasses = models.proxy_classes.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
        proxyclasses.validate().then(function (err) {
          if (err !== null) {
            errors = errors.concat(err.errors);
            callback(null, errors);
          } else {
            callback(null, errors);
          }
        })
      }
    ], function (err, errors) {
      var merged = [].concat.apply([], errors);
      var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
      if (uniqueError.length === 0) {
        req.date = req.date ? req.date : moment.utc().format('YYYY-MM-DD');
        models.proxy_classes.create(req).then(function(data){
          module.exports.sendMail(req);
          res({
            status:true,
            message:language.lang({key:"addedSuccessfully", lang:req.lang}),
            data:data
          });
        });
      } else {
        language.errors({errors:uniqueError, lang:req.lang}, function(errors){
          var newArr = {};
          newArr.errors = errors;
          res(newArr);
        });
      }
    });
  }
  /*
   * get By CLASS
  */
  this.getClasses = function(req, res) {
    models.timetable.belongsTo(models.bcsmap,{foreignKey:'bcsMapId'});
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);

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
        },
      ],
      attributes:['id', 'bcsMapId'],
      where:{
        academicSessionId:req.academicSessionId,
        masterId: req.masterId,
        is_active:1
      },
    }).then(function(data){
      if(data === null || typeof data === 'undefined'){
        res({status: false, data:data});
      }else{
        res({status: true, data:data});
      }
      
    })
  };

 this.periods = function(req,res) {
    models.timetableallocation.findAll({
      where:{
        timetableId:req.timetableId,
        weekday:req.weekday,
        period:{$ne:0}
      }
    }).then(function(data){
        if(data === null || typeof data === 'undefined'){
          res({status: false, data:data});
        }else{
          res({status: true, data:data});
        }
    })
 };

models.teacher.belongsTo(models.user);
models.user.hasMany(models.userdetail);
models.timetableallocation.belongsTo(models.timetable);
models.proxy_classes.belongsTo(models.timetableallocation);

this.teachers = function(req,res) {
  models.timetableallocation.find({
    where:{
      id:req.id
    },
    attributes:['id', 'start_time', 'end_time', 'weekday'],
  })
  .then(resultData => Promise.all([
    models.timetableallocation.findAll({
      include: [{
        model: models.timetable,
        where:{
          masterId:req.masterId
        }
      }],
      where:{
        weekday:resultData.weekday,
        $or:[{
          start_time:{$lt:resultData.start_time},
          end_time:{$gt:resultData.start_time}
        },{
          start_time:{$lt:resultData.end_time},
          end_time:{$gt:resultData.end_time}
        },{
          start_time:{$gte:resultData.start_time},
          end_time:{$lte:resultData.end_time}
        }]
      },
      attributes:['teacherId']
    }),
    models.proxy_classes.findAll({
      include: [
        {
          model: models.timetableallocation,
          where: {
            weekday: resultData.weekday,
            $or:[
              {
                start_time:{$lt:resultData.start_time},
                end_time:{$gt:resultData.start_time}
              },
              {
                start_time:{$lt:resultData.end_time},
                end_time:{$gt:resultData.end_time}
              },
              {
                start_time:{$gte:resultData.start_time},
                end_time:{$lte:resultData.end_time}
              }
            ]
          }
        }
      ],
      attributes: ['teacherId'],
    })
  ]))
  .then(
    ([timetableallocations, proxyclasses]) =>
    timetableallocations.map(timetableallocation => timetableallocation.teacherId)
      .concat(proxyclasses.map(proxyclass => proxyclass.teacherId))
      .concat([0])
  )
  .then(teacherIds => models.teacher.findAll({
    include: [
      {model: models.user, 
        include: [{model:models.userdetail, where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId'), attributes:['id', 'fullname']}], where:{is_active:1}, attributes:['id']}
    ],
    where:{
      id:{$notIn:teacherIds},
      masterId:req.masterId
    },
    attributes:['id']}
  ))
  .then(data => res({status: true, data}))
  .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));   
};

this.sendMail  = function(req, notiType = 'create') {
  models.bcsmap.belongsTo(models.board);
  models.board.hasMany(models.boarddetail);
  models.bcsmap.belongsTo(models.classes);
  models.classes.hasMany(models.classesdetail);
  models.bcsmap.belongsTo(models.section);
  models.section.hasMany(models.sectiondetail);
  models.timetableallocation.belongsTo(models.subject);
  models.subject.hasMany(models.subjectdetail);
  models.teacher.belongsTo(models.user);
  models.user.hasMany(models.userdetail);

  Promise.all([
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
      where: {
        id:req.bcsmapId
      }
    }),
    models.timetableallocation.find({
      attributes:['id','period'],
      where: {
        id:req.timetableallocationId
      }
    }),
    models.teacher.find({
      include: [{
        model: models.user, 
        include: [{
          model:models.userdetail,
          where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId'),
          attributes:['id', 'fullname']
        }],
        where:{is_active:1},
        attributes:['id', 'email', 'device_id', 'is_notification']
      }],
      where:{id:req.teacherId, masterId:req.masterId},
      attributes:['id']
    })
  ]).then(function(result){
    var data = {};
    data.date = req.date;
    data.period = result[1].period;
    data.fullname = result[2].user.userdetails[0].fullname;
    data.bcsmap = result[0].board.boarddetails[0].alias + '-' + result[0].class.classesdetails[0].name + '-' + result[0].section.sectiondetails[0].name
    let mailTo = result[2].user.email;
    let tempUrl = 'front/notification/proxyclasses/sendproxynotify';
    if(notiType === 'remove'){
      tempUrl = 'front/notification/proxyclasses/cancelproxynotify';
    }
    notification.send([{
      id:result[2].user.id, 
      device_id:result[2].user.device_id,
      is_notification:result[2].user.is_notification
    }],
    tempUrl, 
    {lang:req.lang,
      fullname:data.fullname,
      bcsmap:data.bcsmap,
      period:data.period,
      date:data.date
    }, 
    {masterId:req.masterId, 
      senderId:req.userId, 
      data:{type:'proxyclasses'}
    });
    var subject = language.lang({key:"Proxy Notification", lang:req.lang});
    var mailData = {email: mailTo, subject:subject,list:data};
    if(notiType === 'remove'){
      mail.cancelProxyMail(mailData, req.lang);
    } else {
      mail.sendProxyMail(mailData, req.lang);
    }
  }); 
};

  this.remove = function(req, res) {
    models.proxy_classes.findById(req.id)
    .then((data) => {
      let date = moment(moment.utc(data.date).format('YYYY-MM-DD'), 'YYYY-MM-DD'),
        current_date = moment();
      current_date.startOf('day');
      if (date.isSame(current_date)) {
        module.exports.sendMail(
          {
            lang:req.lang,
            langId: req.langId,
            masterId:req.masterId,
            userId:req.userId,
            bcsmapId:data.bcsmapId,
            timetableallocationId: data.timetableallocationId,
            date: date.format('YYYY-MM-DD'),
            teacherId: data.teacherId
          },
          'remove'
        );
      }
      data.destroy().then(() =>{
        res({
          status:true,
          message:language.lang({key:"Removed Successfully", lang:req.lang}),
        });
      });
    });
  };
}
module.exports = new Proxy();