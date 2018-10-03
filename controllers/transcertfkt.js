'use strict';

const models = require('../models'),
moment = require('moment'),
language = require('./language');

models.studentrecord.belongsTo(models.student);
models.student.hasMany(models.studentdetail);
models.student.belongsTo(models.user);
models.user.hasMany(models.userdetail);
models.institute.hasMany(models.institutedetail);
models.bcsmap.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.bcsmap.belongsTo(models.classes);
models.classes.hasMany(models.classesdetail);
models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);
models.academicsession.hasMany(models.academicsessiondetail);
models.student.hasOne(models.transfercertificate);

exports.getStudents = function (req) {
	return Promise.all([
		models.studentrecord.scope(
	      { method: ['transferred', moment().format('YYYY-MM-DD')]}
	    ).findAll({
			include: [
				{
					model: models.student,
					attributes: [
						'id',
						'enrollment_no',
						'form_no',
						'fee_receipt_no',
						'doa',
						'dob',
						'blood_group',
						'gender',
						'res_category',
						'aadhar',
						'father_contact',
						'father_contact_alternate',
						'mother_contact',
						'mother_contact_alternate',
						'guardian_contact',
						'guardian_contact_alternate'
					],
					include: [
						{
							model: models.studentdetail,
							attributes: [
								'id',
								'father_name',
								'mother_name',
								'guardian_name',
								'guardian_relationship',
								'guardian_address',
								'birthmark',
								'height',
								'address',
								'address_2',
								'birthplace',
								'religion',
								'nationality',
								'pre_school_name',
								'pre_school_address',
								'pre_qualification'
							],
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`student`.`id`',
								models.studentdetail,
								'studentId'
							)
						},
						{
							model: models.user,
							attributes: [
								'id',
								'mobile',
								'email',
								'alternate_mobile'
							],
							include: [
								{
									model: models.userdetail,
									attributes: ['id','fullname'],
									where: language.buildLanguageQuery(
										{},
										req.langId,
										'`student.user`.`id`',
										models.userdetail,
										'userId'
									)
								}
							],
						},
						{
							model: models.transfercertificate,
							where: {
								academicSessionId: req.academicSessionId,
							},
							attributes: ['studentId','releaving_date'],
							required: false,
						},
					],
				}
			],
			where: {
				bcsMapId: req.bcsmapId,
				masterId: req.masterId,
				academicSessionId: req.academicSessionId
			},
			attributes: ['id', 'roll_no']
		})
	])
	.then(([data])=> ({status: true, data}));
};

