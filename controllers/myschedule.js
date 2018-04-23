var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var tagtype = require('./tagtype');
var utils = require('./utils');
var moment=require('moment');
var notification=require('./notification');

models.myschedule.belongsTo(models.doctorprofile, {foreignKey: 'doctorProfileId'});
models.myschedule.belongsTo(models.hospital);
models.hospital.hasMany(models.hospitaldetail);
models.doctorprofile.hasMany(models.doctortags, {
	as: 'doctortags',
	foreignKey: 'doctorProfileId',
});
models.doctorprofile.hasMany(models.doctorexperience, {
	as: 'doctorexperiences',
	foreignKey: 'doctorProfileId',
});
models.doctorprofile.belongsTo(models.user);
models.doctortags.belongsTo(models.tag);
models.tag.hasMany(models.tagdetail);
models.myschedule.belongsTo(models.patient);
models.patient.belongsTo(models.user);

function article() {

	this.changeStatus = function(req, res) {
		if("undefined" === typeof req.id || '' == req.id) {
			res({status: false, message:language.lang({key:"invalid_detail", lang:req.lang})})
		} else {
			let status;
			if(req.actionType === "publish") status = 1;
			if(req.actionType === "reject") status = 2;

			models.article.update({status: status}, {where: {id: req.id}}).then(function(response) {
				res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})})
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		}
	}

	this.getList = function(req, res) {

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
			responseData.articledetail = {};
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

		orderBy = 'id DESC';


		where ={doctorProfileId:req.body.doctorProfileId};

		if(req.query.hospital_id){
			where["hospitalId"]=req.query.hospital_id;
		}

		if (req.query.view === 'completed') {
			where.status = {$in: [0, 3, 4]};
		} else {
			where.status = {$in: [1, 2]};
		}

		if(req.query.status_id){
			where["status"]=req.query.status_id;
		}

		models.myschedule.belongsTo(models.hospital);
		models.hospital.hasMany(models.hospitaldetail);

		models.myschedule.belongsTo(models.patient);
		models.patient.belongsTo(models.user);
		
		models.myschedule.findAndCountAll({
			include: [
			   { model: models.hospital,include:[{model: models.hospitaldetail}]},
			   { 
			   		model: models.patient, 
			   		attributes: ["id", "userId"],
			   		include: [
			   			{model: models.user, attributes: ["id", "user_image"]}
			   		]
			   }
			],
			where: where,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, //subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);

			const articleTagtypeId = utils.getAllTagTypeId()['ArticleHealthIntrestTopicsTagId'];
			tagtype.listByTypeIDForWeb({langId: reqData.langId, lang: reqData.lang, id: articleTagtypeId}, function(tagdata){
				res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage, article_tags: tagdata.data }); 
			})
		})//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	}

	this.getListHospital = function(req, res) {

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
			responseData.articledetail = {};
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

		orderBy = 'id DESC';


		where ={hospitalId:req.body.doctorProfileId};

		if(req.query.hospital_id){
			where["doctorProfileId"]=req.query.hospital_id;
		}

		if (req.query.view === 'completed') {
			where.status = {$in: [0, 3, 4]};
		} else {
			where.status = {$in: [1, 2]};
		}

		if(req.query.status_id){
			where["status"]=req.query.status_id;
		}

		models.myschedule.belongsTo(models.doctorprofiledetail,{ foreignKey: 'doctorProfileId',targetKey:"doctorProfileId" });
		//models.doctorprofile.hasMany(models.doctorprofiledetail);
		
		models.myschedule.findAndCountAll({
			include: [
			   { model: models.doctorprofiledetail}	 
			],
			where: where,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, //subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);

			const articleTagtypeId = utils.getAllTagTypeId()['ArticleHealthIntrestTopicsTagId'];
			tagtype.listByTypeIDForWeb({langId: reqData.langId, lang: reqData.lang, id: articleTagtypeId}, function(tagdata){


			var qry = " SELECT active_schedule,hospital_name,address from hospitals h left join hospital_details hd on h.id=hd.hospitalId  where h.id=? limit 1 "
			models.sequelize.query(qry, {
				replacements: [req.body.doctorProfileId],
				type: models.sequelize.QueryTypes.SELECT,
			}).then(function(active_schedule) {
			//result.rows['active_schedule']=active_schedule[0]['active_schedule'];

			//console.log(result.rows);

			res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage, article_tags: tagdata.data,active_schedule:active_schedule[0]['active_schedule'],hospital_name:active_schedule[0]['hospital_name'],address:active_schedule[0]['address'] }); 

			});


			})
		})//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	}

	this.chageStatus=function(req,res){

		 var updateObj={}
		 if(req.status !== undefined){
			updateObj.status=req.status;
		 }

		 if (req.doctorProfileId) updateObj.status_updated_by = req.doctorProfileId;
		 if (req.hospitalProfileId) updateObj.status_updated_by = req.hospitalProfileId;

		 if(req.suggestion){
			updateObj.suggestion=req.suggestion;
		 }

		 models.myschedule.update(updateObj,{where: {id:req.sid}}).then(function(data){
			if(updateObj.status === 3){
				req.myscheduleId = req.sid;
				module.exports.cancle_notify(req, 'doctor');
			} else {
				module.exports.notify(req);
			}
			res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})})
		});
	}

	this.activeSchedule=function(req,res){


		var qryUpdate="update hospitals set active_schedule=1 where id=?"	
				 models.sequelize.query(qryUpdate, {
				 replacements: [
				  req.doctorProfileId
				 ],
				type: models.sequelize.QueryTypes.UPDATE
		}).then(function(data) {

			res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang})});

		});
	}

	this.addBlock=function(req,res){

		var qry = " SELECT id FROM block_schedules where (from_date between ? and ?) or (to_date between ? and ?) or (? between from_date and to_date) or (? between from_date and to_date) "
		models.sequelize.query(qry, {
				replacements: [
				req.from_date,
				req.to_date,
				req.to_date,
				req.from_date,
				req.from_date,
				req.to_date
				],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				if(data.length){
					res({status: false, message: language.lang({key: "This Block Schedule already added in your list", lang: req.lang})})
				}else{
				
				models.blockschedule.create(req).then(function(data){

				var qryUpdate="update myschedules set status=3, status_updated_by=? where book_date between ? and ? and doctorProfileId=?"	
				models.sequelize.query(qryUpdate, {
				 replacements: [
				  req.doctorProfileId,
				  req.from_date,
				  req.to_date,
				  req.doctorProfileId
				 ],
				type: models.sequelize.QueryTypes.UPDATE
				}).then(function(data) {

				  res({status: true, message: language.lang({key: "Your schedule has been blocked successfully.", lang: req.lang})});

				 });
				});
			   }
				
			});
	}

	this.getHospital=function(req,res){

		var qry = " SELECT hds.hospitalId id,hds.hospital_name FROM hospital_doctors hd left join hospital_details hds on hd.hospitalId=hds.hospitalId and hds.languageId=? where doctorProfileId=? "
		models.sequelize.query(qry, {
				replacements: [req.body.languageId,req.body.doctorProfileId],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				res(data);
		});
	}

	this.getDoctor=function(req,res){

		var qry = " SELECT hds.doctorProfileId id,hds.name hospital_name FROM hospital_doctors hd left join doctor_profile_details hds on hd.doctorProfileId=hds.doctorProfileId and hds.languageId=? where hospitalId=? "
		models.sequelize.query(qry, {
				replacements: [req.body.languageId,req.body.doctorProfileId],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				res(data);
		});
	}

	this.getSchedule=function(req,res){

		var qry = " SELECT * from block_schedules where doctorProfileId=?  order by id desc"
		models.sequelize.query(qry, {
				replacements: [req.doctorProfileId],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				res(data);
		});
	}

	this.getSchedulePatient = function (req, res) {
		var day = moment(req.date, "YYYY-MM-DD").format('ddd').toLowerCase()

		let specTagtypeId = utils.getAllTagTypeId()['SpecializationTagId'];

		var qryBooked = " SELECT group_concat(from_time) booked FROM myschedules where book_date=? and doctorProfileId=? and hospitalId=? and status !=3  "
		models.sequelize.query(qryBooked, {
			replacements: [req.date, req.doctorProfileId, req.hospitalId],
			type: models.sequelize.QueryTypes.SELECT
		}).then(function (booked) {
			var qry = "";
			qry += "  SELECT dpp.doctor_profile_pic,hospitalDoctorId,days,appointment_duration,hp.hospital_name,hp.address,dp.name,dpp.salutation,td.title,"
			qry += "  shift_1_from_time,"
			qry += "  shift_1_to_time,"
			qry += "  shift_2_from_time,"
			qry += "  shift_2_to_time, "
			qry += "  (SELECT group_concat(title) FROM doctor_tags dt left join tag_details td on dt.tagId=td.tagId WHERE tagtypeId = ? AND `doctorProfileId` = ?) doctor_tag "
			qry += "  FROM "
			qry += "  hospital_doctors hd left join hospital_doctor_timings hdt on hd.id=hdt.hospitalDoctorId and days=?"
			qry += "  left join hospital_details hp on hp.hospitalId=hd.hospitalId "
			qry += "  left join doctor_profile_details dp on dp.doctorProfileId=hd.doctorProfileId "
			qry += "  left join doctor_profiles dpp on dpp.id=hd.doctorProfileId "
			qry += "  left join doctor_educations de on dpp.id=de.doctorProfileId "
			qry += "  left join tag_details td on de.tagtypeId=td.tagId and td.languageId = 1 "
			qry += "  where hd.id=? ";

			Promise.all([
				models.sequelize.query(qry, {
					replacements: [specTagtypeId, req.doctorProfileId, day, req.hospitalDoctorId],
					type: models.sequelize.QueryTypes.SELECT
				}),
				models.blockschedule.count({
					where: {
						doctorProfileId: req.doctorProfileId,
						from_date: {$lte: req.date},
						to_date: {$gte: req.date}
					}
				})
			]).then(([data, blockedSchedules]) => {

				var final_obj = {};
				
				if (data.length) {
					var travelTime;
					var dur = (data[0]["appointment_duration"] * 60);
					var start_time = data[0]['shift_1_from_time'];
					var shift_1_arr = [];

					for (var i = 1; i < 100; i++) {
						travelTime = parseInt(start_time) + parseInt(dur);
						start_time = travelTime;
						if (start_time > data[0]['shift_1_to_time']) {
							break;
						}
						shift_1_arr.push(travelTime);
					}


					start_time = data[0]['shift_2_from_time'];
					for (var i = 1; i < 100; i++) {
						travelTime = parseInt(start_time) + parseInt(dur);
						start_time = travelTime;
						if (start_time > data[0]['shift_2_to_time']) {
							break;
						}
						shift_1_arr.push(travelTime);
					}


					var bookedArr = [];

					if (booked.length && booked[0]['booked'])
						bookedArr = booked[0]['booked'].split(",");

					var app1 = [];
					var app2 = [];
					var app3 = [];
					var app4 = [];

					if(!blockedSchedules){
						var shiftObj = {};
						var shiftArr = [];
						for (var i = 0; i < shift_1_arr.length; i++) {

							var time_format = moment().startOf('day').seconds(shift_1_arr[i]).format('hh:mm');

							shiftObj = {};
							shiftObj['booked'] = 0;
							if (bookedArr.indexOf(time_format.toString()) != -1)
								shiftObj['booked'] = 1;


							time_format = moment().startOf('day').seconds(shift_1_arr[i]).format('hh:mm');


							shiftObj['time'] = shift_1_arr[i];

							shiftObj['time_format'] = time_format;


							if (shiftObj['time'] > "0" && shiftObj['time'] <= "43140") {
								app1.push(shiftObj);
							}

							if (shiftObj['time'] > "43140" && shiftObj['time'] <= "57600") {
								app2.push(shiftObj);
							}


							if (shiftObj['time'] > "57600" && shiftObj['time'] <= "72000") {
								app3.push(shiftObj);
							}


							if (shiftObj['time'] > "72000" && shiftObj['time'] <= "86400") {
								app4.push(shiftObj);
							}

						}
					}

					final_obj = {
						"appointment_duration": data[0]["appointment_duration"],
						"doctor_profile_pic": data[0]['doctor_profile_pic'],
						"doctor_name": data[0]['name'],
						"salutation": data[0]['salutation'],
						"doctor_education": data[0]['title'],
						"doctor_tag": data[0]['doctor_tag'],
						"hospital_name": data[0]['hospital_name'],
						"hospital_address": data[0]['address'],
						'appointment1': app1,
						'appointment2': app2,
						'appointment3': app3,
						'appointment4': app4
					};
				}
				res({
					status: true,
					data: final_obj,
					message: language.lang({
						key: "",
						lang: req.lang
					})
				});
			});

		});
	}

	this.addSchedule=function(req,res){

		var qry = " SELECT id FROM myschedules where hospitalDoctorId=? and book_date=? and from_time=? "
		models.sequelize.query(qry, {
				replacements: [
				req.hospitalDoctorId,
				req.book_date,
				req.time
				],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				if(data.length){
					res({status: true, message: language.lang({key: "This Schedule already have been taken", lang: req.lang})})
				}else{
				
				req.time_sec=req.time;
				req.from_time=moment().startOf('day').seconds(req.time).format('hh:mm');
				req.appointment_duration=parseInt(req.appointment_duration)*60;
				var endTime = parseInt(req.time_sec)+parseInt(req.appointment_duration);
				req.to_time=moment().startOf('day').seconds(endTime).format('hh:mm');

				models.myschedule.create(req).then(function(data){
					req.status = 2;
					req.appointmentId = data.id;
					module.exports.book_notify(req);
					res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang})});

				});

			   }
				
			});
	}

	this.reSchedule=function(req,res){
		var time_format=moment().startOf('day').seconds(req.time).format('hh:mm a');
		var dateTime=req.date +" "+time_format;			
		var startTime=moment(dateTime, "YYYY-MM-DD HH:mm a");
		var endTime=moment();
		var duration = moment.duration(endTime.diff(startTime));
		var hours = parseInt(duration.asHours());
		var minutes = parseInt(duration.asMinutes())-hours*60;
		console.log(hours + ' hour and '+ minutes+' minutes.');


		if(minutes < 61){

			res({status: true, message: language.lang({key: "Schedule is not changed", lang: req.lang})})

		}else{

		var qry = " SELECT id FROM myschedules where hospitalDoctorId=? and book_date=? and from_time=? "
		models.sequelize.query(qry, {
				replacements: [
				req.hospitalDoctorId,
				req.book_date,
				req.time
				],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				if(data.length){
					res({status: true, message: language.lang({key: "This Schedule is already booked", lang: req.lang})})
				}else{ 

				models.myschedule.update({
					status: 3,
					status_updated_by:req.patientId
				},{where: {id: req.myscheduleId}}).then(function(response) {  

					req.time_sec=req.time;
					req.from_time=moment().startOf('day').seconds(req.time).format('hh:mm');
					req.appointment_duration=parseInt(req.appointment_duration)*60;
					var endTime = parseInt(req.time_sec)+parseInt(req.appointment_duration);
					req.to_time=moment().startOf('day').seconds(endTime).format('hh:mm');

					models.myschedule.create(req).then(function(data){
						req.status = 2;
						req.appointmentId = data.id;
						req.old_appointmentId = req.myscheduleId;
						module.exports.book_notify(req);
						res({status: true, message: language.lang({key: "reScheduleSuccessfully", lang: req.lang})});

					}); 


				});
  

			   }
				
			});

		}	
	}

	this.cancleSchedule=function(req,res){
		//var day=moment(req.date,"YYYY-MM-DD").format('ddd').toLowerCase()
		//var dateTime="2018-02-24 09:12 am";
		var time_format=moment().startOf('day').seconds(req.time).format('hh:mm a');
		var dateTime=req.date +" "+time_format;			
		var startTime=moment(dateTime, "YYYY-MM-DD HH:mm a");
		var endTime=moment();
		var duration = moment.duration(endTime.diff(startTime));
		var hours = parseInt(duration.asHours());
		var minutes = parseInt(duration.asMinutes())-hours*60;

		if(minutes < 61){

			res({status: true, message: language.lang({key: "Schedule is not changed", lang: req.lang})})

		}else{

		var qry = " SELECT id FROM myschedules where hospitalDoctorId=? and book_date=? and from_time=? "
		models.sequelize.query(qry, {
				replacements: [
				req.hospitalDoctorId,
				req.book_date,
				req.time
				],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				if(data.length){
					res({status: true, message: language.lang({key: "This Schedule is already booked", lang: req.lang})})
				}else{ 

				models.myschedule.update({
					status: 3,
					status_updated_by:req.patientId
				},{where: {id: req.myscheduleId}}).then(function(response) {
					module.exports.cancle_notify(req, 'patient');
					//req.from_time=req.time;
					//models.myschedule.create(req).then(function(data){

						res({status: true, message: language.lang({key: "Schedule Cancled", lang: req.lang})});

					//}); 


				});
  

			   }
				
			});  




		}   
	}

	this.getSchedulePatientList = (req, res) => {
		let qry ='SELECT ms.id myscheduleId, ms.suggestion, ms.book_date, ms.from_time, ms.to_time, ms.time_sec, dp.name, ms.status,';
			qry += ' ms.hospitalDoctorId, ms.doctorProfileId, ms.hospitalId, ms.patient_name, ms.patient_mobile, ms.patient_email,';
			qry += ' hp.hospital_name, hp.address, dpp.salutation, dpp.doctor_profile_pic';
			qry += " FROM myschedules ms left join hospitals h on ms.hospitalId=h.id";
			qry += " left join hospital_details hp on h.id=hp.hospitalId";
			qry += " left join doctor_profile_details dp on dp.doctorProfileId=ms.doctorProfileId";
			qry += " left join doctor_profiles dpp on dp.doctorProfileId=dpp.id";
			qry += " where patientId=? and status IN (?) ORDER BY book_date DESC";
		Promise.all([
			models.sequelize.query(qry, {
				replacements: [req.patientId, [0, 3, 4]],
				type: models.sequelize.QueryTypes.SELECT,
			}),
			models.sequelize.query(qry, {
				replacements: [req.patientId, [1,2]],
				type: models.sequelize.QueryTypes.SELECT,
			})
		]).then(([completed, upcoming]) => {
			res({
				status: true,
				data:{upcoming, completed},
				message: language.lang({key: "addedSuccessfully", lang: req.lang})
			});
		}).catch(console.log)
	}

	this.getScheduleInfo = (req,res) => {

		models.myschedule.belongsTo(models.hospital);
		models.hospital.hasMany(models.hospitaldetail);
		models.myschedule.belongsTo(models.doctorprofile, {foreignKey: 'doctorProfileId'});
		models.doctorprofile.hasMany(models.doctorprofiledetail, {foreignKey: 'doctorProfileId'});
		models.doctorprofile.hasMany(models.doctortags, {foreignKey: 'doctorProfileId'});
		models.doctortags.belongsTo(models.tag);
		models.tag.hasMany(models.tagdetail);

		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctoreducation.hasMany(models.doctoreducationdetail);
		models.doctoreducation.belongsTo(models.tag, {foreignKey: 'tagtypeId'});

		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key'
		});

		models.myschedule.findOne({
			attributes: [
				'id',
				'patientId',
				'hospitalDoctorId',
				'doctorProfileId',
				'hospitalId',
				'book_date',
				'from_time',
				'to_time',
				'time_sec',
				'patient_name',
				'patient_mobile',
				'patient_email',
				'status_updated_by',
				'suggestion',
				'status'
			],
			include: [{
				model: models.hospital,
				attributes: ['id', 'latitude', 'longitude'],
				include: [{
					model: models.hospitaldetail,
					attributes: ['hospital_name', 'about_hospital', 'address'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				}, {
					model: models.contactinformation,
					attributes: ['type', 'value', 'is_primary'],
					where: {
						is_primary: 1,
						model: 'hospital'
					},
					required: false
				},]
			}, {
				model: models.doctorprofile,
				attributes: ['doctor_profile_pic', 'salutation'],
				include: [{
					model: models.doctorprofiledetail,
					attributes: ['name'],
					where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
				}, {
					model: models.doctortags,
					required: false,
					attributes: ['id'],
					include: [{
						model: models.tag,
						required: false,
						attributes: ['id'],
						include: [{
							model: models.tagdetail,
							required: false,
							attributes: ['title'],
							where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctortags.tag`.`id`', models.tagdetail, 'tagId')
						}]
					}],
					where: {
						tagtypeId: 2
					}
				}, {
					model: models.doctoreducation,
					attributes: ['id', 'tagtypeId'],
					include: [{
						model: models.doctoreducationdetail,
						attributes: ['college_name'],
						where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctoreducation`.`id`', models.doctoreducationdetail, 'doctorEducationId'),
						required: false
					}, {
						model: models.tag,
						attributes: ['id'],
						required: false,
						include: [{
							model: models.tagdetail,
							attributes: ['title'],
							where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctoreducation.tag`.`id`', models.tagdetail, 'tagId'),
							required: false
						}]
					}],
					required: false
				}]
			}],
			where: {
				id: req.id
			}
		}).then(data => {
			res({
				status: true,
				data
			})
		})
	}

	const experienceAttribute = models.sequelize.literal(
		'IFNULL(SUM('
			+ '`doctorprofile.doctorexperiences`.`duration_to`'
			+ ' - `doctorprofile.doctorexperiences`.`duration_from`'
		+ '), 0)'
	);
	const SpecializationTagId = require('./utils').getAllTagTypeId()['SpecializationTagId'];

	this.getForSuperadmin = req => models.myschedule.find({
		include: [
			{
				model: models.doctorprofile,
				include: [
					{
						model: models.doctorprofiledetail,
						as: 'doctorprofiledetails',
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`doctorprofile`.`id`',
							models.doctorprofiledetail,
							'doctorprofileId'
						),
						attributes: ['name'],
					},
					{
						model: models.doctortags,
						as: 'doctortags',
						include: [
							{
								model: models.tag,
								include: [
									{
										model: models.tagdetail,
										attributes: ['title'],
									}
								],
								attributes: ['id'],
							}
						],
						where: {
							tagtypeId: SpecializationTagId,
						},
						attributes: ['id'],
					},
					{
						model: models.doctorexperience,
						as: 'doctorexperiences',
						attributes: [],
					},
				],
				attributes: [
					'id',
					'doctor_profile_pic',
					[experienceAttribute, 'experience'],
				],
			},
			{
				model: models.hospital,
				include: [
					{
						model: models.hospitaldetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`hospital`.`id`',
							models.hospitaldetail,
							'hospitalId'
						),
						attributes: ['hospital_name', 'address'],
					},
				],
				attributes: ['id', 'hospital_logo'],
			},
			{
				model: models.patient,
				include: [
					{
						model: models.user,
						attributes: ['user_image'],
					}
				],
				attributes: ['id'],
			},
		],
		where: {
			id: req.myScheduleId,
		},
		attributes: {
			exclude: [
				'suggestion',
				'createdAt',
				'updatedAt',
				'time_sec',
				'to_time',
			]
		},
		group: [
			[
				models.doctorprofile,
				{
					as: 'doctorexperiences',
					model: models.doctorexperience,
				},
				'id'
			],
		],
	})
		.then(data => ({status: true, data}));

	this.listForSuperadmin = req => {
		const pageSize = req.app.locals.site.page, // number of items per page
			page = +req.query.page || 1,
			reqData = req.body,
			where = {};

		if (req.query) {
			Object.keys(req.query).forEach(key => {
				if (req.query[key] === '') return;
				var modalKey = key.split('__');
				if (modalKey.length === 3) {
					if (modalKey[0] in where) {
						where[modalKey[0]][modalKey[1]] = req.query[key];
					} else {
						where[modalKey[0]] = {};
						where[modalKey[0]][modalKey[1]] = req.query[key];
					}
				} else {
					if (modalKey[0] in where) {
						where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
					} else {
						where[modalKey[0]] = {};
						where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
					}
				}
			});
		}

		return models.myschedule.findAndCountAll({
			include: [
				{
					model: models.doctorprofile,
					include: [
						{
							model: models.doctorprofiledetail,
							as: 'doctorprofiledetails',
							where: language.buildLanguageQuery(
								where.doctorprofiledetail,
								req.langId,
								'`doctorprofile`.`id`',
								models.doctorprofiledetail,
								'doctorprofileId'
							),
							attributes: ['name'],
						},
					],
					attributes: ['id'],
				},
				{
					model: models.hospital,
					include: [
						{
							model: models.hospitaldetail,
							where: language.buildLanguageQuery(
								where.hospitaldetail,
								req.langId,
								'`hospital`.`id`',
								models.hospitaldetail,
								'hospitalId'
							),
							attributes: ['hospital_name'],
						},
					],
					attributes: ['id'],
				},
			],
			distinct: true,
			where: where.myschedule,
			attributes: [
				'id',
				'patient_name',
				'book_date',
				'from_time',
				'status',
				'status_updated_by',
				'patientId',
			],
			order: [
				['id', 'DESC']
			],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false,
		})
		.then(result => ({
			status: true,
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage: parseInt(page),
		}));
	};

	this.book_notify = req => {

		Promise.all([
			models.doctorprofile.find({
				include: [{
					model: models.user,
					attributes: ['id', 'device_id', 'is_notification'],
					include: [{
						model: models.userdetail,
						attributes: ['fullname'],
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`user`.`id`',
							models.userdetail,
							'userId'
						)
					}]
				}],
				where: {
					id: req.doctorProfileId
				}
			}),
			models.patient.findOne({
				include: [{
					model: models.user,
					attributes: ['id', 'mobile'],
					include: [{
						model: models.userdetail,
						attributes: ['fullname'],
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`user`.`id`',
							models.userdetail,
							'userId'
						)
					}]
				}],
				where: {
					id: req.patientId
				}
			})
		]).then(([result, patient]) => {
			if(req.old_appointmentId) {
				notification.send([{
					id:result.user.id, 
					device_id:result.user.device_id,
					is_notification:result.user.is_notification
				}],
				'front/notification/appointment/rescheduled',
				{
					lang:req.lang,
					appointmentId: req.appointmentId,
					old_appointmentId: req.old_appointmentId,
					date: req.book_date,
					time_sec: req.time_sec,
					patient_name: patient.user.userdetails[0].fullname,
					mobile: patient.user.mobile,
					moment: moment
				}, {
					senderId: patient.user.id,
					meta: {appointmentId: req.appointmentId},
					data:{type:'appointment_rescheduled'}
				});
			} else {
				notification.send([{
					id:result.user.id, 
					device_id:result.user.device_id,
					is_notification:result.user.is_notification
				}],
				'front/notification/appointment/book',
				{
					lang:req.lang,
					appointmentId: req.appointmentId,
					date: req.book_date,
					time_sec: req.time_sec,
					patient_name: patient.user.userdetails[0].fullname,
					mobile: patient.user.mobile,
					moment: moment
				}, {
					senderId: patient.user.id,
					meta: {appointmentId: req.appointmentId},
					data:{type:'appointment_book'}
				});
			}
		});
	};

	this.cancle_notify = (req, updateBy) => {
		Promise.all([
			models.myschedule.findOne({
				include: [{
					model: models.doctorprofile,
					attributes: ['id', 'salutation'],
					include: [{
						model: models.user,
						attributes: ['id', 'device_id', 'is_notification'],
						include: [{
							model: models.userdetail,
							attributes: ['fullname'],
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`doctorprofile.user`.`id`',
								models.userdetail,
								'userId'
							)
						}]
					}]
				}, {
					model: models.patient,
					attributes: ['id', 'is_appointment_notification'],
					include: [{
						model: models.user,
						attributes: ['id', 'device_id', 'is_notification'],
						include: [{
							model: models.userdetail,
							attributes: ['fullname'],
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`patient.user`.`id`',
								models.userdetail,
								'userId'
							)
						}]
					}]
				}],
				where: {
					id: req.myscheduleId
				}
			})
		]).then(([result]) => {
			if(updateBy === 'patient'){
				//------------notification to doctor--------------
				notification.send([{
					id:result.doctorprofile.user.id, 
					device_id:result.doctorprofile.user.device_id,
					is_notification:result.doctorprofile.user.is_notification
				}],
				'front/notification/appointment/cancle_doctor',
				{
					lang:req.lang,
					appointmentId: result.id,
					date: result.book_date,
					time_sec: result.time_sec,
					patient_name: result.patient.user.userdetails[0].fullname,
					patient_mobile: result.patient.user.mobile,
					moment: moment
				}, {
					senderId: result.patient.user.id,
					meta: {appointmentId: req.myscheduleId},
					data:{type:'appointment_cancle'}
				});

				//----------notification to patient------------
				notification.send([{
					id:result.patient.user.id, 
					device_id:result.patient.user.device_id,
					is_notification:result.patient.user.is_notification && result.patient.is_appointment_notification
				}],
				'front/notification/appointment/cancle_you',
				{
					lang:req.lang,
					appointmentId: result.id,
					date: result.book_date,
					time_sec: result.time_sec,
					doctor_name: result.doctorprofile.salutation +' '+ result.doctorprofile.user.userdetails[0].fullname,
					doctor_mobile: result.doctorprofile.user.mobile,
					moment: moment
				}, {
					senderId: result.doctorprofile.user.id,
					meta: {appointmentId: req.appointmentId},
					data:{type:'appointment_cancle'}
				});

			} else {

				notification.send([{
					id:result.patient.user.id, 
					device_id:result.patient.user.device_id,
					is_notification:result.patient.user.is_notification && result.patient.is_appointment_notification
				}],
				'front/notification/appointment/cancle_patient',
				{
					lang:req.lang,
					appointmentId: result.id,
					date: result.book_date,
					time_sec: result.time_sec,
					doctor_name: result.doctorprofile.salutation +' '+ result.doctorprofile.user.userdetails[0].fullname,
					doctor_mobile: result.doctorprofile.user.mobile,
					moment: moment
				}, {
					senderId: result.doctorprofile.user.id,
					meta: {appointmentId: req.appointmentId},
					data:{type:'appointment_cancle'}
				});

			}
		});
	};

	this.notify = req => {
		models.myschedule.findOne({
			include: [{
				model: models.doctorprofile,
				attributes: ['id', 'salutation'],
				include: [{
					model: models.user,
					attributes: ['id'],
					include: [{
						model: models.userdetail,
						attributes: ['fullname'],
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`doctorprofile.user`.`id`',
							models.userdetail,
							'userId'
						)
					}]
				}]
			}, {
				model: models.patient,
				attributes: ['id', 'is_appointment_notification'],
				include: [{
					model: models.user,
					attributes: ['id', 'device_id', 'is_notification']
				}]
			},{
				model: models.hospital,
				attributes: ['id'],
				include: [{
					model: models.hospitaldetail,
					attributes: ['hospital_name', 'address', 'contact_mobiles'],
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`hospital`.`id`',
						models.hospitaldetail,
						'hospitalId'
					)
				}]
			}],
			where: {
				id: req.sid
			}
		}).then(result => {
			if(req.status === 1){
				notification.send([{
					id:result.patient.user.id, 
					device_id:result.patient.user.device_id,
					is_notification:result.patient.user.is_notification && result.patient.is_appointment_notification
				}],
				'front/notification/appointment/confirm',
				{
					lang:req.lang,
					appointmentId: result.id,
					date: result.book_date,
					time_sec: result.time_sec,
					doctor_name: result.doctorprofile.salutation +' '+ result.doctorprofile.user.userdetails[0].fullname,
					clinic_name: result.hospital.hospitaldetails[0].hospital_name,
					clinic_address: result.hospital.hospitaldetails[0].address+', '+result.hospital.hospitaldetails[0].contact_mobiles,
					moment: moment
				}, {
					senderId: result.doctorprofile.user.id,
					meta: {appointmentId: req.appointmentId},
					data:{type:'appointment_confirm'}
				});
			}

			if(req.status === 4){
				notification.send([{
					id:result.patient.user.id, 
					device_id:result.patient.user.device_id,
					is_notification:result.patient.user.is_notification && result.patient.is_appointment_notification
				}],
				'front/notification/appointment/absent',
				{
					lang:req.lang,
					appointmentId: result.id,
					doctor_name: result.doctorprofile.salutation +' '+ result.doctorprofile.user.userdetails[0].fullname,
				}, {
					senderId: result.doctorprofile.user.id,
					meta: {appointmentId: req.appointmentId},
					data:{type:'appointment_absent'}
				});
			}

			if(req.status === 0){
				notification.send([{
					id:result.patient.user.id, 
					device_id:result.patient.user.device_id,
					is_notification:result.patient.user.is_notification && result.patient.is_appointment_notification
				}],
				'front/notification/appointment/consult_done',
				{
					lang:req.lang,
					appointmentId: result.id,
					doctor_name: result.doctorprofile.salutation +' '+ result.doctorprofile.user.userdetails[0].fullname,
				}, {
					senderId: result.doctorprofile.user.id,
					meta: {appointmentId: req.appointmentId},
					data:{type:'appointment_consult'}
				});
			}
		});
	}
}
module.exports = new article();