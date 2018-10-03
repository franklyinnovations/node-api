var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');

var oauth = require('./oauth');
var mail = require('./mail');
var bcrypt = require('bcrypt-nodejs');
var randomstring = require("randomstring");
var sms = require('./sms');

function myController(){

    this.getByMobile = function(req, res){
        models.user.find({where:{mobile:req.body.mobile,user_type:'parent'}}).then(function(data){
	        if (data){
		        module.exports.sentOtp(req, function(otpData){     
                    otpData.rstatus=otpData.status;  
                    delete otpData.status; 
                    res({status:true, message:'Verified',data:[{verify:2,otp:otpData}]});
		        });
	        } else{
		        models.student.find({where:{
			        $or: [
			        {father_contact:req.body.mobile},
			        {father_contact_alternate:req.body.mobile},
			        {mother_contact:req.body.mobile},
			        {mother_contact_alternate:req.body.mobile},
			        {guardian_contact:req.body.mobile},
			        {guardian_contact_alternate:req.body.mobile},
			        ]
		        }
		        }).then(function(studentData){

		        if (studentData){
			        //Call Register
			        
			        module.exports.sentOtp(req, function(otpData){    
				        otpData.rstatus=otpData.status;  
				        delete otpData.status; 
				        res({status:true, message:'Verified',data:[{verify:1,otp:otpData}]});
			        });
		        } else{
		        	res({status:true, message:'Not Verified',data:[{verify:0}]});
		        }

		        }).catch(function (err) {
		        	console.log(err);
		        });
	        }
        }).catch(function (err) {
        console.log(err);
        });
    }


    // this.sentOtp = function(req, res){
    // //ringcaptcha-nodejs
    // var ringcaptcha = require('ringcaptcha-nodejs');

    // var mobile=req.body.country_code+req.body.mobile;
    // var request = require("request");

    // var options = { method: 'POST',
    // url: 'https://api.ringcaptcha.com/ojene7uty6acydidu5u9/code/SMS',
    // headers:
    // { 'postman-token': '22796ab7-b6eb-7b8c-8216-143f280e6131',
    //  'cache-control': 'no-cache',
    //  'content-type': 'application/x-www-form-urlencoded' },
    // form: {app_key:'ojene7uty6acydidu5u9',phone:mobile,api_key:'19791f2e9d8016fe30544e001e0ad3ae9e122fb6'}};

    // request(options, function (error, response, body) {
    // if (error) throw new Error(error);
    // res(body);
    // });

    // }

    this.sentOtp = function(req, res){
        var mobile=req.body.country_code+req.body.mobile;
        sms.otpSend({mobile: mobile, countryCode: req.body.country_code}, function(response){
            res(response);
        });
    };

    // this.verfiyOtp = function(req, res){
    // var mobile=req.body.country_code+req.body.mobile;
    // var request = require("request");

    // var options = { method: 'POST',
    // url: 'https://api.ringcaptcha.com/ojene7uty6acydidu5u9/verify',
    // headers:
    // { 'postman-token': '22796ab7-b6eb-7b8c-8216-143f280e6131',
    //  'cache-control': 'no-cache',
    //  'content-type': 'application/x-www-form-urlencoded' },
    // form: { app_key: 'ojene7uty6acydidu5u9', phone:mobile, api_key: '19791f2e9d8016fe30544e001e0ad3ae9e122fb6', code:req.body.code, token:req.body.token } };

    // request(options, function (error, response, body) {
    // if (error) throw new Error(error);

    // res(body);
    // });

    // }

    this.verfiyOtp = function(req, res){
        sms.otpVerify({token:req.body.token, code:req.body.code, countryCode: req.body.country_code}, function(response){
            res(response);
        });
    };


    this.saveParent = function(req, res){
    	var saveObj = {};
        var UserHasOne = models.user.hasOne(models.userdetail, {as: 'user_detail'});
        module.exports.createUserName({fullname:req.body.fullname}, function(username){
            saveObj.user_name = username;
            saveObj.password = req.password = bcrypt.hashSync(saveObj.user_name, null, null);
            saveObj.mobile = req.body.mobile;
            saveObj.default_lang = 1;
            saveObj.masterId = 0;
            saveObj.roleId = 0;
            saveObj.email = req.body.email;
            saveObj.is_active = 1;
            saveObj.user_type = 'parent';
            saveObj.device_id = req.body.deviceId;
            saveObj.device_type = req.body.device_type;
            saveObj.user_detail = {fullname:req.body.fullname, languageId:1};
            models.user.create(saveObj, {include: [UserHasOne]}).then(function(userData){
            	module.exports.useInfo({id:userData.id, languageId:userData.default_lang, masterId:userData.masterId}, function(userInfo){
	              	language.getUserLanguages(userData,function(langData){
		                language.geLanguageById({id:userData.default_lang},function(primaryLang){
			                  module.exports.wardList(req, function(ward_list){
				                  var nodedata = userData.get({ plain: true });
				                  nodedata.ward_list=ward_list;
				                  res({status:true,message:language.lang({key:"success", lang:req.lang}),data:nodedata,servicePath: global.image_url, primaryLang:{code:primaryLang.code, name:primaryLang.name, direction:primaryLang.direction}, languages:langData, servicePath: global.image_url, modules:{}, userdetails:userInfo});
			                  });
		                  });
	                });
                });

    		});
        });
    }


    this.parentLogin = function(req, res){
        module.exports.verfiyOtp(req, function(otpData){      
        //-----------------For Local ENV------------------------------------------->>>>>>>>>>        
        if(otpData.status!='ERROR'){
            if(req.body.parent_registered == 1){
            	module.exports.saveParent(req, function(regData){
            		res(regData);
            	});
            }else{
            	models.user.find({where:{mobile:req.body.mobile,user_type:'parent'}}).then(function(userData){
    	         if (userData === null) {
    	            res({status:false, message:language.lang({key:"invalid_detail", lang:req.lang})});
    	          } else {
    	            if (userData.user_type !== 'student' || req.deviceType !== 'DESKTOP') {
    	              if (userData.is_active === 1) {
    	                if (0) {
    	                    res({status:false, message:language.lang({key:"invalid_detail", lang:req.lang})});
    	                } else {
    	                  models.user.update({device_id: req.body.deviceId, device_type: req.body.device_type}, {where: {id:userData.id}}).then(function () {
    		                    module.exports.useInfo({id:userData.id, languageId:userData.default_lang, masterId:userData.masterId}, function(userInfo){
                                    language.getUserLanguages(userData,function(langData){
        		                        language.geLanguageById({id:userData.default_lang},function(primaryLang){
                                            module.exports.wardList(req, function(ward_list){
                                            var nodedata = userData.get({ plain: true });
                                            nodedata.ward_list=ward_list;
                                            if(ward_list.length > 0){
                                                res({status:true,message:language.lang({key:"success", lang:req.lang}),data:nodedata,servicePath: global.image_url, primaryLang:{code:primaryLang.code, name:primaryLang.name, direction:primaryLang.direction}, languages:langData, servicePath: global.image_url, modules:{}, userdetails:userInfo});
                                            }else{
                                                res({status:false,message:language.lang({key:"No child mapped with this number!", lang:req.lang})});
                                            }
                                            
                                            });
                                        });
                                    });
                                });
    	                    });
    	                }
    	              } else {
    	                res({status:false, message:language.lang({key:"accountDeactivated", lang:req.lang})});
    	              }
    	            } else {
    	              res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang})});
    	            }
    	          }
               });
            }
        }else {
            res({status:req.body.device_type === 'a' && req.body.country_code !== '+91', message:language.lang({key:otpData.message, lang:req.lang})});
        }
    });
    }


    this.parentLoginDemo = function(req, res){

        //module.exports.verfiyOtp(req, function(otpData){
        //otpData=JSON.parse(otpData);
        if(0){
        res({status:true,message:otpData.message,data:otpData});
        }else{

        models.user.find({where:{mobile:req.body.mobile,user_type:'parent'}}).then(function(userData){
         if (userData === null) {
            res({status:false, message:language.lang({key:"invalid_detail", lang:req.lang})});
          } else {
            if (userData.user_type !== 'student' || req.deviceType !== 'DESKTOP') {
              if (userData.is_active === 1) {
                //if (!bcrypt.compareSync(req.userpassword, userData.password)) {
                if (0) {
                    res({status:false, message:language.lang({key:"invalid_detail", lang:req.lang})});
                } else {
                  models.user.update({device_id: req.body.deviceId, device_type: req.body.device_type}, {where: {id:userData.id}}).then(function () {
                    //module.exports.useInfo({id:userData.id, languageId:userData.default_lang, masterId:userData.masterId}, function(userInfo){
                      //language.getUserLanguages(userData,function(langData){
                        //language.geLanguageById({id:userData.default_lang},function(primaryLang){
                          //module.exports.getModules({roleId:userData.roleId, id:userData.id},function(modules){
                          module.exports.wardList(req, function(ward_list){
                          var nodedata = userData.get({ plain: true });
                          nodedata.ward_list=ward_list;
                          res({status:true,message:language.lang({key:"success", lang:req.lang}),data:nodedata,servicePath: global.image_url});
                          });
                          //res({status:true, message:language.lang({key:"success", lang:req.lang}), data:userData, primaryLang:{code:primaryLang.code, name:primaryLang.name, direction:primaryLang.direction}, languages:langData, servicePath: global.image_url, modules:modules, userdetails:userInfo});
                          //});
                        //});
                      //});
                    });
                  //}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              } else {
                res({status:false, message:language.lang({key:"accountDeactivated", lang:req.lang})});
              }
            } else {
              res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang})});
            }
          }
        });
        }
    }
    
    
    
    this.getLastScheduleId = function(req, res){
    qry = " SELECT subjectId,studentId,examScheduleId,obtained_mark FROM marks m  "
    qry += " left join mark_records mr "
    qry += " on m.id=mr.markId where studentId=? order by mr.id desc limit 1 "     
    models.sequelize.query(qry, {replacements: [req.body.studentId], type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
    res(result);    
    });
    }
    
    
    this.getLastExam = function(req, res){
    qry = " SELECT es.examheadId,max(date) max_date FROM "
    qry += " exam_schedules es left join exam_schedule_details esd on es.id=esd.examScheduleId "
    qry += "left join examhead_details ed on esd.examScheduleId=ed.id "
    qry += "where es.masterId=? and es.boardId=? and es.classId=? and es.academicSessionId=? "
    qry += "group by ed.examheadId having ? <= max(date) order by date Asc limit 1 ";       
    models.sequelize.query(qry, {replacements: [req.body.masterId,req.body.boardId,req.body.classId,req.body.academicSessionId,req.body.date], type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
    res(result);    
    });
    }
    
    this.getSession = function(req, res){
    qry = " SELECT * FROM academic_sessions where id=? ";       
    models.sequelize.query(qry, {replacements: [req.body.academicSessionId], type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
    res(result);    
    });
    }
    
    this.wardList = function(req, res){
    qry = " ";    
    qry += " SELECT us.is_active,us.user_image user_image,s.userId,ind.name institute,cd.name class,u.fullname,sd.name section,sr.masterId,sr.academicSessionId,sr.bcsMapId,sr.studentId,us.default_lang,us.secondary_lang,us.user_type  "
    qry += " FROM students s left join users us on s.userId=us.id  left join user_details u on s.userId=u.userId "
    //qry += " left join student_records sr on s.masterId=sr.masterId and s.id=sr.studentId "
    qry += " left join (select student_records.* from student_records left join "
    qry += " (SELECT max(id) max_id,studentId FROM student_records group by studentId) st_rec on student_records.id=st_rec.max_id) sr on s.masterId=sr.masterId and s.id=sr.studentId  "
    qry += " left join bcs_maps bcs on sr.bcsMapId=bcs.id   " 
    qry += " left join class_details cd on bcs.classId=cd.classId  "
    qry += " left join section_details sd on bcs.sectionId=sd.sectionId  "
    qry += " left join institutes ins on s.masterId=ins.userId  "
    qry += " left join institute_details ind on ins.id=ind.instituteId  "
    qry += " where ((s.father_contact=? or s.father_contact_alternate=? or s.mother_contact=? or s.mother_contact_alternate=? or s.guardian_contact=? or s.guardian_contact_alternate=?) and u.languageId=? and us.is_active=1 and cd.languageId = ? and sd.languageId = ? and ind.languageId=? )"
    qry += " AND `sr`.`record_status` = 1\
             AND ((`sr`.`transferred` = 0)\
             OR (\`sr`.`transferred` = 1 AND `sr`.`transerred_effective_from` > '" + moment().format('YYYY-MM-DD') + "')\
             OR (`sr`.`transferred` = 2 AND `sr`.`transerred_effective_from` <= '" + moment().format('YYYY-MM-DD') + "'))"
    qry += " AND sr.academicSessionId = (SELECT defaultSessionId from users where id = s.masterId)"         
    qry += " group by s.userId ";
    models.sequelize.query(qry, {replacements: [req.body.mobile,req.body.mobile,req.body.mobile,req.body.mobile,req.body.mobile,req.body.mobile,req.body.langId, req.body.langId, req.body.langId, req.body.langId], type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
             
       var langObj={};
       var counter=0;
       var counter2=0;
       var usrObj={}
       var languagesObj={}
       var primaryLangObj={}
       var plainData = result;
       //plainData.languages=langData;
       if(result.length > 0){
           async.forEach(result, function (item, callback) {
           module.exports.useInfo({id:item.userId, languageId:req.body.langId,masterId:item.masterId}, function(userInfo){
                language.getUserLanguages({masterId:item.masterId, langId:req.body.langId},function(langData){
                    //console.log(langData);
                    language.geLanguageById({id:req.body.langId},function(primaryLang){
                     
                    //plainData[counter]['primaryLang']=primaryLang;
                    //plainData[counter].languages=langData;
                    //plainData[counter].userInfo=userInfo;
                    usrObj[userInfo.userId]=userInfo;
                    primaryLangObj[userInfo.userId]=primaryLang;
                    languagesObj[userInfo.userId]=langData;

                    
                    if(result.length-1==counter){
                    
                    async.forEach(result, function (item, callback) {        
                    plainData[counter2].userInfo=usrObj[item.studentId];
                    plainData[counter2].primaryLang=primaryLangObj[item.studentId];
                    plainData[counter2].languages=languagesObj[item.studentId];
                    counter2++;
                    callback();
                    }, function () {
                    res(plainData);
                    });
                    
                    }
                    counter++;
                    //callback();
                    });
                });
            });
            
            }, function () {
            
            });
        }else{
            res(plainData);
        }
    }).catch(function (err) {
        console.log(err);
    });    
           
    }
    
    
    this.dashboard = function(req, res){
    qry = " ";    
    qry += " SELECT us.user_image user_image,s.userId,ind.name institute,cd.name class_name,u.fullname,sd.name section, "
    qry += " (select count(id) from messages where receiverId=? and msg_status in (1,2)) message_count,  "
    qry += " ifnull(concat(right(coalesce(asgd.title),50),' & ',count(asgd.title)-1,' More '),'') assignment,ifnull(coalesce(asg.start_date),'') due_date  "
    qry += " FROM  "
    qry += " students s left join users us on s.userId=us.id   "
    qry += " left join user_details u on s.userId=u.userId   "
    qry += " left join student_records sr on s.masterId=sr.masterId and s.id=sr.studentId   "
    qry += " left join bcs_maps bcs on sr.bcsMapId=bcs.id     "
    qry += " left join class_details cd on bcs.classId=cd.classId    "
    qry += " left join section_details sd on bcs.sectionId=sd.sectionId    "
    qry += " left join institutes ins on s.masterId=ins.userId    "
    qry += " left join institute_details ind on ins.id=ind.instituteId  "
    qry += " left join assignments asg on sr.masterId=asg.masterId and sr.academicSessionId=sr.academicSessionId and sr.bcsMapId=sr.bcsMapId  and (curdate() between asg.start_date and asg.end_date) and asg.assignment_status='Active' and asg.is_active=1 "
    qry += " left join assignment_details asgd on asg.id=asgd.assignmentId "
    qry += " where "
    qry += " `sr`.`record_status` = 1\
             AND ((`sr`.`transferred` = 0)\
             OR (\`sr`.`transferred` = 1 AND `sr`.`transerred_effective_from` > '" + moment().format('YYYY-MM-DD') + "')\
             OR (`sr`.`transferred` = 2 AND `sr`.`transerred_effective_from` <= '" + moment().format('YYYY-MM-DD') + "'))"
    qry += " AND sr.academicSessionId = (SELECT defaultSessionId from users where id = s.masterId)" 
    qry += " AND us.id=? "
    //qry += " and curdate() between asg.start_date and asg.end_date "
    models.sequelize.query(qry, {replacements: [req.body.user_id,req.body.user_id], type: models.sequelize.QueryTypes.SELECT}).then(function (result) {    
      //res({status:true,message:'',data:result});
      res(result);
    }).catch(function (err) {
        console.log(err);
    });    

    }
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var UserHasOne = models.user.hasOne(models.userdetail, {as: 'user_detail'});
    req.user_detail.languageId = req.langId;
    req.user_type = 'admin';
    var passwordForMail = req.password;
    var user = models.user.build(req);
    var userDetails = models.userdetail.build(req.user_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        user.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            userDetails.validate().then(function (err) {
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
          req.password = bcrypt.hashSync(req.password, null, null);
          delete req.confirm_password;
          if (typeof req.id !== 'undefined' && req.id !== '') {
            if (req.is_active === 0) {
              oauth.removeToken({id:req.id}, function(){});
            }
            req.user_detail.userId = req.id;
            models.user.update(req,{where: {id:req.id}, individualHooks: true}).then(function(data){
              models.userdetail.find({where:{userId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.user_detail.id = resultData.id;
                  models.userdetail.update(req.user_detail, {where:{id:resultData.id, userId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.user_detail.id;
                  models.userdetail.create(req.user_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.user_detail.languageId);
            module.exports.createUserName({fullname:req.user_detail.fullname}, function(username){
              req.user_name = username;
              models.user.create(req, {include: [UserHasOne]}).then(function(data){
                if (langId === 1) {
                  var mailData = {email: req.email, subject: language.lang({key:"registrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl}};
                  mail.sendHtmlMail(mailData, req.lang);
                  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                } else {
                  req.user_detail.userId = data.id;
                  req.user_detail.languageId = 1;
                  models.userdetail.create(req.user_detail).then(function(){
                    var mailData = {email: req.email, subject: language.lang({key:"registrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl}};
                    mail.sendHtmlMail(mailData, req.lang);
                    res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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

  /*
   * list of all
  */
 this.list = function(req, res) {
    //var data = JSON.parse(req.body.data);

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
    var langIdArr = reqData.langId.split(',');
    var isWhere = {};
    var orderBy = '';
    if (req.query) {
      var responseData = {};
      if (reqData.masterId !==1) {
        responseData.user = {masterId:reqData.masterId};
        responseData.user.id ={$ne:1};
        responseData.user.user_type = 'admin';
      } else {
        responseData.user = {id:{$ne:1}};
        responseData.user.user_type = 'admin';
      }
      responseData.userdetail = {languageId:{$in:langIdArr}};
      responseData.roledetail = {languageId:{$in:langIdArr}};
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

    models.user.hasMany(models.userdetail);
    models.user.belongsTo(models.role);
    models.role.hasMany(models.roledetail);

    models.user.findAndCountAll({
      include: [
        {model: models.userdetail, where:isWhere.userdetail, group:['userId']},
        {model:models.role, include: [{model: models.roledetail, where:isWhere.roledetail, group:['roleId']}]}
      ],
      where: isWhere.user,
      order: [
        ['id', 'DESC'],
        [ models.userdetail, 'languageId', reqData.orderby],
        [ models.role, models.roledetail, 'languageId', reqData.orderby]
      ],
      distinct: true,
      limit: setPage,
      offset: pag, subQuery: false
    }).then(function(result){
        var totalData = result.count;
        var pageCount = Math.ceil(totalData / setPage);
        res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    var langIdArr = req.langId.split(',');
    models.user.hasMany(models.userdetail);
    models.user.find({include: [{model: models.userdetail, where:{languageId:{$in:langIdArr}}}], where:{id:req.id},  order: [[ models.userdetail, 'languageId', req.orderby]]}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.user.update(req,{where:{id:req.id}}).then(function(data){
      oauth.removeToken(req, function(result){
        res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  * function login
  */
  this.login = function(req, res) {
    var device_type = (typeof req.device_type === 'undefined')?'web':req.device_type;
    var deviceType = (req.deviceType == 'DESKTOP')?'web':device_type;
    var deviceId = (typeof req.deviceId === 'undefined')?'':req.deviceId;
    var usr = models.user.build(req);
    usr.validate().then(function (err) {
      if (err !== null) {
        language.errors({errors:err.errors, lang:req.lang}, function(errors){
            err.errors = errors;
            res(err);
        });
      } else {
        models.user.find({where:{user_name:req.username}, attributes:['id', 'masterId', 'email', 'password', 'user_name', 'user_type', 'secondary_lang', 'roleId', 'default_lang', 'defaultSessionId' , 'createdAt', 'is_active']}).then(function(userData){
          if (userData === null) {
            res({status:false, message:language.lang({key:"invalid_detail", lang:req.lang})});
          } else {
            if (userData.user_type !== 'student' || req.deviceType !== 'DESKTOP') {
              if (userData.is_active === 1) {
                if (!bcrypt.compareSync(req.userpassword, userData.password)) {
                    res({status:false, message:language.lang({key:"invalid_detail", lang:req.lang})});
                } else {
                  models.user.update({device_id: deviceId, device_type: deviceType}, {where: {id:userData.id}}).then(function () {
                    module.exports.useInfo({id:userData.id, languageId:userData.default_lang, masterId:userData.masterId}, function(userInfo){
                      language.getUserLanguages(userData,function(langData){
                        language.geLanguageById({id:userData.default_lang},function(primaryLang){
                          module.exports.getModules({roleId:userData.roleId, id:userData.id},function(modules){
                            res({status:true, message:language.lang({key:"success", lang:req.lang}), data:userData, primaryLang:{code:primaryLang.code, name:primaryLang.name, direction:primaryLang.direction}, languages:langData, servicePath: global.image_url, modules:modules, userdetails:userInfo});
                          });
                        });
                      });
                    });
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              } else {
                res({status:false, message:language.lang({key:"accountDeactivated", lang:req.lang})});
              }
            } else {
              res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang})});
            }
          }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.createUserName = function(req, res){
    var timestamp = moment().unix();
    var randomToken = randomstring.generate(5);
    var uname = req.fullname.substr(0, 3).toLowerCase();
    var username = uname+'_'+timestamp;
    res(username);
  };

  this.createUserNameImport = function(req, res){
    var timestamp = moment().unix();
    var randomToken = randomstring.generate(4);
    var uname = req.fullname.substr(0, 3).toLowerCase();
    var username = uname+'_'+timestamp+randomToken;
    res(username);
  };

  this.useInfo = function(req, res){
    var userInfo = {};
    models.user.find({where:{id:req.id}, attributes:['id', 'default_lang', 'user_image', 'user_type']}).then(function(userData){
      module.exports.academicSession(req, function(sessionData){
        userInfo.default_lang = userData.default_lang;
        userInfo.academicSessions = sessionData;
        
        
        
        if (userData.user_type ==='teacher') {
          models.teacher.find({where:{userId:req.id}}).then(function(teacherData){
            userInfo.userId = teacherData.id;
            userInfo.user_image = userData.user_image;
            models.userdetail.find({where:{userId:req.id, languageId:req.languageId}}).then(function(userdetail){
              if (userdetail !== null) {
                userInfo.fullname = userdetail.fullname;
                res(userInfo);
              } else {
                models.userdetail.find({where:{userId:req.id, languageId:1}}).then(function(userdetail){
                  userInfo.fullname = userdetail.fullname;
                  res(userInfo);
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
              }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        } else if (userData.user_type ==='institute') {
          models.institute.find({where:{userId:req.id}}).then(function(instituteData){
            userInfo.userId = instituteData.id;
            userInfo.countryId = instituteData.countryId;
            userInfo.stateId = instituteData.stateId;
            userInfo.cityId = instituteData.cityId;
            userInfo.user_image = instituteData.institute_image;
            models.institutedetail.find({where:{instituteId:instituteData.id, languageId:req.languageId}}).then(function(institutedetail){
              if (institutedetail !== null) {
                userInfo.fullname = institutedetail.name;
                res(userInfo);
              } else {
                models.institutedetail.find({where:{instituteId:instituteData.id, languageId:1}}).then(function(institutedetail){
                  userInfo.fullname = institutedetail.name;
                  res(userInfo);
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
              }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        } else if (userData.user_type ==='student') {
          models.student.hasOne(models.studentrecord);
          models.studentrecord.belongsTo(models.bcsmap, {'foreignKey':'bcsMapId'});
          models.student.find({
            include:[
              {model:models.studentrecord.scope(
                  { method: ['transferred', moment().format('YYYY-MM-DD')]}
                  //{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', '(SELECT `defaultSessionId` FROM `users` WHERE `id` = `student`.`masterId`)']}
                ),
                attributes:['id', 'bcsMapId'],
                where:{
                    /*record_status:1,
                    $or: [
                        {transferred: 0}, 
                        {transferred: 1, transerred_effective_from: {$gt: moment().format('YYYY-MM-DD')}}, 
                        {transferred: 2, transerred_effective_from: {$lte: moment().format('YYYY-MM-DD')}}
                    ]*/
                },
              include: [
                {model: models.bcsmap}],
              },

            ],
            where:{userId:req.id},
            order:[[models.studentrecord, 'id', 'DESC']],
          }).then(async function(studentData){
            userInfo.userId = studentData.id;
            //userInfo.userId = studentData.userId;
            userInfo.bcsMapId = studentData.studentrecord.bcsMapId;
            userInfo.boardId = studentData.studentrecord.bcsmap.boardId;
            userInfo.classId = studentData.studentrecord.bcsmap.classId;
            userInfo.user_image = userData.user_image;
            userInfo.date_format = (
                await models.institute.find({
                    where: {userId: studentData.masterId},
                    attributes: ['date_format'],
                })
            ).date_format;
            models.userdetail.find({where:{userId:req.id, languageId:req.languageId}}).then(function(userdetail){
              if (userdetail !== null) {
                userInfo.fullname = userdetail.fullname;
                res(userInfo);
              } else {
                models.userdetail.find({where:{userId:req.id, languageId:1}}).then(function(userdetail){
                  userInfo.fullname = userdetail.fullname;
                  res(userInfo);
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
              }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }else{
          userInfo.userId = userData.id;
          userInfo.user_image = userData.user_image;
          models.userdetail.find({where:{userId:req.id, languageId:req.languageId}}).then(function(userdetail){
            if (userdetail !== null) {
              userInfo.fullname = userdetail.fullname;
              res(userInfo);
            } else {
              models.userdetail.find({where:{userId:req.id, languageId:1}}).then(function(userdetail){
                userInfo.fullname = userdetail.fullname;
                res(userInfo);
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  
  
  
  };

  this.academicSession = function(req, res){
    models.academicsession.hasMany(models.academicsessiondetail);
    models.academicsession.findAll({where:{masterId:req.masterId, is_active:1}, attributes:['id', 'start_date', 'end_date'], include: [{model: models.academicsessiondetail, where:{languageId:req.languageId}, attributes:['name']}], order: [['id', 'DESC']]}).then(function(sessionData){
      if (sessionData.length !== 0) {
        res(sessionData);
      } else {
        models.academicsession.findAll({where:{masterId:req.masterId, is_active:1}, attributes:['id', 'start_date', 'end_date'], include: [{model: models.academicsessiondetail, where:{languageId:1}, attributes:['name'], order: [['id', 'DESC']]}]}).then(function(sessionData){
         res(sessionData);
        });
      }
    });
  };

  /*
  * function forgotpassword
  */
  this.forgotpassword = function(req, res) {
    var usr = models.user.build(req);
    usr.validate().then(function (err) {
      if (err !== null) {
        language.errors({errors:err.errors, lang:req.lang}, function(errors){
            err.errors = errors;
            res(err);
        });
      } else {
        models.user.hasMany(models.userdetail);
        models.user.findAll({
          where:{user_name:req.username},
          include: [{model: models.userdetail, attributes: ['fullname'], group: ['userId']}],
          order: [[models.userdetail, 'languageId', 'ASC']]
        }).then(function(userData){
          if (!userData.length) {
            res({status:false, message:language.lang({key:"userNameNotExist", lang:req.lang})});
          } else {
            var rstPswrdToken = randomstring.generate();
            var rstPswrdVrfUrl = req.resetPassUrl+ rstPswrdToken;
            if (req.deviceType === 'PHONE') {
              if(userData[0].user_type === 'student' || userData[0].user_type === 'teacher') {
                  models.user.update({reset_password_token: rstPswrdToken}, {where: {id: userData[0].id}}).then(function () {
                    var mailData = {email: userData[0].email, subject: language.lang({key:"passwordResetRequest", lang:req.lang}), list: {username: req.username, link: rstPswrdVrfUrl, fullname: userData[0].userdetails[0].fullname}};
                    mail.sendResetPasswordMail(mailData, req.lang);
                    res({status:true, message:language.lang({key:"passwordReset", lang:req.lang})});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
              } else {
                res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang})});
              }
            } else if (req.deviceType === 'DESKTOP') {
              if(userData[0].user_type !== 'student') {
                  models.user.update({reset_password_token: rstPswrdToken}, {where: {id: userData[0].id}}).then(function () {
                    var mailData = {email: userData[0].email, subject: language.lang({key:"passwordResetRequest", lang:req.lang}), list: {username: req.username, link: rstPswrdVrfUrl, fullname: userData[0].userdetails[0].fullname}};
                    mail.sendResetPasswordMail(mailData, req.lang);
                    res({status:true, message:language.lang({key:"passwordReset", lang:req.lang})});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
              } else {
                res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang})});
              }
            } else {
              res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang})});
            }
          }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  * function resetpassword
  */
  this.resetpassword = function(req, res) {
    var usr = models.user.build(req);
    usr.validate().then(function (err) {
      if (err !== null) {
        language.errors({errors:err.errors, lang:req.lang}, function(errors){
            err.errors = errors;
            res(err);
        });
      } else {
        models.user.find({where:{reset_password_token:req.reset_password_token}}).then(function(userData){
          if (userData !== null) {
            var newPassword = bcrypt.hashSync(req.password, null, null);
              models.user.update({reset_password_token: '', password: newPassword}, {where: {reset_password_token: req.reset_password_token}}).then(function () {
                res({status:true, message:language.lang({key:"updatedpPasswordSuccess", lang:req.lang})});
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            } else {
              res({status:false, message:language.lang({key:"tokenExpire", lang:req.lang})});
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
  
  
 
  

  /*
   * Modules
  */
  this.getModules = function(req, res) {
    if (req.id ==1) {
      models.manager.findAll({attributes:['module_name']}).then(function(data){
        //res(data);
        var newData = {};
        async.forEach(data, function (item, callback) {
            newData[item.module_name] = item.module_name;
            callback();
        }, function () {
          res(newData);
        });
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    } else {
      models.rolepermission.findAll({where:{roleId:req.roleId}, group:'module_name', attributes:['module_name']}).then(function(data){
        //res(data);
        var newData = {};
        async.forEach(data, function (item, callback) {
            newData[item.module_name] = item.module_name;
            callback();
        }, function () {
          res(newData);
        });
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }
  };

  /*
   * Parent Registration
  */
  this.parentRegistration = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var UserHasOne = models.user.hasOne(models.userdetail, {as: 'user_detail'});
    req.user_detail.languageId = req.langId;
    req.user_type = 'parent';
    var langId = parseInt(req.user_detail.languageId);
      models.user.create(req, {include: [UserHasOne]}).then(function(data){
        if (langId === 1) {
          //var mailData = {email: req.email, subject: language.lang({key:"registrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl}};
          //mail.sendHtmlMail(mailData, req.lang);
          res(data.id);
        } else {
          req.user_detail.userId = data.id;
          req.user_detail.languageId = 1;
          models.userdetail.create(req.user_detail).then(function(){
            //var mailData = {email: req.email, subject: language.lang({key:"registrationDetails", lang:req.lang}), list: {fullname: req.user_detail.fullname, username:username, email:req.email, password: passwordForMail, link: req.loginUrl}};
            //mail.sendHtmlMail(mailData, req.lang);
            res(data.id);
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
}
module.exports = new myController();