exports.getSelectedStudents = function (req) {
	return Promise.all([
		models.studentrecord.scope(
	      { method: ['transferred', moment().format('YYYY-MM-DD')]}
	    ).findAll({
			include: [
				{
					model: models.student,
					attributes: [
						'id',
						'enrollment_no',
						'form_no',
						'fee_receipt_no',
						'doa',
						'dob',
						'blood_group',
						'gender',
						'res_category',
						'aadhar',
						'father_contact',
						'mother_contact'
					],
					include: [
						{
							model: models.studentdetail,
							attributes: [
								'id',
								'father_name',
								'mother_name',
								'address',
								'address_2',
								'birthplace',
								'religion'
							],
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`student`.`id`',
								models.studentdetail,
								'studentId'
							)
						},{
							model: models.user,
							attributes: [
								'id',
								'mobile',
								'email',
								'alternate_mobile',
								'user_image'
							],
							include: [
								{
									model: models.userdetail,
									attributes: ['id','fullname'],
									where: language.buildLanguageQuery(
										{},
										req.langId,
										'`student.user`.`id`',
										models.userdetail,
										'userId'
									)
								}
							],
						},
						{
							model: models.transfercertificate,
							where: {
								academicSessionId: req.academicSessionId,
							},
							attributes: [],
							required: false,
						}
					],
					where: {id:req.studentIds}
				}
			],
			where: {
				bcsMapId: req.bcsmapId,
				masterId: req.masterId,
				academicSessionId: req.academicSessionId,
			},
			attributes: [
				'id',
				'roll_no',
				[
					models.sequelize.literal('`student.transfercertificate`.`releaving_date`'),
					'releaving_date'
				],
				[
					models.sequelize.literal('`student.transfercertificate`.`conduct`'),
					'conduct'
				],
				[
					models.sequelize.literal('`student.transfercertificate`.`result`'),
					'result'
				],
				[models.sequelize.literal(
					'(SELECT COUNT(*) FROM `attendance_records`\
					INNER JOIN `attendances` ON `attendances`.`id` = `attendance_records`.`attendanceId`\
					WHERE `attendance_records`.`studentId` = `studentrecord`.`studentId`\
					AND `attendances`.`bcsMapId` = '+req.bcsmapId+'\
					AND `attendances`.`academicSessionId` = '+req.academicSessionId+')'
				), 'totalAttendance'],
				[models.sequelize.literal(
					'(SELECT COUNT(*) FROM `attendance_records`\
					INNER JOIN `attendances` ON `attendances`.`id` = `attendance_records`.`attendanceId`\
					WHERE `attendance_records`.`studentId` = `studentrecord`.`studentId`\
					AND `attendance_records`.`is_present` IN (1,2)\
					AND `attendances`.`bcsMapId` = '+req.bcsmapId+'\
					AND `attendances`.`academicSessionId` = '+req.academicSessionId+')'
				), 'StudentAttendance'],
				[models.sequelize.literal(
					'(SELECT SUM(`exam_bulk_attendance_details`.`present_days`) FROM `exam_bulk_attendance_details`\
					INNER JOIN `exam_bulk_attendances` ON `exam_bulk_attendances`.`id` = `exam_bulk_attendance_details`.`exambulkattendanceId`\
					WHERE `exam_bulk_attendance_details`.`studentId` = `studentrecord`.`studentId`\
					AND `exam_bulk_attendances`.`masterId` = '+req.masterId+'\
					AND `exam_bulk_attendances`.`bcsmapId` = '+req.bcsmapId+'\
					AND `exam_bulk_attendances`.`academicSessionId` = '+req.academicSessionId+')'
				), 'BulkPresentDay'],
				[models.sequelize.literal(
					'(SELECT SUM(`total`) FROM `exam_bulk_attendances`\
					WHERE `exam_bulk_attendances`.`masterId` = '+req.masterId+'\
					AND `exam_bulk_attendances`.`bcsmapId` = '+req.bcsmapId+'\
					AND `exam_bulk_attendances`.`academicSessionId` = '+req.academicSessionId+')'
				), 'BulkTotalDay'],
				/*[models.sequelize.literal(
					'(SELECT SUM(CASE WHEN `fee_heads`.`fee_type`="Transportation"\
					AND `fee_heads`.`transport_fee_type`="lumsum"\
					AND `fee_heads`.`vehicle_type`=`vehicles`.`vehicle_type`\
					THEN `amount` WHEN `fee_heads`.`fee_type`="Transportation"\
					AND `fee_heads`.`transport_fee_type`="route"\
					AND `fee_heads`.`vehicle_type`=`vehicles`.`vehicle_type`\
					AND `fee_heads`.`routeId`=`student`.`routeId` THEN `amount`\
					WHEN `fee_heads`.`fee_type`="Transportation"\
					AND `fee_heads`.`transport_fee_type`="stoppage"\
					AND `fee_heads`.`vehicle_type`=`vehicles`.`vehicle_type`\
					AND `fee_heads`.`routeId`=`student`.`routeId`\
					AND `fee_heads`.`stoppage_point`=`student`.`stoppage_point`\
					THEN `amount` WHEN `fee_heads`.`fee_type`!="Transportation" THEN `amount` ELSE 0 END)\
					FROM `rvdhs_map_records` LEFT JOIN `rvdhs_maps`\
					ON `rvdhs_map_records`.`rvdhsmapId`=`rvdhs_maps`.`id`\
					LEFT JOIN `vehicles` ON `rvdhs_maps`.`vehicleId`=`vehicles`.`id`\
					LEFT JOIN `bcs_maps` ON `bcs_maps`.`id`='+req.bcsmapId+'\
					LEFT JOIN `fees` ON `bcs_maps`.`classId`=`fees`.`classId`\
					AND `fees`.`academicSessionId`='+req.academicSessionId+'\
					LEFT JOIN `fee_allocations` ON `fees`.`id`=`fee_allocations`.`feeId`\
					LEFT JOIN `fee_heads` ON `fee_allocations`.`feeHeadId`=`fee_heads`.`id`\
					AND find_in_set(2,`fee_allocations`.`monthIds`)\
					WHERE `studentrecord`.`academicSessionId`='+req.academicSessionId+'\
					AND `student`.`masterId`='+req.masterId+' AND `fees`.`is_active`=1\
					AND `studentrecord`.`studentId`=`rvdhs_map_records`.`studentId`)'
				), 'duefee']*/
			]
		}),
		models.institute.find({
			include:[
				{
					model: models.institutedetail,
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`institute`.`id`',
						models.institutedetail,
						'instituteId'
					),
					attributes: ['name', 'alias', 'address', 'tagline']
				}
			],
			attributes: ['id', 'userId', 'institute_logo'],
			where: {
				userId: req.masterId,
			},
		}),
		models.bcsmap.find({
			where: {id: req.bcsmapId},
			include:
			[
				{
					model: models.board,
					attributes: ['id'],
					include:
					[
						{
							model: models.boarddetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`board`.`id`',
								models.boarddetail,
								'boardId'
							),
							attributes: ['alias']
						}
					]
				},
				{
					model: models.classes,
					attributes: ['id'],
					include:[
						{
							model: models.classesdetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`class`.`id`',
								models.classesdetail,
								'classId'
							),
							attributes: ['name']
						}
					]
				},
				{
					model: models.section,
					attributes: ['id'],
					include:[
						{
							model: models.sectiondetail,
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`section`.`id`',
								models.sectiondetail,
								'sectionId'
							),
							attributes: ['name']
						}
					]
				}
			],
			attributes: ['id']
		}),
		models.signature.find({
			attributes: ['prepared_by', 'checked_by', 'principal'],
			where: {
				academicsessionId: req.academicSessionId,
				masterId: req.masterId,
				module: 'tc'
			},
		}),
	])
	.then(([data, instituteData, classData, signatureData])=> ({status: true, data, instituteData, classData, signatureData}));
};

