'use strict';

const
	async = require('async'),
	models = require('../models'),
	language = require('./language'),
	bcrypt = require('bcrypt-nodejs'),
	userController = require('./users'),
	mail = require('./mail'),
	fs = require('fs'),
	util = require('util'),
	path = require('path'),
	crypto = require('crypto'),
	{exec} = require('child_process'),
	moment = require('moment');

function Import() {
		
		this.importStudent = function(req, res){
				var studentHasOne = models.student.hasOne(models.studentdetail, {as: 'student_detail'});
				var studentrecordHasOne = models.student.hasOne(models.studentrecord, {as: 'student_record'});
				var userHasOne = models.user.hasOne(models.userdetail, {as: 'user_detail'});
				
				var user = models.user.build(req);
				var user_detail = models.userdetail.build(req.user_detail);
				var student = models.student.build(req.student);
				var student_detail = models.studentdetail.build(req.student_detail);
				var studentrecordDetails = models.studentrecord.build(req.student_record);

				if(!moment(req.student.doa, 'YYYY-MM-DD', true).isValid()){
					req.student.doa = 'notValid';
				}
				if(!moment(req.student.dob, 'YYYY-MM-DD', true).isValid()){
					req.student.dob = 'notValid';
				}
				
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
						});
					},
					function (callback) {
						user_detail.validate().then(function (err) {
								if (err !== null) {
										errors = errors.concat(err.errors);
										callback(null, errors);
								} else {
										callback(null, errors);
								}
						});
					},
					function (callback) {
						student.validate().then(function (err) {
								if (err !== null) {
										errors = errors.concat(err.errors);
										callback(null, errors);
								} else {
										callback(null, errors);
								}
						});
					},
					function (callback) {
							student_detail.validate().then(function (err) {
									if (err !== null) {
											errors = errors.concat(err.errors);
											callback(null, errors);
									} else {
											callback(null, errors);
									}
							});
					},
					function (callback) {
							studentrecordDetails.validate().then(function (err) {
									if (err !== null) {
											errors = errors.concat(err.errors);
											callback(null, errors);
									} else {
											callback(null, errors);
									}
							});
					}
				], function (err, errors) {
						var merged = [].concat.apply([], errors);
						var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
						if (uniqueError.length === 0) {
								var time = Date.now();
								var passwordForMail = time;
								req.password = bcrypt.hashSync(time, null, null);
								var langId = parseInt(req.user_detail.languageId);
								userController.createUserNameImport({fullname:req.user_detail.fullname}, function(username){
									req.user_name = username;

									models.user.create(req, {
										include: [userHasOne],
										individualHooks: true
									}).then(function(data){
										username = data.user_name;
										req.student.userId = data.id;
										req.student.student_detail = req.student_detail;
										req.student.student_record = req.student_record;

										models.student.create(req.student, {
											include: [studentHasOne, studentrecordHasOne]
										}).then(function(studentData){
											if (langId === 1) {
												if(req.email != ''){
														var mailData = {
																email: req.email, 
																subject: language.lang({key:"studentRegistrationDetails", lang:req.lang}), 
																list: {
																		fullname: req.user_detail.fullname, 
																		username:username, 
																		email:req.email, 
																		password: passwordForMail, 
																		link: req.loginUrl,
																		institute_name: req.institute_name
																}
														};
														mail.sendHtmlMailToStudent(mailData, req.lang);
												}
												res({status:true, enrollment_no:req.student.enrollment_no});
											} else {
												req.user_detail.userId = data.id;
												req.user_detail.languageId = 1;
												req.student.student_detail.studentId =studentData.id;
												req.student.student_detail.languageId =1;
												models.userdetail.create(req.user_detail).then(function(){
													models.studentdetail.create(req.student.student_detail).then(function(){
														if(req.email != ''){
																var mailData = {
																		email: req.email, 
																		subject: language.lang({key:"studentRegistrationDetails", lang:req.lang}), 
																		list: {
																				fullname: req.user_detail.fullname, 
																				username:username, 
																				email:req.email, 
																				password: passwordForMail, 
																				link: req.loginUrl,
																				institute_name: req.institute_name
																		}
																};
																mail.sendHtmlMailToStudent(mailData, req.lang);
														}
														res({status:true, enrollment_no:req.student.enrollment_no});
													}).catch(console.log);
												}).catch(console.log);
											}
										}).catch(console.log);
									}).catch(console.log);
								});
						} else {
							language.errors({errors:uniqueError, lang:req.lang}, function(errors){
								res({status:false, enrollment_no:req.student.enrollment_no, errors});
							});
						}
				});
		};
}

module.exports = new Import();

const
	stat = util.promisify(fs.stat),
	readdir = util.promisify(fs.readdir);

const validImageTypes = ['.png', '.jpg', '.jpeg'];

function unzipFile(file) {
	return new Promise((resolve, reject) => {
		let
			err = '',
			output = path.join(tmpDir, crypto.randomBytes(8).toString('hex')),
			child = exec('unzip ' +  file + ' -d ' + output);
		child.stderr.on('data', buf => err += buf.toString());
		child.on('exit', code => {
			if (code === 0) {
				resolve(output);
			} else {
				reject(err);
			}
		});
	});
}

async function updateUserImages(req, dir, results) {
	await Promise.all((await readdir(dir)).map(async file => {
		let stats = await stat(path.join(dir, file));
		if (stats.isDirectory()) {
			return updateUserImages(req, path.join(dir, file), results);
		} else if (! stats.isFile()) {
			return;
		} else {
			let
				ext = path.extname(file),
				enrollment_no = file.substring(0, file.lastIndexOf(ext));
			if (validImageTypes.indexOf(ext.toLowerCase()) === -1) {
				results.push({
					enrollment_no,
					status: false,
					message: language.__('Only image files are allowed!', req.lang),
				});
			} else if (stats.size > 1000000) {
				results.push({
					enrollment_no,
					status: false,
					message: language.__('Image size should less than 1 MB', req.lang),
				});
			} else {
				let student = await models.student.find({
					include: {
						model: models.user,
						where: {
							user_type: 'student',
							masterId: req.masterId,
						},
						attributes: ['id', 'user_image'],
					},
					where: {
						enrollment_no: enrollment_no,
					},
					attributes: ['id', 'userId'],
				});
				if (student === null) {
					results.push({
						enrollment_no,
						status: false,
						message: language.__('Enrollment number not found.', req.lang),
					});
				} else {
					student.user.user_image = path.join(dir, file);
					await student.user.save();
					results.push({
						enrollment_no,
						status: true,
						message: language.__('updatedSuccessfully', req.lang),
					});
				}
			}
		}
	}));
}

module.exports.image = async req => {
	let output, results = [];
	try {
		output = await unzipFile(req.file);
	} catch (err) {
		return {status: false, message: language.__('Invalid File', req.lang)};
	}
	await updateUserImages(req, output, results);
	return {status: true, results};
};
