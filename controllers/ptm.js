var async = require('async');
const models = require('../models');
var language = require('./language');
var unique = require('array-unique');
var difference = require('array-difference');
var moment = require('moment');
var notification = require('../controllers/notification');

function Empleavetype() {
  /*
   * save
  */
  
  this.save = function(req, res){
    var selfObj=this;          
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var ptmMany = models.ptm.hasMany(models.ptm_details, {as: 'ptm_details', foreignKey:'ptm_id'});
    
    req.masterId = req.masterId;
    req.academicSessionId = req.academicSessionId;
    req.userId = req.userId;
    
    req.start_date = moment(req.start_date,["YYYY-MM-DD"]).format('YYYY-MM-DD');
    req.last_registration_date = moment(req.last_registration_date,["YYYY-MM-DD"]).format('YYYY-MM-DD');
    req.start_time = moment(req.start_time,["h:mm A"]).format('HH:mm');
    req.end_time = moment(req.end_time,["h:mm A"]).format('HH:mm');
    
    var ptmVaild = models.ptm.build(req);
    //var empleavetypeDetails = models.empleavetypedetail.build(req.empleavetype_detail);
    var errors = [];
    
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
          
          //callback(null);
          
          ptmVaild.validate().then(function (err) {
              if (err !== null) {
                  errors = errors.concat(err.errors);
                  callback(null, errors);
              } else {
                  callback(null, errors);
              }
          })
          //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }
    ], function (err, errors) {
        
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        
        if (uniqueError.length === 0) {
        //if (1) {
            
          if (typeof req.id !== 'undefined' && req.id !== '') {
              
//            req.empleavetype_detail.empLeaveTypeId = req.id;
//            models.empleavetype.update(req,{where: {id:req.id}}).then(function(data){
//              models.empleavetypedetail.find({where:{empLeaveTypeId:req.id,languageId:req.langId}}).then(function(resultData){
//                if (resultData !==null) {
//                  req.empleavetype_detail.id = resultData.id;
//                  models.empleavetypedetail.update(req.empleavetype_detail, {where:{id:resultData.id, empLeaveTypeId:req.id,languageId:req.langId}}).then(function(){
//                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
//                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
//                } else {
//                  delete req.empleavetype_detail.id;
//                  models.empleavetypedetail.create(req.empleavetype_detail).then(function(){
//                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
//                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
//                }
//              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
//            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          
            
            } else {
              
             
            //var obj={class_id:'1','teacher_id':1};  
            //var arrSave=[];
            
            //arrSave.push(obj);
            
            //req['ptm_details']=arrSave;
            
            var array = JSON.parse(req.ptm_details);
              
            req.ptm_details=array;
               
            var langId = parseInt(req.languageId);
            models.ptm.create(req, {include: [ptmMany]}).then(function(data){
            //Send Notification............................................    
            req.ptm_id=data.id;  
            //selfObj.sendNotification(req,res);
            //-------------------------------------------------------------
            //models.ptm.create(req).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
              
             res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});

              }
              
              
            });
            //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          
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
      
      responseData.empleavetype = {masterId:reqData.masterId};
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

    models.empleavetype.hasMany(models.empleavetypedetail, {foreignKey:'empLeaveTypeId'});
    
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, reqData.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
    );
    
    models.ptm.findAndCountAll({
      include: [
        //{model: models.empleavetypedetail, where:isWhere.empleavetypedetail},
      ],
      where: isWhere.empleavetype,
      order: [
        ['id', 'DESC']
      ],
      distinct: true,
      limit: setPage,
      offset: pag, subQuery: false
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };
  
  
  this.sendNotification = function(req, res) {
      
   qry = " SELECT group_concat(distinct class_id) bcsMapId FROM ptm_details where ptm_id=?  "    
    models.sequelize.query(qry, {replacements: [req.ptm_id], type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
    //res(result);    
    
    if(result.length){
    var bcsMapIdArr=result[0]['bcsMapId'].split(',');
    
    Promise.all([
        //notification.getStudentsByBcsmapId(bcsMapIdArr, req.academicSessionId),
        notification.getParentByBcsmapId(bcsMapIdArr, req.academicSessionId)
      ]).then(function(deviceIds){
        
        for(var i=0;i<deviceIds[0].length;i++){
        
        var saveInvite={};
        saveInvite['user_id']=deviceIds[0][i]['id'];
        saveInvite['ptm_id']=req.ptm_id;
        models.ptm_invitations.create(saveInvite);
            
        }
        
                  
        var notiData = {};
        notiData.lang = req.lang;
        notiData.ptm_id = req.ptm_id;
        //notiData.subject = result.subject.subjectdetails[0].name;
        //notiData.exam = result.examschedule.examhead.examheaddetails[0].name;
        
        //notification.send(deviceIds[0], 'front/notification/exam_marks/student', notiData, {ptm_id:req.masterId,masterId:req.masterId, senderId:req.userId, data:{type:'examschedule'}});
        notification.send(deviceIds[0], 'front/notification/ptm/ptm', notiData, {ptm_id:req.ptm_id,masterId:req.masterId, senderId:req.userId, data:{type:'ptm'}});
   });
   
   }
   });
      
       
  };
  
  
  /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.empleavetype.hasMany(models.empleavetypedetail);
    var isWhere = {};
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, req.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
    );
    models.empleavetype.find({
      include: [{
        model: models.empleavetypedetail, 
        where:isWhere.empleavetypedetail}], 
        where:{
          id:req.id,
          masterId: req.masterId
        }}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All Sections
  */
 this.getAllEmpLeaveType = function(req, res) {
    models.empleavetype.hasMany(models.empleavetypedetail);
    var isWhere = {};
    isWhere.empleavetypedetail = language.buildLanguageQuery(
      isWhere.empleavetypedetail, req.langId, '`empleavetype`.`id`', models.empleavetypedetail, 'empLeaveTypeId'
    );
    models.empleavetype.findAll({
      include: [{model: models.empleavetypedetail, where:isWhere.empleavetypedetail}],
      where:{is_active:1, masterId:req.masterId},
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ]}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };



  /*
   * status update
  */
 this.status = function(req, res) {
    models.empleavetype.update(req,{where:{id:req.id}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
  
  
  this.getPtmTeacher= function(req, res){
      
    qry = " SELECT * FROM ptm p left join ptm_details pd on p.id=pd.ptm_id  "
    qry += " left join users u on pd.teacher_id=u.id "
    qry += " where p.id=? and class_id=? and academicSessionId=? and p.masterId=? "     
    models.sequelize.query(qry, {replacements: [req.body.ptm_id,req.body.class_id,req.body.academicSessionId,req.body.masterId], type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
    res(result);    
    });
    
  }
  
  
  
   this.addPtm = function(req, res) {
       
    models.ptm_schedules.create(req.body).then(function(data){
        
      res({status:true, message:language.lang({key:"AddedSuccessfully", lang:req.lang}), data:data});
      
    })
    //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    
  };
  
  
   this.getTime= function(req, res){
      
    qry = " SELECT * FROM ptm_schedules p left join users u on p.teacher_id=u.id where ptm_id=? and user_id=?  "
    
    models.sequelize.query(qry, {replacements: [req.body.ptm_id,req.body.user_id], type: models.sequelize.QueryTypes.SELECT}).then(function (results) {
    if(results.length){
      res(results);  
    }
    
    });
    
  }
  
  
  this.getPtmInvite2= function(req, res){
      
    qry = " SELECT * FROM ptm_invitations pi left join ptm p on pi.ptm_id=p.id where user_id=?  "
    
    models.sequelize.query(qry, {replacements: [req.body.user_id], type: models.sequelize.QueryTypes.SELECT}).then(function (results) {
    if(results.length){
      res(results);  
    }
    
    });
    
  }
  this.getPtmInvite= function(req, res){
      
   //ptm_schedules   ptm_invitations
      
    models.ptm_invitations.hasOne(models.ptm);
    models.ptm.hasMany(models.ptm_schedules);
    var isWhere = {};
    
    
    
    models.ptm_invitations.find({include: [
            {model: models.ptm},
            //{model: models.ptm}
        ], where:{user_id:req.user_id}}).then(function(data){
      res(data);
    })
    //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    
  }
  
  
   this.updateTime= function(req, res){
       
    var ptm_id=req.body.ptm_id;
    var qry='';
    
    qry = " SELECT * from ptm where id=? "
    models.sequelize.query(qry, {replacements: [ptm_id], type: models.sequelize.QueryTypes.SELECT}).then(function (ptmResults) {

      
    qry = " SELECT user_id,count(id) total,group_concat(teacher_id order by teacher_id) t_ids,  "
    qry += " (select group_concat(distinct teacher_id) FROM ptm_schedules where ptm_id=?) teachers "
    qry += " FROM ptm_schedules where ptm_id=? "     
    qry += " group by user_id order by count(id) desc "  
    
    models.sequelize.query(qry, {replacements: [ptm_id,ptm_id], type: models.sequelize.QueryTypes.SELECT}).then(function (results) {
    //res(result);  
    if(results.length){
        
    
    
    //var total_parent = 10;
    //var total_teacher = 50;
    //var total_time = 120;
    //var max_met_any_parent = 3;
    var met_start = ptmResults[0]['start_time'];//'10:00';
    var met_end = ptmResults[0]['end_time'];//'12:00';
    var enter_arr = [];
    var in_arr = [];
    var eachTimeMin =ptmResults[0]['per_teacher_time'];//4;
    var teacher_obj = {};

    var totalArr=results[0].teachers.split(",");
    total_teacher=totalArr.length;
    
    for (var th = 0; th < total_teacher; th++) {
        //teacher_obj['T' + th] = 0;
        teacher_obj[totalArr[th]] = 0;
    }
    var teacher_obj_org = teacher_obj;
    
    //var per_met_maxtime = (total_time) / (total_parent * max_met_any_parent);
    var per_met_maxtime = ptmResults[0]['per_teacher_time'];
    
    var meet_arr = [];
        var meet_obj = {};
        var counter = 1;

        var last_no_of_teacher = null;
        var last_no_of_meet_enter = 1;
        var end_date = met_start;
        var resultsSave = results;
        var skipArr = [];


        async.eachOfSeries(results, function (list, i, callback) {


            if (typeof list !== 'undefined' && skipArr.indexOf(i) == -1) {


                meet_obj = {}
                var start_time_diff = met_start;
                var avb = total_teacher - parseInt(last_no_of_meet_enter);


                if (last_no_of_teacher && (last_no_of_teacher != list.total || last_no_of_meet_enter > list.total)) {


                    var diffArr = difference(enter_arr, list.t_ids.split(","));

                    var totalLoop = results.length;


                    for (var k = i; k < totalLoop; k++) {

                        if (typeof resultsSave[k] !== 'undefined' && skipArr.indexOf(k) == -1) {

                            var set_cur_arr2 = resultsSave[k].t_ids.split(",");

                            var is_enter = 1;
                            for (var l = 0; l < set_cur_arr2.length; l++) {

                                //total_seat = teacher_obj[set_cur_arr2[l]];
                                if (teacher_obj[set_cur_arr2[l]] == 0) {
                                    is_enter = 0;
                                }

                            }

                            if (is_enter == 1) {



                                for (var p = 0; p < set_cur_arr2.length; p++) {

                                    teacher_obj[set_cur_arr2[p]] = parseInt(teacher_obj[set_cur_arr2[p]]) - 1;

                                }

                                meet_obj = {};
                                var total_time = parseInt(per_met_maxtime) * parseInt(resultsSave[k].total);
                                meet_obj['user_id'] = resultsSave[k].user_id
                                meet_obj['teacher_id'] = resultsSave[k].t_ids
                                meet_obj['time_start'] = met_start;
                                meet_obj['time_end'] = end_date;//addMinutes(met_start, total_time);
                                meet_obj['last_no_of_meet_enter'] = last_no_of_meet_enter;
                                meet_obj['group'] = resultsSave[k].total;
                                meet_obj['avb'] = avb;

                                meet_arr.push(meet_obj);
                                skipArr.push(k);

                            }
                        }
                    }




                    var cur_arr = list.t_ids.split(",");
                    met_start = end_date;
                    last_no_of_meet_enter = 1;
                    teacher_obj = teacher_obj_org;

                }

                var set_cur_arr = list.t_ids.split(",");

                for (var p = 1; p <= total_teacher; p++) {

                    teacher_obj['T' + p] = set_cur_arr.length;

                }

                for (var p = 0; p < set_cur_arr.length; p++) {

                    teacher_obj[set_cur_arr[p]] = set_cur_arr.length - 1;

                }

                if (skipArr.indexOf(i) == -1) {
                    meet_obj = {};
                    var total_time = parseInt(per_met_maxtime) * parseInt(list.total);
                    meet_obj['user_id'] = list.user_id
                    meet_obj['teacher_id'] = list.t_ids
                    meet_obj['time_start'] = met_start;
                    meet_obj['time_end'] = addMinutes(met_start, total_time);
                    meet_obj['last_no_of_meet_enter'] = last_no_of_meet_enter;
                    meet_obj['group'] = list.total;
                    meet_obj['avb'] = avb;
                    meet_arr.push(meet_obj);
                }

                //------------------------------------


                last_no_of_teacher = list.total;
                end_date = meet_obj['time_end'];
                last_no_of_meet_enter++;
            }
            callback();
        }, function (err) {

            var schPtm = [];
            var timeSlot = {};
            var preStartTime;
            var teacher_arr = [];
            var timeObj = {};
            async.eachOfSeries(meet_arr, function (list2, i, callback2) {

                var eachPtm = {};

                if (list2['time_start'] == preStartTime) {

                    if (teacher_arr.length == 0) {
                        teacher_arr = list2['teacher_id'].split(",");

                        for (var tm = 0; tm < total_teacher; tm++) {

                            var techArrTime = [];
                            for (var tm2 = 0; tm2 < teacher_arr.length; tm2++) {

                                techArrTime.push(addMinutes(list2['time_start'], (eachTimeMin * tm2)));

                            }
                            //timeObj['T' + tm] = techArrTime;
                            timeObj[totalArr[tm]] = techArrTime;

                        }
                    }

                } else {
                    teacher_arr = list2['teacher_id'].split(",");
                    for (var tm = 0; tm < total_teacher; tm++) {

                        var techArrTime = [];
                        for (var tm2 = 0; tm2 < teacher_arr.length; tm2++) {

                            techArrTime.push(addMinutes(list2['time_start'], (eachTimeMin * tm2)));

                        }
                        //timeObj['T' + tm] = techArrTime;
                        timeObj[totalArr[tm]] = techArrTime;

                    }
                }

                preStartTime = list2['time_start'];

                var userNextTime = '';
                var startTimeMy;

                var myTeacher_arr = list2['teacher_id'].split(",");

                for (var p = 0; p < myTeacher_arr.length; p++) {

                    meet_obj = {};

                    if (userNextTime == '') {
                        var index = timeObj[myTeacher_arr[p]].indexOf(list2['time_start']);
                        startTimeMy = list2['time_start'];
                    } else {

                        var index = timeObj[myTeacher_arr[p]].indexOf(userNextTime);
                        startTimeMy = userNextTime;
                    }

                    if (index == -1) {
                        meet_obj['time_start'] = timeObj[myTeacher_arr[p]][0];
                    } else {
                        meet_obj['time_start'] = startTimeMy;
                    }

                    if (meet_obj['time_start']) {
                        meet_obj['time_end'] = addMinutes(meet_obj['time_start'], eachTimeMin);
                    }
                    meet_obj['user_id'] = list2.user_id;
                    meet_obj['teacher_id'] = myTeacher_arr[p];

                    userNextTime = meet_obj['time_end'];

                    var index = timeObj[myTeacher_arr[p]].indexOf(meet_obj['time_start']);
                    timeObj[myTeacher_arr[p]].splice(index, 1);
                    schPtm.push(meet_obj);
                }

                callback2();
            }, function (err) {
                
                async.eachOfSeries(schPtm, function (list3, i, callback3) {
                
                var updateTime={}; 
                updateTime['start_time']=list3['time_start']; 
                updateTime['end_time']=list3['time_end']; 
                
                models.ptm_schedules.update(updateTime,{where:{
                        ptm_id:ptm_id,
                        user_id:list3['user_id'],
                        teacher_id:list3['teacher_id']
                        }
                
                    
                    });
                    
                    callback3();
                }, function (err) {    
                res(schPtm); 
                });
                //res.send(schPtm);
                   
                //res.render('ptm', {total_teacher: total_teacher, data: schPtm});
            });

            //res.send(meet_arr);
            //res.render('ptm', {total_teacher: total_teacher, data: meet_arr});

        });   
    }
    
    });
    });
    
  }
  
  function addMinutes(time, minsToAdd) {
    function D(J) {
        return (J < 10 ? '0' : '') + J;
    }
    ;
    var piece = time.split(':');
    var mins = piece[0] * 60 + +piece[1] + +minsToAdd;

    return D(mins % (24 * 60) / 60 | 0) + ':' + D(mins % 60);
}


  this.markSheet= function(req, res){
      
      
    qry = " SELECT "
    qry += " group_concat(distinct ed.name) head, "
    qry += " group_concat(distinct sub.name) sub "
    qry += "FROM exam_schedules es left join examhead_details ed on es.examheadId=ed.examheadId "
    qry += "left join  exam_schedule_details esd on es.id=esd.examScheduleId  "
    qry += "left join subject_details sub on esd.subjectId=sub.subjectId "
    qry += " where es.masterId=164 and classId=37 "

    
    models.sequelize.query(qry, {replacements: [], type: models.sequelize.QueryTypes.SELECT}).then(function (results) {
    //res(result);  
//    if(results.length){
//      res(results);  
//    }
    
    res(results); 
    
    });
    
  }
  
  
  this.markSheetAll= function(req, res){
      
    var dataload = req.body.data ? JSON.parse(req.body.data) : req.body;
    var masterId =dataload.masterId;   
    var marksheet_qry = " SELECT group_concat(name) head_name FROM examhead_details ";  
    marksheet_qry += " WHERE  find_in_set(examheadId,(select exam_ids from marksheet_temp where bcsMapId=?))  ";  
    //models.sequelize.query(marksheet_qry, {replacements: [req.params.id], type: models.sequelize.QueryTypes.SELECT}).then(function (marksheet_data) {   
      
            
      
    var qry = " select subjectcategory_marks,tab.*,section_details.name sec,class_name,stu.dob,exm_head.name,stu_d.father_name,stu_d.mother_name,stu.enrollment_no,usd.fullname,stu_d.address,stu_r.roll_no from ( "
    qry += " SELECT mak.examScheduleId examScheduleId,bcsMapId,clsd.name class_name,group_concat(subjectcategory_marks order by sub.name SEPARATOR '##') subjectcategory_marks,group_concat(obtained_mark order by sub.name) mark,group_concat(sub.name order by sub.name) sub,mak_r.studentId,examheadId "
    qry += " FROM  "
    qry += " marks mak left join mark_records mak_r on mak.id=mak_r.markId " 
    qry += " left join exam_schedules es on mak.examScheduleId=es.id "
    qry += " left join subject_details sub on mak.subjectId=sub.subjectId and sub.languageId=1 "
    qry += " left join class_details clsd on es.classId=clsd.classId and clsd.languageId=1"
    qry += " where mak.masterId=? "
    //qry += " and es.classId=?  "
    qry += " and mak.bcsMapId=? and es.is_active=1 and mak_r.studentId in (SELECT studentId "
    qry += " FROM student_records where record_status=1 and bcsMapId=? and masterId=? and "
    qry += " (transferred=0 or (transferred=1 and transerred_effective_from > curdate()) or  (transferred=2 and transerred_effective_from <= curdate())))  "
    //qry += " and examheadId in (3,20,28,19) "
    qry += " group by examheadId,mak_r.studentId "
    qry += " order by mak_r.studentId ) tab "
    qry += " left join examhead_details exm_head on tab.examheadId=exm_head.examheadId  "
    //qry += " left join users usr on tab.studentId=usr.id "
    //
    qry += " left join students st on tab.studentId=st.id "
    qry += " LEFT JOIN users usr ON st.userId=usr.id "
    
    
    
    qry += " left join user_details usd on usr.id=usd.userId and usd.languageId=1 "
    qry += " left join students stu on usr.id=stu.userId "
    qry += " left join student_details stu_d on stu.id=stu_d.studentId and stu_d.languageId=1 "
    qry += " left join student_records stu_r on stu.id=stu_r.studentId "
    
    qry +=" left join bcs_maps on tab.bcsMapId=bcs_maps.id "
    qry +=" left join section_details on bcs_maps.sectionId=section_details.sectionId and section_details.languageId=1 "
    
    qry += " where usr.is_active=1 and (transferred=0 or (transferred=1 and transerred_effective_from > curdate()) or  (transferred=2 and transerred_effective_from <= curdate())) order by stu_r.roll_no asc "
    qry +=" ,FIELD(exm_head.name,'Per. Test-1','Note Book-1','SUB.ENR.-1','SUB.ENR.-2','Note Book-2','SUB.ENR','Note Book','MT')  "

    var all_test=[];
    var all_sub=[];
    models.sequelize.query(qry, {replacements: [masterId,req.params.id,req.params.id,masterId], type: models.sequelize.QueryTypes.SELECT}).then(function (results) {
    //res(result);  
    //console.log(req);
    //console.log(results);
//    if(results.length){
//      res(results);  
//    }
    
      var st_arr=[];
      
      var head_obj={};
      var total={};
      var last_stid='';
      var st_obj={}; 
      var counter=0;
      var subjectcategory_marks_arr=[];
      async.forEach(results, function (item, callback) {
          
      //var st_obj={};    
      var st_id =item['studentId'];
      
      
      if(last_stid != st_id && last_stid !=''){
      st_obj['total']=total;   
      st_arr.push(st_obj);
      st_obj={};
      head_obj={};
      total={};
      }
                 
              
      var sub_arr=item['sub'].split(',');
      var mak_arr=item['mark'].split(',');
      if(item['subjectcategory_marks']){
      var subjectcategory_marks_arr=item['subjectcategory_marks'].split('##');
      }
      var obj_sm={};
      
      if(sub_arr.length > all_sub.length){   
      all_sub=sub_arr;
      }
      
      if(all_test.indexOf(item['name']) ===-1){          
      all_test.push(item['name']);    
      }
      
      
      //console.log(mak_arr);
      //console.log(last_stid);
      //console.log(total);
      var subjectcategory_marks_obj={};
      for(var i=0;i< sub_arr.length; i++){
          
          
      
         obj_sm[sub_arr[i]]=mak_arr[i];
         
         
         if(subjectcategory_marks_arr && subjectcategory_marks_arr[i]){
         subjectcategory_marks_obj[sub_arr[i]]=subjectcategory_marks_arr[i];
         
         }
         
         var total_m=0;
         if(total[sub_arr[i]]){
         total_m=total[sub_arr[i]];        
         }
         //console.log('total_m----------------');
        //console.log(total_m);
//         console.log(mak_arr[i]);
         
         total[sub_arr[i]]=parseFloat(total_m)+parseFloat(mak_arr[i]); 
         //console.log(total_m);
      }
      obj_sm['subjectcategory_marks']=subjectcategory_marks_obj;
      //console.log(total);
      
      head_obj[item['name']]=obj_sm;
      head_obj['dob']=item['dob'];
      head_obj['mother_name']=item['mother_name'];
      head_obj['father_name']=item['father_name'];
      head_obj['enrollment_no']=item['enrollment_no'];
      head_obj['fullname']=item['fullname'];
      head_obj['address']=item['address'];
      head_obj['roll_no']=item['roll_no'];
      head_obj['examScheduleId']=item['examScheduleId'];
      if(last_stid==''){
      head_obj['user_id']=st_id;
      }else{
      head_obj['user_id']=st_id;
      }
      head_obj['class_name']=item['class_name'];
      head_obj['sec']=item['sec'];
      head_obj['subjectcategory_marks']=item['subjectcategory_marks'];
      
      //st_obj[st_id]=head_obj; 
      st_obj['st_id']=head_obj; 
      
      //console.log(st_obj);
       //console.log(st_obj);
      
      
//      console.log('total--------------------------------');
//      console.log(st_id);
//      console.log(total);
//      console.log('total--------------------------------');

      counter++; 
      
      if(results.length==counter){
      
      st_obj['total']=total;   
      st_arr.push(st_obj);
      st_obj={};
      head_obj={};
      total={};        
          
      }
      
      last_stid=st_id;    
         
      callback();
      }, function () {
        
        //console.log(st_arr);
        //console.log(all_sub);
        //console.log(all_test);
        
        //console.log(st_arr);
        
          var idArr=[42,41,40,39,111]

        if(idArr.indexOf(parseInt(req.params.id)) == -1){
            
        var act_qry=' SELECT *,  ';
        act_qry +=" group_concat(trim(name) order by FIELD(trim(name),'Games','Music','Yoga','Discipline','Personality Development','Personality Development ','Confidance','Punctuality','Initiative','Behaviour','Sincerity','Health & Phy. Edu.')) act_name, ";
        act_qry +=" group_concat(obtained_mark order by FIELD(trim(name),'Games','Music','Yoga','Discipline','Personality Development','Personality Development ','Confidance','Punctuality','Initiative','Behaviour','Sincerity','Health & Phy. Edu.')) mak ";
        act_qry +=' FROM exam_schedules es  ';
        act_qry +=' left join activity_schedules acs on es.id=acs.examscheduleId ';
        act_qry +=' left join activity_details acd on acs.activityId=acd.activityId ';
        act_qry +=' left join activity_marks actm on  acs.id=actm.activityScheduleId ';
        act_qry +=' left join activity_mark_records acmr on actm.id=acmr.activityMarkId ';
            act_qry +=' left join students st on acmr.studentId=st.id ';
        act_qry +=' where es.masterId=? and bcsMapId=? group by studentId '   
            
           
        }else{
        
        var act_qry=' SELECT *,  ';
        act_qry +=" group_concat(trim(name) order by FIELD(trim(name),'Sports & Games','Music and Dance','Art & Craft','Genral Knowledge','Confidance','Curiosity Level ','PersonalCleanliness','Eating Habits','Leadership Qualities','Adjustment With Classmates','Story Telling','Listening Span','Clarity In Speech','Ability To Speech Full Sentences','Regularity and Punctuality')) act_name, ";
        act_qry +=" group_concat(obtained_mark order by FIELD(trim(name),'Sports & Games','Music and Dance','Art & Craft','Genral Knowledge','Confidance','Curiosity Level ','PersonalCleanliness','Eating Habits','Leadership Qualities','Adjustment With Classmates','Story Telling','Listening Span','Clarity In Speech','Ability To Speech Full Sentences','Regularity and Punctuality')) mak ";
        act_qry +=' FROM exam_schedules es  ';
        act_qry +=' left join activity_schedules acs on es.id=acs.examscheduleId ';
        act_qry +=' left join activity_details acd on acs.activityId=acd.activityId ';
        act_qry +=' left join activity_marks actm on  acs.id=actm.activityScheduleId ';
        act_qry +=' left join activity_mark_records acmr on actm.id=acmr.activityMarkId ';
            act_qry +=' left join students st on acmr.studentId=st.id ';
        act_qry +=' where es.masterId=? and bcsMapId=? group by studentId '  
            
        }
	
	
        
        
        
        var all_act=[];
        var act_obj={};
        var act_main_obj={};
        models.sequelize.query(act_qry, {replacements: [masterId,req.params.id], type: models.sequelize.QueryTypes.SELECT}).then(function (act_data) {
            //console.log(act_data);
            
            
        async.forEach(act_data, function (act_items, callback4) {
            
            
        var act_arr=act_items['act_name'].split(',');
        var act_mak=act_items['mak'].split(',');
        
        act_obj={};
        for(var i=0;i< act_arr.length; i++){
      
         act_obj[act_arr[i]]=act_mak[i];
                
        }
        act_main_obj[act_items['studentId']]=act_obj;
        

        if(act_arr.length > all_act.length){
        all_act=act_arr;
        }

                       
        
        callback4();
        }, function () {
            //console.log(st_arr);
       
        
        var cat_qry=' SELECT subjectCategoryId,name FROM subject_categories sc left join subject_category_details scd   ';
        cat_qry +=" on sc.id=scd.subjectCategoryId where masterId=? ";

        models.sequelize.query(cat_qry, {replacements: [masterId], type: models.sequelize.QueryTypes.SELECT}).then(function (cat_data) {
            //console.log(act_data);
            
        var cat_obj={};
        async.forEach(cat_data, function (cat_itms, callback5) {
        
        cat_obj[cat_itms.subjectCategoryId]=cat_itms.name;    
            
        callback5();
        }, function () {
            
            
        var cat_qry_total=' SELECT examScheduleId,max_marks,subjectCategoryId  FROM exam_schedule_subject_categories   ';
        

        models.sequelize.query(cat_qry_total, {replacements: [], type: models.sequelize.QueryTypes.SELECT}).then(function (cat_data_total) {    
        
        cat_total_obj={};
        async.forEach(cat_data_total, function (cat_total, callback6) {
        
        cat_total_obj[cat_total.examScheduleId+'_'+cat_total.subjectCategoryId]=cat_total.max_marks;    
            
        callback6();
        }, function () {    
             
            
        
        //console.log(cat_total_obj);
                        
        res({marks:st_arr,sub:all_sub,head:all_test,all_act:all_act,act_main_obj:act_main_obj,cat_obj:cat_obj,cat_total_obj:cat_total_obj}); 
        
        });
        });
        });
        });
        });
        });
        
        
        
      });
    
    
    
    
    //res(results); 
    
    });
    //});
    
  }
  
  this.markSheetAll6oct= function(req, res){
      
    //console.log('req-----------------');  
    //console.log(req.params);  
    var dataload = JSON.parse(req.body.data);
    var masterId =dataload.masterId;   
    var marksheet_qry = " SELECT group_concat(name) head_name FROM examhead_details ";  
    marksheet_qry += " WHERE  find_in_set(examheadId,(select exam_ids from marksheet_temp where bcsMapId=?))  ";  
    //models.sequelize.query(marksheet_qry, {replacements: [req.params.id], type: models.sequelize.QueryTypes.SELECT}).then(function (marksheet_data) {   
      
      
      
      
    var qry = "  select tab.*,section_details.name sec,class_name,stu.dob,exm_head.name,stu_d.father_name,stu_d.mother_name,stu.enrollment_no,usd.fullname,stu_d.address,stu_r.roll_no from ( "
    qry += " SELECT bcsMapId,clsd.name class_name,group_concat(obtained_mark order by sub.name) mark,group_concat(sub.name order by sub.name) sub,mak_r.studentId,examheadId "
    qry += " FROM  "
    qry += " marks mak left join mark_records mak_r on mak.id=mak_r.markId " 
    qry += " left join exam_schedules es on mak.examScheduleId=es.id "
    qry += " left join subject_details sub on mak.subjectId=sub.subjectId "
    qry += " left join class_details clsd on es.classId=clsd.classId "
    qry += " where mak.masterId=? "
    //qry += " and es.classId=?  "
    qry += " and mak.bcsMapId=?  "
    //qry += " and examheadId in (3,20,28,19) "
    qry += " group by examheadId,mak_r.studentId "
    qry += " order by mak_r.studentId ) tab "
    qry += " left join examhead_details exm_head on tab.examheadId=exm_head.examheadId "
    //qry += " left join users usr on tab.studentId=usr.id "
    //
    qry += " left join students st on tab.studentId=st.id "
    qry += " LEFT JOIN users usr ON st.userId=usr.id "
    
    
    
    qry += " left join user_details usd on usr.id=usd.userId "
    qry += " left join students stu on usr.id=stu.userId "
    qry += " left join student_details stu_d on stu.id=stu_d.studentId "
    qry += " left join student_records stu_r on stu.id=stu_r.studentId "
    
    qry +=" left join bcs_maps on tab.bcsMapId=bcs_maps.id "
    qry +=" left join section_details on bcs_maps.sectionId=section_details.sectionId "
    
    qry += " order by stu_r.roll_no asc "
    qry +=" ,FIELD(exm_head.name,'Per. Test-1','Note Book-1','SUB.ENR.-1','SUB.ENR.-2','Note Book-2','SUB.ENR','Note Book','MT') "

    var all_test=[];
    var all_sub=[];
    models.sequelize.query(qry, {replacements: [masterId,req.params.id], type: models.sequelize.QueryTypes.SELECT}).then(function (results) {
    //res(result);  
    //console.log(req);
    //console.log(results);
//    if(results.length){
//      res(results);  
//    }
    
      var st_arr=[];
      
      var head_obj={};
      var total={};
      var last_stid='';
      var st_obj={}; 
      var counter=0;
      
      async.forEach(results, function (item, callback) {
          
      //var st_obj={};    
      var st_id =item['studentId'];
      
      //console.log(st_id);
      
      if(last_stid != st_id && last_stid !=''){
      st_obj['total']=total;   
      st_arr.push(st_obj);
      st_obj={};
      head_obj={};
      total={};
      }
                 
      
            
      var sub_arr=item['sub'].split(',');
      var mak_arr=item['mark'].split(',');
      var obj_sm={};
      
      if(sub_arr.length > all_sub.length){
      all_sub=sub_arr;
      }
      
      if(all_test.indexOf(item['name']) ===-1){          
      all_test.push(item['name']);    
      }
      
      
      //console.log(mak_arr);
      
      for(var i=0;i< sub_arr.length; i++){
      
         obj_sm[sub_arr[i]]=mak_arr[i];
                  
         var total_m=0;
         if(total[sub_arr[i]]){
         total_m=total[sub_arr[i]];        
         }
         total[sub_arr[i]]=parseFloat(total_m)+parseFloat(mak_arr[i]); 
      }
      //console.log(obj_sm);
      head_obj[item['name']]=obj_sm;
      head_obj['dob']=item['dob'];
      head_obj['mother_name']=item['mother_name'];
      head_obj['father_name']=item['father_name'];
      head_obj['enrollment_no']=item['enrollment_no'];
      head_obj['fullname']=item['fullname'];
      head_obj['address']=item['address'];
      head_obj['roll_no']=item['roll_no'];
      head_obj['user_id']=last_stid;
      head_obj['class_name']=item['class_name'];
      head_obj['sec']=item['sec'];
      
      
      //st_obj[st_id]=head_obj; 
      st_obj['st_id']=head_obj; 
      
      //console.log(st_obj);
      
      
      
//      console.log('total--------------------------------');
//      console.log(st_id);
//      console.log(total);
//      console.log('total--------------------------------');

      counter++; 
      
      if(results.length==counter){
      
      st_obj['total']=total;   
      st_arr.push(st_obj);
      st_obj={};
      head_obj={};
      total={};        
          
      }
      
      last_stid=st_id;    
         
      callback();
      }, function () {
        res({marks:st_arr,sub:all_sub,head:all_test}); 
        
      });
    
    
    
    
    //res(results); 
    
    });
    //});
    
  }
  
  this.markSheetAllBackup= function(req, res){
      
   var masterId = req.masterId;      
   var qry = "  select tab.*,stu.dob,exm_head.name,stu_d.father_name,stu_d.mother_name,stu.enrollment_no,usd.fullname,stu_d.address,stu_r.roll_no from ( "
    qry += " SELECT group_concat(obtained_mark order by sub.name) mark,group_concat(sub.name order by sub.name) sub,mak_r.studentId,examheadId "
    qry += " FROM  "
    qry += " marks mak left join mark_records mak_r on mak.id=mak_r.markId " 
    qry += " left join exam_schedules es on mak.examScheduleId=es.id "
    qry += " left join subject_details sub on mak.subjectId=sub.subjectId "
    qry += " where mak.masterId=? and classId=?  "
    //qry += " and examheadId in (3,20,28,19) "
    qry += " group by examheadId,mak_r.studentId "
    qry += " order by mak_r.studentId ) tab "
    qry += " left join examhead_details exm_head on tab.examheadId=exm_head.examheadId "
    //qry += " left join users usr on tab.studentId=usr.id "
    //
    qry += " left join students st on tab.studentId=st.id "
    qry += " LEFT JOIN users usr ON st.userId=usr.id "
    
    
    
    qry += " left join user_details usd on usr.id=usd.userId "
    qry += " left join students stu on usr.id=stu.userId "
    qry += " left join student_details stu_d on stu.id=stu_d.studentId "
    qry += " left join student_records stu_r on stu.id=stu_r.studentId "
    qry += " order by stu_r.roll_no asc "

    
    models.sequelize.query(qry, {replacements: [masterId,req.params.id], type: models.sequelize.QueryTypes.SELECT}).then(function (results) {
    //res(result);  
//    if(results.length){
//      res(results);  
//    }
    
      var st_arr=[];
      
      var head_obj={};
      var total={};
      var last_stid='';
      var st_obj={}; 
      var counter=0;
      async.forEach(results, function (item, callback) {
          
      //var st_obj={};    
      var st_id =item['studentId'];
      
      if(last_stid != st_id && last_stid !=''){
      st_obj['total']=total;   
      st_arr.push(st_obj);
      st_obj={};
      head_obj={};
      total={};
      }
                 
      
            
      var sub_arr=item['sub'].split(',');
      var mak_arr=item['mark'].split(',');
      var obj_sm={};
      
      for(var i=0;i< sub_arr.length; i++){
      
         obj_sm[sub_arr[i]]=mak_arr[i];
                  
         var total_m=0;
         if(total[sub_arr[i]]){
         total_m=total[sub_arr[i]];        
         }
         total[sub_arr[i]]=parseFloat(total_m)+parseFloat(mak_arr[i]); 
      }
      head_obj[item['name']]=obj_sm;
      head_obj['dob']=item['dob'];
      head_obj['mother_name']=item['mother_name'];
      head_obj['father_name']=item['father_name'];
      head_obj['enrollment_no']=item['enrollment_no'];
      head_obj['fullname']=item['fullname'];
      head_obj['address']=item['address'];
      head_obj['roll_no']=item['roll_no'];
      head_obj['user_id']=last_stid;
      
      
      //st_obj[st_id]=head_obj; 
      st_obj['st_id']=head_obj; 
      


      counter++; 
      
      if(results.length==counter){
      
      st_obj['total']=total;   
      st_arr.push(st_obj);
      st_obj={};
      head_obj={};
      total={};        
          
      }
      
      last_stid=st_id;    
         
      callback();
      }, function () {
        
        res(st_arr); 
        
      });
    
    
    
    
    //res(results); 
    
    });
    
  }
  
  this.markSheetData= function(req, res){
      
   
   var qry = "  select tab.*,exm_head.name from ( "
    qry += " SELECT group_concat(obtained_mark order by sub.name) mark,group_concat(sub.name order by sub.name) sub,mak_r.studentId,examheadId "
    qry += " FROM  "
    qry += " marks mak left join mark_records mak_r on mak.id=mak_r.markId " 
    qry += " left join exam_schedules es on mak.examScheduleId=es.id "
    qry += " left join subject_details sub on mak.subjectId=sub.subjectId "
    qry += " where mak.masterId=164 and classId=37 and examheadId in (3,20,28,19) "
    qry += " group by examheadId,mak_r.studentId "
    qry += " order by mak_r.studentId ) tab "
    qry += " left join examhead_details exm_head on tab.examheadId=exm_head.examheadId "
    qry += " left join users usr on tab.studentId=usr.id "
    qry += " order by studentId asc limit 10 "

    
    models.sequelize.query(qry, {replacements: [], type: models.sequelize.QueryTypes.SELECT}).then(function (results) {
    //res(result);  

//    if(results.length){
//      res(results);  
//    }
    
      var st_arr=[];
      
      var head_obj={};
      var last_stid='';
      async.forEach(results, function (item, callback) {
      var st_obj={};    
      var st_id =item['studentId'];
                 
      
            
      var sub_arr=item['sub'].split(',');
      var mak_arr=item['mark'].split(',');
      var obj_sm={};
      for(var i=0;i< sub_arr.length;i++){
      
         obj_sm[sub_arr[i]]=mak_arr[i];
          
      }
      
      head_obj[item['name']]=obj_sm;
      
      
      //st_obj[st_id]=head_obj; 
      st_obj['st_id']=head_obj; 
      
      if(last_stid !=st_id && last_stid !=''){
      st_arr.push(st_obj);
      }
         
      last_stid=st_id;    
          
      callback();
      }, function () {
        
        
        
        
        async.forEach(st_arr, function (items, callback2) {
                        
       async.forEach(Object.keys(items['st_id']), function (item3, callback3){ 

        callback3(); 

        }, function(err) {
        res(st_arr); 
        });    
        
        
        callback2();
        }, function () {
        
        });
        
      });
    //res(results); 
    });
  }
}

module.exports = new Empleavetype();