exports.saveTC = function (req) {
	var endDate = moment(req.academicSessionsEndDate).format('YYYY-MM-DD');
	return Promise.all([
		models.transfercertificate.bulkCreate(req.tcData, {
			updateOnDuplicate: ['releaving_date', 'conduct', 'result'],
			ignoreDuplicates:true
		})
	]).then(([data]) => {
		let stRecord = [];
		req.tcData.map(item => {
			stRecord.push(models.studentrecord.update({
				record_status: 0
			}, {
				where: {
					studentId: item.studentId,
					transferred: 2,
					transerred_effective_from: {$gte: item.releaving_date}
				}
			}))
		}),
		req.tcData.forEach(item => {
			stRecord.push(models.studentrecord.update({
				record_status: 0,
			}, {
				where: {
					promoted: models.sequelize.literal(
						`(SELECT academic_sessions.id FROM academic_sessions WHERE academic_sessions.id = student_records.academicSessionId AND academic_sessions.start_date >= "${item.releaving_date}")`
					),
					studentId: item.studentId,
				}
			}))
		});
		/*req.tcData.map(item => {
			stRecord.push(models.studentrecord.update({
				record_status: 0
			}, {
				where: {
					studentId: item.studentId,
					promoted: 0,
					academicSessionId: nextSessionId.id
				}
			}))
		});*/
		return Promise.all(stRecord).then(() => {
			return data;
		});
	});
};
